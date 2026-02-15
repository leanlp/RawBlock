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
  source: "mempool" | "blockstream" | "mixed" | "unavailable";
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

async function fetchJsonWithRevalidate<T>(url: string, revalidate = 30): Promise<T> {
  const response = await fetch(url, { next: { revalidate } });
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchTextWithRevalidate(url: string, revalidate = 30): Promise<string> {
  const response = await fetch(url, { next: { revalidate } });
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }
  return response.text();
}

async function fetchBlockHeight(): Promise<{
  height: number | null;
  source: "mempool" | "blockstream" | "unavailable";
}> {
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

async function fetchHashrateEh(): Promise<{
  hashrateEh: number | null;
  source: "mempool" | "unavailable";
}> {
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
      .filter((row) => row.txid.length > 12)
      .slice(0, 5);

    return {
      mempoolTxCount,
      mempoolVsizeMb,
      recentTxIds: recentTxs.map((tx) => tx.txid),
      recentTxs,
      source: "mempool",
    };
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

function resolveSource(
  ...sources: Array<BitcoinLiveMetrics["source"] | "blockstream" | "mempool" | "unavailable">
): BitcoinLiveMetrics["source"] {
  const uniq = new Set(sources.filter((source) => source !== "unavailable"));
  if (uniq.size === 0) return "unavailable";
  if (uniq.size === 1) return [...uniq][0] as BitcoinLiveMetrics["source"];
  return "mixed";
}

export async function getBitcoinLiveMetrics(): Promise<BitcoinLiveMetrics> {
  const [mempoolData, heightData, feeData, hashrateData] = await Promise.all([
    fetchMempoolSnapshot(),
    fetchBlockHeight(),
    fetchFees(),
    fetchHashrateEh(),
  ]);

  const blockHeight = heightData.height;
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
    feeFast: feeData.feeFast,
    feeHalfHour: feeData.feeHalfHour,
    feeHour: feeData.feeHour,
    hashrateEh: hashrateData.hashrateEh,
    mempoolTxCount: mempoolData.mempoolTxCount,
    mempoolVsizeMb: mempoolData.mempoolVsizeMb,
    recentTxIds: mempoolData.recentTxIds,
    recentTxs: mempoolData.recentTxs,
    blocksUntilHalving,
    daysUntilHalving,
    lastUpdated: new Date().toISOString(),
    source: resolveSource(mempoolData.source, heightData.source, feeData.source, hashrateData.source),
  };
}

