import {
  BITCOIN_BLOCK_TIME_MINUTES,
  BITCOIN_HALVING_INTERVAL_BLOCKS,
} from "@/lib/constants/bitcoinProtocol";

export type BitcoinLiveMetrics = {
  blockHeight: number | null;
  feeFast: number | null;
  feeHalfHour: number | null;
  feeHour: number | null;
  hashrateEh: number | null;
  mempoolTxCount: number | null;
  mempoolVsizeMb: number | null;
  recentTxIds: string[];
  recentTxs: RecentMempoolTx[];
  blocksUntilHalving: number | null;
  daysUntilHalving: number | null;
  lastUpdated: string;
  source: "rawblock" | "mempool" | "blockstream" | "mixed" | "unavailable";
};

export type RecentMempoolTx = {
  txid: string;
  feeSat: number | null;
  vsize: number | null;
  feeRate: number | null;
  time: number | null;
};

const MEMPOOL_API = "https://mempool.space/api";
const BLOCKSTREAM_API = "https://blockstream.info/api";
const RAWBLOCK_API_FALLBACK = "https://api.rawblock.net";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveRawblockApiBaseUrl(): string {
  const explicit =
    (typeof process.env.RAWBLOCK_API_URL === "string" ? process.env.RAWBLOCK_API_URL : "") ||
    (typeof process.env.NEXT_PUBLIC_API_URL === "string" ? process.env.NEXT_PUBLIC_API_URL : "");

  if (explicit && explicit.trim().length > 0) {
    return normalizeBaseUrl(explicit.trim());
  }

  return RAWBLOCK_API_FALLBACK;
}

async function fetchWithTimeout(url: string, init: RequestInit & { next?: { revalidate?: number } }, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonWithRevalidate<T>(url: string, revalidate = 30, timeoutMs = 8_000): Promise<T> {
  const response = await fetchWithTimeout(url, { next: { revalidate } }, timeoutMs);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchTextWithRevalidate(url: string, revalidate = 30, timeoutMs = 8_000): Promise<string> {
  const response = await fetchWithTimeout(url, { next: { revalidate } }, timeoutMs);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }
  return response.text();
}

async function fetchBlockHeight(): Promise<{ height: number | null; source: "mempool" | "blockstream" | "unavailable" }> {
  try {
    const tip = await fetchTextWithRevalidate(`${MEMPOOL_API}/blocks/tip/height`);
    return { height: Number.parseInt(tip, 10), source: "mempool" };
  } catch {
    try {
      const tip = await fetchTextWithRevalidate(`${BLOCKSTREAM_API}/blocks/tip/height`);
      return { height: Number.parseInt(tip, 10), source: "blockstream" };
    } catch {
      return { height: null, source: "unavailable" };
    }
  }
}

async function fetchFees(): Promise<{
  feeFast: number | null;
  feeHalfHour: number | null;
  feeHour: number | null;
  source: "mempool" | "blockstream" | "unavailable";
}> {
  const normalizeFee = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined || !Number.isFinite(value)) return null;
    // Preserve actual fee precision (e.g., 0.2 sat/vB) for low-fee market conditions.
    return Number(value.toFixed(2));
  };

  try {
    const fees = await fetchJsonWithRevalidate<{
      fastestFee: number;
      halfHourFee: number;
      hourFee: number;
    }>(`${MEMPOOL_API}/v1/fees/recommended`);

    return {
      feeFast: normalizeFee(fees.fastestFee),
      feeHalfHour: normalizeFee(fees.halfHourFee),
      feeHour: normalizeFee(fees.hourFee),
      source: "mempool",
    };
  } catch {
    try {
      const estimates = await fetchJsonWithRevalidate<Record<string, number>>(
        `${BLOCKSTREAM_API}/fee-estimates`,
      );
      return {
        feeFast: normalizeFee(estimates["1"] ?? null),
        feeHalfHour: normalizeFee(estimates["3"] ?? estimates["2"] ?? null),
        feeHour: normalizeFee(estimates["6"] ?? null),
        source: "blockstream",
      };
    } catch {
      return {
        feeFast: null,
        feeHalfHour: null,
        feeHour: null,
        source: "unavailable",
      };
    }
  }
}

type RawblockNetworkStatsResponse = {
  blocks?: unknown;
  hashrate?: unknown;
  fees?: {
    fast?: unknown;
    medium?: unknown;
    slow?: unknown;
  };
};

function parseFeeFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Number(value.toFixed(2));
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
  }
  return null;
}

