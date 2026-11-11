import { unstable_cache } from "next/cache";
import { convertHashrateToEh } from "@/lib/hashrate";
import type { RecentMempoolTx } from "@/lib/bitcoinData";
import {
  displayableHeroReading,
  type HeroCoreMetrics,
  type HeroFeeHistoryPoint,
  type HeroFees,
  type HeroHistoryMetrics,
  type HeroReading,
  type HeroRecentMetrics,
} from "@/lib/heroMetrics";

// The gateway has its own 1.7s origin deadline. Allow time for both network
// legs and JSON parsing; cache lookup overhead must not consume that budget.
const UPSTREAM_TIMEOUT_MS = 2_500;
const RESPONSE_TIMEOUT_MS = 3_500;

type HeroGateway = { base: string; authenticated: boolean };

function getHeroGateway(): HeroGateway | null {
  const privateUrl = process.env.RAWBLOCK_HERO_API_URL?.trim();
  const token = process.env.RAWBLOCK_HERO_API_TOKEN?.trim();
  if (privateUrl || token) {
    try {
      const url = new URL(privateUrl ?? "");
      if (url.protocol === "https:" && !url.username && !url.password &&
          url.pathname === "/" && !url.search && !url.hash && /^[a-f0-9]{64}$/.test(token ?? "")) {
        return { base: url.origin, authenticated: true };
      }
    } catch {
      // An invalid deployment URL cannot receive the gateway credential.
    }
    console.warn("RawBlock private hero gateway configuration is invalid");
    return null;
  }

  for (const configured of [process.env.RAWBLOCK_API_URL, process.env.NEXT_PUBLIC_API_URL]) {
    if (!configured?.trim()) continue;
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") {
        const base = url.origin + url.pathname.replace(/\/+$/, "").replace(/\/api$/, "");
        return { base, authenticated: false };
      }
    } catch {
      // Try the alternate deployment variable.
    }
  }
  return { base: "https://apigoland.rawblock.net", authenticated: false };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nonnegative(value: unknown): number | null {
  if (typeof value === "string" && value.trim()) value = Number(value);
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function wholeNumber(value: unknown): number | null {
  const number = nonnegative(value);
  return number !== null && Number.isSafeInteger(number) ? number : null;
}

function readFees(raw: unknown): HeroFees | null {
  const fields = record(raw);
  if (!fields) return null;
  const fees = {
    fast: nonnegative(fields.fast),
    medium: nonnegative(fields.medium),
    slow: nonnegative(fields.slow),
  };
  return Object.values(fees).some(value => value !== null) ? fees : null;
}

export function parseHeroNetworkStats(raw: unknown) {
  const payload = record(raw);
  const height = wholeNumber(payload?.height);
  const hashrateHs = nonnegative(payload?.hashrate);
  const hashrate = hashrateHs === null ? null : convertHashrateToEh(hashrateHs, "H/s");
  const fees = readFees(payload?.fees);
  return height !== null || hashrate !== null || fees !== null ? { height, hashrate, fees } : null;
}

export function parseHeroVitals(raw: unknown) {
  const mempool = record(record(raw)?.mempool);
  const count = wholeNumber(mempool?.size);
  const vsize = wholeNumber(mempool?.bytes);
  return count === null && vsize === null ? null : { count, vsizeMb: vsize === null ? null : vsize / 1_000_000 };
}

export function parseHeroRecent(raw: unknown): RecentMempoolTx[] | null {
  if (!Array.isArray(raw)) return null;
  const transactions: RecentMempoolTx[] = [];
  for (const row of raw) {
    const fields = record(row);
    const txid = fields?.txid;
    if (typeof txid !== "string" || !/^[a-f0-9]{64}$/i.test(txid)) continue;
    const feeBtc = nonnegative(fields?.fee);
    const convertedFee = feeBtc === null ? null : Math.round(feeBtc * 100_000_000);
    const feeSat = convertedFee !== null && Number.isSafeInteger(convertedFee) ? convertedFee : null;
    const vsize = wholeNumber(fields?.size);
    const time = wholeNumber(fields?.time);
    transactions.push({
      txid,
      feeSat,
      vsize: vsize !== null && vsize > 0 ? vsize : null,
      feeRate: feeSat !== null && vsize !== null && vsize > 0 ? feeSat / vsize : null,
      time: time !== null && time > 0 ? time : null,
    });
    if (transactions.length === 3) break;
  }
  return raw.length === 0 || transactions.length > 0 ? transactions : null;
}

export function parseHeroHistory(raw: unknown): HeroFeeHistoryPoint[] | null {
  if (!Array.isArray(raw)) return null;
  const points = new Map<number, HeroFeeHistoryPoint>();
  for (const row of raw) {
    const fields = record(row);
    const timestamp = wholeNumber(fields?.timestamp);
    const fees = readFees(fields);
    if (!timestamp || !fees || fees.fast === null || fees.medium === null || fees.slow === null) continue;
    points.set(timestamp, { timestamp, fast: fees.fast, medium: fees.medium, slow: fees.slow });
  }
  return raw.length === 0 || points.size > 0
    ? [...points.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-1_440)
    : null;
}

async function readUpstream<T>(
  gateway: HeroGateway,
  path: string,
  timeoutMs: number,
  parse: (data: unknown) => T | null,
): Promise<HeroReading<T>> {
  const headers = new Headers({ Accept: "application/json" });
  if (gateway.authenticated) {
    headers.set("Authorization", `Bearer ${process.env.RAWBLOCK_HERO_API_TOKEN?.trim()}`);
  }
  const response = await fetch(`${gateway.base}/api/${path}`, {
    cache: "no-store",
    headers,
    redirect: gateway.authenticated ? "error" : "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    const challenge = response.headers.get("cf-mitigated") === "challenge" ? " (gateway challenge)" : "";
    throw new Error(`Hero ${path} HTTP ${response.status}${challenge}`);
  }
  const value = parse(await response.json());
  if (value === null) throw new Error(`Invalid hero ${path} payload`);
  const rawSource = response.headers.get("x-rawblock-data-source");
  const source = rawSource === "local_node" ? "node" : rawSource === "fallback" || rawSource === "public_api" ? "fallback" : "unknown";
  const parsedTime = Date.parse(response.headers.get("x-rawblock-updated-at") ?? "");
  const retrievedAt = Date.now();
  const observedAt = Number.isFinite(parsedTime) && parsedTime <= retrievedAt + 5_000 ? parsedTime : null;
  const reading = { value, source, observedAt, retrievedAt, fromDisk: response.headers.get("x-rawblock-cache") === "disk" } satisfies HeroReading<T>;
  // Throw rather than caching an expired response over a usable observation.
  // Next's data cache retains the last successful value on revalidation error.
  if (!displayableHeroReading(reading, retrievedAt)) throw new Error(`Expired hero ${path} observation`);
  return reading;
}

function makeCachedReader<T>(path: string, timeoutMs: number, parse: (data: unknown) => T | null, revalidate: number) {
  const inFlight = new Map<string, Promise<HeroReading<T>>>();
  return unstable_cache((gateway: HeroGateway) => {
    const key = `${gateway.authenticated}:${gateway.base}`;
    const pending = inFlight.get(key);
    if (pending) return pending;
    const next = readUpstream(gateway, path, timeoutMs, parse).finally(() => inFlight.delete(key));
    inFlight.set(key, next);
    return next;
  }, [`hero-${path}-v1`], { revalidate });
}

const readNetwork = makeCachedReader("network-stats", UPSTREAM_TIMEOUT_MS, parseHeroNetworkStats, 15);
const readMempool = makeCachedReader("vitals", UPSTREAM_TIMEOUT_MS, parseHeroVitals, 10);
const readRecentTransactions = makeCachedReader("mempool-recent", UPSTREAM_TIMEOUT_MS, parseHeroRecent, 10);
const readFeeHistory = makeCachedReader("fee-history", UPSTREAM_TIMEOUT_MS, parseHeroHistory, 30);

async function readWithinBudget<T>(read: Promise<T>, timeoutMs: number, path: string): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      read,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Deadline exceeded")), timeoutMs);
      }),
    ]);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.warn("RawBlock hero snapshot unavailable", { path, detail });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickValue<T, K extends keyof T>(reading: HeroReading<T> | null, key: K): HeroReading<NonNullable<T[K]>> | null {
  const value = reading?.value[key];
  return reading && value != null ? { ...reading, value } : null;
}

