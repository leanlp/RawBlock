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

const CORE_TIMEOUT_MS = 1_000;
const PANEL_TIMEOUT_MS = 2_000;

function getGatewayUrl() {
  for (const configured of [process.env.RAWBLOCK_API_URL, process.env.NEXT_PUBLIC_API_URL]) {
    if (!configured?.trim()) continue;
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
      }
    } catch {
      // Try the alternate deployment variable.
    }
  }
  return "https://apigoland.rawblock.net";
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
  base: string,
  path: string,
  timeoutMs: number,
  parse: (data: unknown) => T | null,
): Promise<HeroReading<T>> {
  const response = await fetch(`${base}/api/${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Hero ${path} HTTP ${response.status}`);
  const value = parse(await response.json());
  if (value === null) throw new Error(`Invalid hero ${path} payload`);
  const rawSource = response.headers.get("x-rawblock-data-source");
  const source = rawSource === "local_node" ? "node" : rawSource === "fallback" || rawSource === "public_api" ? "fallback" : "unknown";
  const parsedTime = Date.parse(response.headers.get("x-rawblock-updated-at") ?? "");
  const retrievedAt = Date.now();
  const observedAt = Number.isFinite(parsedTime) && parsedTime <= retrievedAt + 5_000 ? parsedTime : null;
  return { value, source, observedAt, retrievedAt, fromDisk: response.headers.get("x-rawblock-cache") === "disk" };
}

function makeCachedReader<T>(path: string, timeoutMs: number, parse: (data: unknown) => T | null, revalidate: number) {
  const inFlight = new Map<string, Promise<HeroReading<T>>>();
  return unstable_cache((base: string) => {
    const pending = inFlight.get(base);
    if (pending) return pending;
    const next = readUpstream(base, path, timeoutMs, parse).finally(() => inFlight.delete(base));
    inFlight.set(base, next);
    return next;
  }, [`hero-${path}-v1`], { revalidate });
}

const readNetwork = makeCachedReader("network-stats", CORE_TIMEOUT_MS, parseHeroNetworkStats, 15);
const readMempool = makeCachedReader("vitals", CORE_TIMEOUT_MS, parseHeroVitals, 10);
const readRecentTransactions = makeCachedReader("mempool-recent", PANEL_TIMEOUT_MS, parseHeroRecent, 10);
const readFeeHistory = makeCachedReader("fee-history", PANEL_TIMEOUT_MS, parseHeroHistory, 30);

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
  const base = getGatewayUrl();
  const [network, mempool] = base ? await Promise.all([
    readWithinBudget(readNetwork(base), CORE_TIMEOUT_MS, "network-stats"),
    readWithinBudget(readMempool(base), CORE_TIMEOUT_MS, "vitals"),
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
  const base = getGatewayUrl();
  if (!base) return null;
  const reading = await readWithinBudget(readRecentTransactions(base), PANEL_TIMEOUT_MS, "mempool-recent");
  return displayableHeroReading(reading, Date.now());
}

export async function getHeroHistoryMetrics(): Promise<HeroHistoryMetrics | null> {
  const base = getGatewayUrl();
  if (!base) return null;
  const reading = await readWithinBudget(readFeeHistory(base), PANEL_TIMEOUT_MS, "fee-history");
  return displayableHeroReading(reading, Date.now());
}