async function fetchRawblockNetworkStats(baseUrl: string): Promise<{
  blockHeight: number | null;
  feeFast: number | null;
  feeHalfHour: number | null;
  feeHour: number | null;
  hashrateEh: number | null;
  source: "rawblock" | "unavailable";
}> {
  try {
    const payload = await fetchJsonWithRevalidate<RawblockNetworkStatsResponse>(
      `${baseUrl}/api/network-stats`,
      30,
      3_500,
    );

    const height =
      typeof payload.blocks === "number" && Number.isFinite(payload.blocks) ? payload.blocks : null;

    const rawHashrate =
      typeof payload.hashrate === "number" && Number.isFinite(payload.hashrate) ? payload.hashrate : null;
    const normalizedEh = rawHashrate === null ? null : normalizeHashrateToEh(rawHashrate);
    const hashrateEh =
      normalizedEh === null || !Number.isFinite(normalizedEh) ? null : Number(normalizedEh.toFixed(2));

    const fees = payload.fees ?? {};
    const feeFast = parseFeeFromUnknown(fees.fast);
    const feeHalfHour = parseFeeFromUnknown(fees.medium);
    const feeHour = parseFeeFromUnknown(fees.slow);

    return {
      blockHeight: height,
      feeFast,
      feeHalfHour,
      feeHour,
      hashrateEh,
      source: "rawblock",
    };
  } catch {
    return {
      blockHeight: null,
      feeFast: null,
      feeHalfHour: null,
      feeHour: null,
      hashrateEh: null,
      source: "unavailable",
    };
  }
}

type RawblockMempoolSummaryResponse = {
  count?: unknown;
  bytes?: unknown;
  usage?: unknown;
  size?: unknown;
};

async function fetchRawblockMempoolSummary(baseUrl: string): Promise<{
  mempoolTxCount: number | null;
  mempoolVsizeMb: number | null;
  source: "rawblock" | "unavailable";
}> {
  try {
    const payload = await fetchJsonWithRevalidate<RawblockMempoolSummaryResponse>(
      `${baseUrl}/api/mempool-summary`,
      30,
      3_500,
    );

    const countRaw = payload.count ?? payload.size;
    const bytesRaw = payload.bytes ?? payload.usage;
    const mempoolTxCount =
      typeof countRaw === "number" && Number.isFinite(countRaw) && countRaw >= 0 ? countRaw : null;
    const mempoolVsizeMb =
      typeof bytesRaw === "number" && Number.isFinite(bytesRaw) && bytesRaw >= 0
        ? Number((bytesRaw / 1_000_000).toFixed(0))
        : null;

    return { mempoolTxCount, mempoolVsizeMb, source: "rawblock" };
  } catch {
    return { mempoolTxCount: null, mempoolVsizeMb: null, source: "unavailable" };
  }
}

type RawblockMempoolRecentTx = {
  txid?: unknown;
  fee?: unknown;
  size?: unknown;
  vsize?: unknown;
  time?: unknown;
};

function normalizeFeeToSat(value: unknown): number | null {
  const fee = typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : NaN;
  if (!Number.isFinite(fee) || fee < 0) return null;
  // Heuristic: local node mempool entries usually express fee in BTC; public APIs often use sats.
  // If it's < 1, assume BTC and convert to sats. Otherwise treat as sats.
  const sats = fee < 1 ? fee * 100_000_000 : fee;
  return Number.isFinite(sats) ? Math.round(sats) : null;
}

async function fetchRawblockMempoolRecent(baseUrl: string): Promise<{
  recentTxIds: string[];
  recentTxs: RecentMempoolTx[];
  source: "rawblock" | "unavailable";
}> {
  try {
    const payload = await fetchJsonWithRevalidate<RawblockMempoolRecentTx[]>(
      `${baseUrl}/api/mempool-recent`,
      15,
      3_500,
    );

    const recentTxs = (Array.isArray(payload) ? payload : [])
      .map((item) => {
        const txid = typeof item.txid === "string" ? item.txid : "";
        const feeSat = normalizeFeeToSat(item.fee);
        const vsizeRaw = item.size ?? item.vsize;
        const vsize = typeof vsizeRaw === "number" && Number.isFinite(vsizeRaw) && vsizeRaw > 0 ? vsizeRaw : null;
        const time = typeof item.time === "number" && Number.isFinite(item.time) && item.time > 0 ? item.time : null;
        const feeRate =
          feeSat !== null && vsize !== null ? Number((feeSat / vsize).toFixed(2)) : null;

        return {
          txid,
          feeSat,
          vsize,
          feeRate,
          time,
        } satisfies RecentMempoolTx;
      })
      .filter((row) => row.txid.length > 12)
      .slice(0, 5);

    return { recentTxs, recentTxIds: recentTxs.map((tx) => tx.txid), source: "rawblock" };
  } catch {
    return { recentTxs: [], recentTxIds: [], source: "unavailable" };
  }
}

