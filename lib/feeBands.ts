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

export function normalizeSatVb(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.max(1, Math.ceil(value));
}

export function toFeeBands(blocks: RawFeeBlock[], maxPoints = 8): FeeBandPoint[] {
  return blocks.slice(0, maxPoints).map((block, idx) => {
    const range = block.feeRange ?? [];
    const lowRaw = range[1] ?? range[0] ?? block.medianFee ?? 0;
    const medianRaw = block.medianFee ?? range[3] ?? lowRaw;
    const highRaw = range[5] ?? range[4] ?? medianRaw;

    const low = normalizeSatVb(lowRaw) ?? 1;
    const median = normalizeSatVb(medianRaw) ?? low;
    const high = normalizeSatVb(highRaw) ?? median;

    return {
      bucket: `Next ${idx + 1}`,
      low,
      median,
      high: Math.max(high, median),
    };
  });
}