export async function getHeroCoreMetrics(): Promise<HeroCoreMetrics> {
  const gateway = getHeroGateway();
  const [network, mempool] = gateway ? await Promise.all([
    readWithinBudget(readNetwork(gateway), RESPONSE_TIMEOUT_MS, "network-stats"),
    readWithinBudget(readMempool(gateway), RESPONSE_TIMEOUT_MS, "vitals"),
  ]) : [null, null];
  const checkedAt = Date.now();
  const validNetwork = displayableHeroReading(network, checkedAt);
  return {
    height: pickValue(validNetwork, "height"),
    hashrate: pickValue(validNetwork, "hashrate"),
    fees: pickValue(validNetwork, "fees"),
    mempool: displayableHeroReading(mempool, checkedAt),
    checkedAt,
  };
}

export async function getHeroRecentMetrics(): Promise<HeroRecentMetrics | null> {
  const gateway = getHeroGateway();
  if (!gateway) return null;
  const reading = await readWithinBudget(readRecentTransactions(gateway), RESPONSE_TIMEOUT_MS, "mempool-recent");
  return displayableHeroReading(reading, Date.now());
}

export async function getHeroHistoryMetrics(): Promise<HeroHistoryMetrics | null> {
  const gateway = getHeroGateway();
  if (!gateway) return null;
  const reading = await readWithinBudget(readFeeHistory(gateway), RESPONSE_TIMEOUT_MS, "fee-history");
  return displayableHeroReading(reading, Date.now());
}