type MempoolHashrateResponse =
  | Array<{ timestamp: number; avgHashrate: number }>
  | {
      hashrates?: Array<{ timestamp: number; avgHashrate: number }>;
      currentHashrate?: number;
    };

function normalizeHashrateToEh(rawHashrate: number): number | null {
  if (!Number.isFinite(rawHashrate) || rawHashrate <= 0) return null;

  const absolute = Math.abs(rawHashrate);

  // Upstream providers may expose hashrate in H/s, TH/s, PH/s, or EH/s.
  // Normalize to EH/s defensively to avoid 1000x display mistakes.
  if (absolute >= 1e15) return rawHashrate / 1e18; // H/s -> EH/s
  if (absolute >= 1e9) return rawHashrate / 1e6; // TH/s -> EH/s
  if (absolute >= 1e4) return rawHashrate / 1e3; // PH/s -> EH/s
  return rawHashrate; // Already EH/s
}

async function fetchHashrateEh(): Promise<{ hashrateEh: number | null; source: "mempool" | "unavailable" }> {
  try {
    const payload = await fetchJsonWithRevalidate<MempoolHashrateResponse>(
      `${MEMPOOL_API}/v1/mining/hashrate/3d`,
    );

    const series = Array.isArray(payload) ? payload : payload.hashrates ?? [];
    const latestFromSeries = series.length ? series[series.length - 1]?.avgHashrate : null;
    const currentHashrate =
      !Array.isArray(payload) && typeof payload.currentHashrate === "number"
        ? payload.currentHashrate
        : null;

    const hashrate = latestFromSeries ?? currentHashrate;
    if (hashrate === null || !Number.isFinite(hashrate)) {
      return { hashrateEh: null, source: "unavailable" };
    }

    const eh = normalizeHashrateToEh(hashrate);
    if (eh === null || !Number.isFinite(eh)) {
      return { hashrateEh: null, source: "unavailable" };
    }

    return { hashrateEh: Number(eh.toFixed(2)), source: "mempool" };
  } catch {
    return { hashrateEh: null, source: "unavailable" };
  }
}

async function fetchMempoolSnapshot(): Promise<{
  mempoolTxCount: number | null;
  mempoolVsizeMb: number | null;
  recentTxIds: string[];
  recentTxs: RecentMempoolTx[];
  source: "mempool" | "unavailable";
}> {
  try {
    const [mempool, recent] = await Promise.all([
      fetchJsonWithRevalidate<{ count: number; vsize: number }>(`${MEMPOOL_API}/mempool`),
      fetchJsonWithRevalidate<
        Array<{ txid?: string; fee?: number; vsize?: number; value?: number; time?: number }>
      >(`${MEMPOOL_API}/mempool/recent`),
    ]);

    const mempoolTxCount = Number.isFinite(mempool.count) ? mempool.count : null;
    const mempoolVsizeMb =
      Number.isFinite(mempool.vsize) ? Number((mempool.vsize / 1_000_000).toFixed(0)) : null;
    const recentTxs = (recent ?? [])
      .map((item) => {
        const txid = typeof item.txid === "string" ? item.txid : "";
        const feeSat = Number(item.fee);
        const vsize = Number(item.vsize);
        const time = Number(item.time);
        const safeFeeSat = Number.isFinite(feeSat) && feeSat >= 0 ? feeSat : null;
        const safeVsize = Number.isFinite(vsize) && vsize > 0 ? vsize : null;
        const safeTime = Number.isFinite(time) && time > 0 ? time : null;
        const feeRate =
          safeFeeSat !== null && safeVsize !== null
            ? Number((safeFeeSat / safeVsize).toFixed(2))
            : null;

        return {
          txid,
          feeSat: safeFeeSat,
          vsize: safeVsize,
          feeRate,
          time: safeTime,
        } satisfies RecentMempoolTx;
      })
      .filter((item) => item.txid.length > 12)
      .slice(0, 5);
    const recentTxIds = recentTxs.map((item) => item.txid);

    return { mempoolTxCount, mempoolVsizeMb, recentTxIds, recentTxs, source: "mempool" };
  } catch {
    return {
      mempoolTxCount: null,
      mempoolVsizeMb: null,
      recentTxIds: [],
      recentTxs: [],
      source: "unavailable",
    };
  }
}

function resolveSource(...sources: Array<BitcoinLiveMetrics["source"] | "rawblock" | "blockstream" | "mempool" | "unavailable">): BitcoinLiveMetrics["source"] {
  const uniq = new Set(sources.filter((source) => source !== "unavailable"));
  if (uniq.size === 0) return "unavailable";
  if (uniq.size === 1) return [...uniq][0] as BitcoinLiveMetrics["source"];
  return "mixed";
}

