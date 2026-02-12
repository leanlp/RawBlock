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
  blocksUntilHalving: number | null;
  daysUntilHalving: number | null;
  lastUpdated: string;
  source: "mempool" | "blockstream" | "mixed" | "unavailable";
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
  try {
    const fees = await fetchJsonWithRevalidate<{
      fastestFee: number;
      halfHourFee: number;
      hourFee: number;
    }>(`${MEMPOOL_API}/v1/fees/recommended`);

    return {
      feeFast: fees.fastestFee,
      feeHalfHour: fees.halfHourFee,
      feeHour: fees.hourFee,
      source: "mempool",
    };
  } catch {
    try {
      const estimates = await fetchJsonWithRevalidate<Record<string, number>>(
        `${BLOCKSTREAM_API}/fee-estimates`,
      );
      return {
        feeFast: estimates["1"] ?? null,
        feeHalfHour: estimates["3"] ?? estimates["2"] ?? null,
        feeHour: estimates["6"] ?? null,
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

async function fetchHashrateEh(): Promise<{ hashrateEh: number | null; source: "mempool" | "unavailable" }> {
  try {
    const series = await fetchJsonWithRevalidate<Array<{ timestamp: number; avgHashrate: number }>>(
      `${MEMPOOL_API}/v1/mining/hashrate/3d`,
    );

    if (!series.length) {
      return { hashrateEh: null, source: "unavailable" };
    }

    const latest = series[series.length - 1];
    const eh = latest.avgHashrate / 1e18;
    return { hashrateEh: Number.isFinite(eh) ? Number(eh.toFixed(2)) : null, source: "mempool" };
  } catch {
    return { hashrateEh: null, source: "unavailable" };
  }
}

function resolveSource(...sources: Array<BitcoinLiveMetrics["source"] | "blockstream" | "mempool" | "unavailable">): BitcoinLiveMetrics["source"] {
  const uniq = new Set(sources.filter((source) => source !== "unavailable"));
  if (uniq.size === 0) return "unavailable";
  if (uniq.size === 1) return [...uniq][0] as BitcoinLiveMetrics["source"];
  return "mixed";
}

export async function getBitcoinLiveMetrics(): Promise<BitcoinLiveMetrics> {
  const [heightData, feeData, hashrateData] = await Promise.all([
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
    blocksUntilHalving,
    daysUntilHalving,
    lastUpdated: new Date().toISOString(),
    source: resolveSource(heightData.source, feeData.source, hashrateData.source),
  };
}
