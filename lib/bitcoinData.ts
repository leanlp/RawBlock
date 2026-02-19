import {
  BITCOIN_BLOCK_TIME_MINUTES,
  BITCOIN_HALVING_INTERVAL_BLOCKS,
} from "@/lib/constants/bitcoinProtocol";
import { convertHashrateToEh, normalizeHashrateToEh } from "@/lib/hashrate";

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
  provenance: BitcoinMetricProvenanceMap;
};

export type BitcoinMetricUpstream =
  | "rawblock"
  | "electrs"
  | "mempool"
  | "blockstream"
  | "mixed"
  | "unavailable";

export type BitcoinMetricSourceClass =
  | "local-node"
  | "electrs"
  | "fallback"
  | "mixed"
  | "unavailable";

export type BitcoinMetricProvenance = {
  sourceClass: BitcoinMetricSourceClass;
  upstream: BitcoinMetricUpstream;
  timestamp: string;
};

export type BitcoinMetricProvenanceMap = {
  blockHeight: BitcoinMetricProvenance;
  hashrate: BitcoinMetricProvenance;
  fees: BitcoinMetricProvenance;
  halving: BitcoinMetricProvenance;
  mempool: BitcoinMetricProvenance;
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
const NODE_GATEWAY_API =
  process.env.RAWBLOCK_API_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  null;

type NodeNetworkStatsResponse = {
  height?: number;
  hashrate?: number;
  fees?: {
    fast?: number;
    medium?: number;
    slow?: number;
  };
};

type NodeVitalsResponse = {
  mempool?: {
    size?: number;
    bytes?: number;
  };
  peers?: number;
};

type NodeMempoolRecentEntry = {
  txid?: string;
  fee?: number; // BTC
  size?: number; // vsize
  time?: number;
};

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

function normalizeSatVB(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  // Preserve actual fee precision (e.g., 0.2 sat/vB) for low-fee market conditions.
  return Number(value.toFixed(2));
}

async function fetchFees(): Promise<{
  feeFast: number | null;
  feeHalfHour: number | null;
  feeHour: number | null;
  source: "mempool" | "blockstream" | "unavailable";
}> {
  try {
    const fees = await fetchJsonWithRevalidate<{
      fastestFee: number;
      halfHourFee: number;
      hourFee: number;
    }>(`${MEMPOOL_API}/v1/fees/recommended`);

    return {
      feeFast: normalizeSatVB(fees.fastestFee),
      feeHalfHour: normalizeSatVB(fees.halfHourFee),
      feeHour: normalizeSatVB(fees.hourFee),
      source: "mempool",
    };
  } catch {
    try {
      const estimates = await fetchJsonWithRevalidate<Record<string, number>>(
        `${BLOCKSTREAM_API}/fee-estimates`,
      );
      return {
        feeFast: normalizeSatVB(estimates["1"] ?? null),
        feeHalfHour: normalizeSatVB(estimates["3"] ?? estimates["2"] ?? null),
        feeHour: normalizeSatVB(estimates["6"] ?? null),
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

async function fetchNodeGatewaySnapshot(): Promise<{
  blockHeight: number | null;
  feeFast: number | null;
  feeHalfHour: number | null;
  feeHour: number | null;
  hashrateEh: number | null;
  mempoolTxCount: number | null;
  mempoolVsizeMb: number | null;
  recentTxIds: string[];
  recentTxs: RecentMempoolTx[];
  source: "rawblock" | "unavailable";
}> {
  if (!NODE_GATEWAY_API) {
    return {
      blockHeight: null,
      feeFast: null,
      feeHalfHour: null,
      feeHour: null,
      hashrateEh: null,
      mempoolTxCount: null,
      mempoolVsizeMb: null,
      recentTxIds: [],
      recentTxs: [],
      source: "unavailable",
    };
  }

  let blockHeight: number | null = null;
  let feeFast: number | null = null;
  let feeHalfHour: number | null = null;
  let feeHour: number | null = null;
  let hashrateEh: number | null = null;
  let mempoolTxCount: number | null = null;
  let mempoolVsizeMb: number | null = null;
  let recentTxs: RecentMempoolTx[] = [];

  try {
    const stats = await fetchJsonWithRevalidate<NodeNetworkStatsResponse>(
      `${NODE_GATEWAY_API}/api/network-stats`,
      10,
    );
    const height = Number(stats?.height);
    blockHeight = Number.isFinite(height) ? height : null;

    feeFast = normalizeSatVB(Number(stats?.fees?.fast ?? NaN));
    feeHalfHour = normalizeSatVB(Number(stats?.fees?.medium ?? NaN));
    feeHour = normalizeSatVB(Number(stats?.fees?.slow ?? NaN));

    const rawHashrate = Number(stats?.hashrate ?? NaN);
    if (Number.isFinite(rawHashrate)) {
      const eh = convertHashrateToEh(rawHashrate, "H/s");
      hashrateEh = eh !== null && Number.isFinite(eh) ? Number(eh.toFixed(2)) : null;
    }
  } catch {
    // Keep fallback path available.
  }

  try {
    const vitals = await fetchJsonWithRevalidate<NodeVitalsResponse>(`${NODE_GATEWAY_API}/api/vitals`, 10);
    const size = Number(vitals?.mempool?.size ?? NaN);
    const bytes = Number(vitals?.mempool?.bytes ?? NaN);
    mempoolTxCount = Number.isFinite(size) ? size : null;
    mempoolVsizeMb = Number.isFinite(bytes) ? Number((bytes / 1_000_000).toFixed(0)) : null;
  } catch {
    // Keep fallback path available.
  }

  try {
    const recent = await fetchJsonWithRevalidate<NodeMempoolRecentEntry[]>(
      `${NODE_GATEWAY_API}/api/mempool-recent`,
      10,
    );
    recentTxs = (recent ?? [])
      .map((row) => {
        const txid = typeof row.txid === "string" ? row.txid : "";
        const feeBtc = Number(row.fee);
        const size = Number(row.size);
        const time = Number(row.time);
        const feeSat = Number.isFinite(feeBtc) && feeBtc >= 0 ? Math.round(feeBtc * 100_000_000) : null;
        const vsize = Number.isFinite(size) && size > 0 ? Math.round(size) : null;
        const safeTime = Number.isFinite(time) && time > 0 ? Math.round(time) : null;
        const feeRate =
          feeSat !== null && vsize !== null && vsize > 0
            ? Number((feeSat / vsize).toFixed(2))
            : null;

        return {
          txid,
          feeSat,
          vsize,
          feeRate,
          time: safeTime,
        } satisfies RecentMempoolTx;
      })
      .filter((row) => row.txid.length > 12)
      .slice(0, 5);
  } catch {
    // Keep fallback path available.
  }

  const hasNodeData =
    blockHeight !== null ||
    hashrateEh !== null ||
    feeFast !== null ||
    feeHalfHour !== null ||
    feeHour !== null ||
    mempoolTxCount !== null ||
    mempoolVsizeMb !== null ||
    recentTxs.length > 0;

  return {
    blockHeight,
    feeFast,
    feeHalfHour,
    feeHour,
    hashrateEh,
    mempoolTxCount,
    mempoolVsizeMb,
    recentTxIds: recentTxs.map((tx) => tx.txid),
    recentTxs,
    source: hasNodeData ? "rawblock" : "unavailable",
  };
}

type MempoolHashrateResponse =
  | Array<{ timestamp: number; avgHashrate: number }>
  | {
      hashrates?: Array<{ timestamp: number; avgHashrate: number }>;
      currentHashrate?: number;
    };

async function fetchHashrateEh(): Promise<{
  hashrateEh: number | null;
  source: "rawblock" | "mempool" | "unavailable";
}> {
  // Prefer node-backed hashrate from our own gateway when configured.
  if (NODE_GATEWAY_API) {
    try {
      const payload = await fetchJsonWithRevalidate<{ hashrate?: number | null }>(
        `${NODE_GATEWAY_API}/api/network-stats`,
      );

      const rawHashrate = Number(payload?.hashrate ?? 0);
      // rawblock `/api/network-stats` is sourced from Bitcoin Core `networkhashps` (H/s).
      const eh = convertHashrateToEh(rawHashrate, "H/s");
      if (eh !== null && Number.isFinite(eh)) {
        return { hashrateEh: Number(eh.toFixed(2)), source: "rawblock" };
      }
    } catch {
      // Fallback to public hashrate providers below.
    }
  }

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

function classifySource(source: BitcoinMetricUpstream): BitcoinMetricSourceClass {
  switch (source) {
    case "rawblock":
      return "local-node";
    case "electrs":
      return "electrs";
    case "mempool":
    case "blockstream":
      return "fallback";
    case "mixed":
      return "mixed";
    default:
      return "unavailable";
  }
}

function makeProvenance(source: BitcoinMetricUpstream, timestamp: string): BitcoinMetricProvenance {
  return {
    sourceClass: classifySource(source),
    upstream: source,
    timestamp,
  };
}

export async function getBitcoinLiveMetrics(): Promise<BitcoinLiveMetrics> {
  const nodeData = await fetchNodeGatewaySnapshot();

  const needsHeightFallback = nodeData.blockHeight === null;
  const needsFeesFallback =
    nodeData.feeFast === null || nodeData.feeHalfHour === null || nodeData.feeHour === null;
  const needsHashrateFallback = nodeData.hashrateEh === null;
  const needsMempoolFallback =
    nodeData.mempoolTxCount === null ||
    nodeData.mempoolVsizeMb === null ||
    (nodeData.mempoolTxCount !== 0 && nodeData.recentTxs.length === 0);

  const [mempoolData, heightData, feeData, hashrateData] = await Promise.all([
    needsMempoolFallback
      ? fetchMempoolSnapshot()
      : Promise.resolve({
          mempoolTxCount: null,
          mempoolVsizeMb: null,
          recentTxIds: [],
          recentTxs: [],
          source: "unavailable" as const,
        }),
    needsHeightFallback
      ? fetchBlockHeight()
      : Promise.resolve({
          height: null,
          source: "unavailable" as const,
        }),
    needsFeesFallback
      ? fetchFees()
      : Promise.resolve({
          feeFast: null,
          feeHalfHour: null,
          feeHour: null,
          source: "unavailable" as const,
        }),
    needsHashrateFallback
      ? fetchHashrateEh()
      : Promise.resolve({
          hashrateEh: null,
          source: "unavailable" as const,
        }),
  ]);
  const nowIso = new Date().toISOString();

  const blockHeight = nodeData.blockHeight ?? heightData.height;
  const blockHeightSource: BitcoinMetricUpstream =
    nodeData.blockHeight !== null ? "rawblock" : heightData.source;

  const feeFast = nodeData.feeFast ?? feeData.feeFast;
  const feeHalfHour = nodeData.feeHalfHour ?? feeData.feeHalfHour;
  const feeHour = nodeData.feeHour ?? feeData.feeHour;
  const feesSource: BitcoinMetricUpstream =
    nodeData.feeFast !== null && nodeData.feeHalfHour !== null && nodeData.feeHour !== null
      ? "rawblock"
      : feeData.source;

  const hashrateEh = nodeData.hashrateEh ?? hashrateData.hashrateEh;
  const hashrateSource: BitcoinMetricUpstream =
    nodeData.hashrateEh !== null ? "rawblock" : hashrateData.source;

  const useNodeMempool =
    nodeData.mempoolTxCount !== null &&
    nodeData.mempoolVsizeMb !== null &&
    (nodeData.mempoolTxCount === 0 || nodeData.recentTxs.length > 0);
  const mempoolTxCount = useNodeMempool ? nodeData.mempoolTxCount : mempoolData.mempoolTxCount;
  const mempoolVsizeMb = useNodeMempool ? nodeData.mempoolVsizeMb : mempoolData.mempoolVsizeMb;
  const recentTxIds = useNodeMempool ? nodeData.recentTxIds : mempoolData.recentTxIds;
  const recentTxs = useNodeMempool ? nodeData.recentTxs : mempoolData.recentTxs;
  const mempoolSource: BitcoinMetricUpstream = useNodeMempool ? "rawblock" : mempoolData.source;

  const blocksUntilHalving =
    blockHeight === null
      ? null
      : BITCOIN_HALVING_INTERVAL_BLOCKS - (blockHeight % BITCOIN_HALVING_INTERVAL_BLOCKS);
  const daysUntilHalving =
    blocksUntilHalving === null
      ? null
      : Math.ceil((blocksUntilHalving * BITCOIN_BLOCK_TIME_MINUTES) / (60 * 24));
  const mergedSource = resolveSource(
    mempoolSource,
    blockHeightSource,
    feesSource,
    hashrateSource,
  );

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
    lastUpdated: nowIso,
    source: mergedSource,
    provenance: {
      blockHeight: makeProvenance(blockHeightSource, nowIso),
      hashrate: makeProvenance(hashrateSource, nowIso),
      fees: makeProvenance(feesSource, nowIso),
      halving: makeProvenance(blockHeightSource, nowIso),
      mempool: makeProvenance(mempoolSource, nowIso),
    },
  };
}