export async function getBitcoinLiveMetrics(): Promise<BitcoinLiveMetrics> {
  const rawblockBase = resolveRawblockApiBaseUrl();

  const [rawblockNetwork, rawblockMempool, rawblockRecent] = await Promise.all([
    fetchRawblockNetworkStats(rawblockBase),
    fetchRawblockMempoolSummary(rawblockBase),
    fetchRawblockMempoolRecent(rawblockBase),
  ]);

  const needsPublicHeight = rawblockNetwork.blockHeight === null;
  const needsPublicFees =
    rawblockNetwork.feeFast === null || rawblockNetwork.feeHalfHour === null || rawblockNetwork.feeHour === null;
  const needsPublicHashrate = rawblockNetwork.hashrateEh === null;
  const needsPublicMempool =
    rawblockMempool.mempoolTxCount === null ||
    rawblockMempool.mempoolVsizeMb === null ||
    rawblockRecent.recentTxs.length === 0;

  const [publicHeight, publicFees, publicHashrate, publicMempool] = await Promise.all([
    needsPublicHeight ? fetchBlockHeight() : Promise.resolve({ height: null, source: "unavailable" as const }),
    needsPublicFees ? fetchFees() : Promise.resolve({ feeFast: null, feeHalfHour: null, feeHour: null, source: "unavailable" as const }),
    needsPublicHashrate ? fetchHashrateEh() : Promise.resolve({ hashrateEh: null, source: "unavailable" as const }),
    needsPublicMempool ? fetchMempoolSnapshot() : Promise.resolve({ mempoolTxCount: null, mempoolVsizeMb: null, recentTxIds: [], recentTxs: [], source: "unavailable" as const }),
  ]);

  const blockHeight =
    rawblockNetwork.blockHeight ?? (needsPublicHeight ? publicHeight.height : null);
  const heightSource =
    rawblockNetwork.blockHeight !== null ? rawblockNetwork.source : publicHeight.source;

  const feeFast =
    rawblockNetwork.feeFast ?? (needsPublicFees ? publicFees.feeFast : null);
  const feeHalfHour =
    rawblockNetwork.feeHalfHour ?? (needsPublicFees ? publicFees.feeHalfHour : null);
  const feeHour =
    rawblockNetwork.feeHour ?? (needsPublicFees ? publicFees.feeHour : null);
  const feeSource =
    rawblockNetwork.feeFast !== null && rawblockNetwork.feeHalfHour !== null && rawblockNetwork.feeHour !== null
      ? rawblockNetwork.source
      : publicFees.source;

  const hashrateEh =
    rawblockNetwork.hashrateEh ?? (needsPublicHashrate ? publicHashrate.hashrateEh : null);
  const hashrateSource =
    rawblockNetwork.hashrateEh !== null ? rawblockNetwork.source : publicHashrate.source;

  const mempoolTxCount =
    rawblockMempool.mempoolTxCount ?? (needsPublicMempool ? publicMempool.mempoolTxCount : null);
  const mempoolVsizeMb =
    rawblockMempool.mempoolVsizeMb ?? (needsPublicMempool ? publicMempool.mempoolVsizeMb : null);
  const recentTxs =
    rawblockRecent.recentTxs.length > 0 ? rawblockRecent.recentTxs : publicMempool.recentTxs;
  const recentTxIds =
    recentTxs.length > 0 ? recentTxs.map((tx) => tx.txid) : publicMempool.recentTxIds;

  const mempoolSource =
    rawblockMempool.mempoolTxCount !== null &&
    rawblockMempool.mempoolVsizeMb !== null &&
    rawblockRecent.recentTxs.length > 0
      ? "rawblock"
      : rawblockMempool.mempoolTxCount !== null || rawblockRecent.recentTxs.length > 0
        ? "mixed"
        : publicMempool.source;

  const blocksUntilHalving =
    blockHeight === null
      ? null
      : BITCOIN_HALVING_INTERVAL_BLOCKS - (blockHeight % BITCOIN_HALVING_INTERVAL_BLOCKS);
  const daysUntilHalving =
    blocksUntilHalving === null
      ? null
      : Math.ceil((blocksUntilHalving * BITCOIN_BLOCK_TIME_MINUTES) / (60 * 24));

  return {
    blockHeight,
    feeFast,
    feeHalfHour,
    feeHour,
    hashrateEh,
    mempoolTxCount,
    mempoolVsizeMb,
    recentTxIds,
    recentTxs,
    blocksUntilHalving,
    daysUntilHalving,
    lastUpdated: new Date().toISOString(),
    source: resolveSource(mempoolSource, heightSource, feeSource, hashrateSource),
  };
}
