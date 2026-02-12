export type FeeBandPoint = {
  bucket: string;
  low: number;
  median: number;
  high: number;
};

export type RawFeeBlock = {
  medianFee: number;
  feeRange: number[];
};

type OrderedBand = {
  low: number;
  median: number;
  high: number;
};

export function normalizeSatVb(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  // Keep actual precision visible (e.g., 0.2 sat/vB) without forcing integer rounding.
  return Number(value.toFixed(2));
}

export function formatSatVb(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Data temporarily unavailable";
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function ensureOrderedBand(low: number, median: number, high: number): OrderedBand {
  const safeLow = Math.max(0, low);
  const safeMedian = Math.max(safeLow, median);
  const safeHigh = Math.max(safeMedian, high);
  return { low: safeLow, median: safeMedian, high: safeHigh };
}

export function toFeeBands(blocks: RawFeeBlock[], maxPoints = 8): FeeBandPoint[] {
  return blocks.slice(0, maxPoints).map((block, idx) => {
    const range = block.feeRange ?? [];
    const lowFromRange = range.length > 1 ? range[1] : range[0];
    const highFromRange = range.length > 1 ? range[range.length - 2] : range[range.length - 1];
    const medianIndex = Math.floor(range.length / 2);
    const medianFromRange = range[medianIndex];

    const lowRaw = lowFromRange ?? block.medianFee ?? 0;
    const medianRaw = block.medianFee ?? medianFromRange ?? lowRaw;
    const highRaw = highFromRange ?? medianRaw;

    const low = normalizeSatVb(lowRaw) ?? 0;
    const median = normalizeSatVb(medianRaw) ?? low;
    const high = normalizeSatVb(highRaw) ?? median;
    const ordered = ensureOrderedBand(low, median, high);

    return {
      bucket: `Next ${idx + 1}`,
      low: ordered.low,
      median: ordered.median,
      high: ordered.high,
    };
  });
}
