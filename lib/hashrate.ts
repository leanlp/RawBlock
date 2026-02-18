export type HashrateUnit = "H/s" | "TH/s" | "PH/s" | "EH/s";

const HASHRATE_TO_EH_DIVISOR: Record<HashrateUnit, number> = {
  "H/s": 1e18,
  "TH/s": 1e6,
  "PH/s": 1e3,
  "EH/s": 1,
};

export function convertHashrateToEh(value: number, unit: HashrateUnit): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  return value / HASHRATE_TO_EH_DIVISOR[unit];
}

export function inferHashrateUnit(value: number): HashrateUnit {
  const absolute = Math.abs(value);
  if (absolute >= 1e15) return "H/s";
  if (absolute >= 1e9) return "TH/s";
  if (absolute >= 1e4) return "PH/s";
  return "EH/s";
}

export function normalizeHashrateToEh(value: number, unit?: HashrateUnit): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const resolvedUnit = unit ?? inferHashrateUnit(value);
  return convertHashrateToEh(value, resolvedUnit);
}
