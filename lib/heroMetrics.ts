import type { RecentMempoolTx } from "@/lib/bitcoinData";

export type HeroReading<T> = {
  value: T;
  source: "node" | "fallback" | "unknown";
  observedAt: number | null;
  retrievedAt: number;
  fromDisk: boolean;
  lastKnown?: boolean;
};

export type HeroFees = {
  fast: number | null;
  medium: number | null;
  slow: number | null;
};

export type HeroFeeHistoryPoint = {
  timestamp: number;
  fast: number;
  medium: number;
  slow: number;
};

export type HeroCoreMetrics = {
  height: HeroReading<number> | null;
  hashrate: HeroReading<number> | null;
  fees: HeroReading<HeroFees> | null;
  mempool: HeroReading<{ count: number | null; vsizeMb: number | null }> | null;
  checkedAt: number;
};

export type HeroRecentMetrics = HeroReading<RecentMempoolTx[]>;
export type HeroHistoryMetrics = HeroReading<HeroFeeHistoryPoint[]>;

export const HERO_POLL_MS = 30_000;
export const NETWORK_FRESH_MS = 75_000;
export const MEMPOOL_FRESH_MS = 45_000;
export const HISTORY_FRESH_MS = 90_000;
const MAX_SNAPSHOT_AGE_MS = 5 * 60_000;

export function isHeroReadingFresh<T>(reading: HeroReading<T> | null, now: number, maxAgeMs: number) {
  return reading?.source === "node" && !reading.fromDisk && !reading.lastKnown &&
    reading.observedAt !== null && now - reading.observedAt <= maxAgeMs;
}

export function displayableHeroReading<T>(reading: HeroReading<T> | null, now: number) {
  if (reading && now - (reading.observedAt ?? reading.retrievedAt) > MAX_SNAPSHOT_AGE_MS) return null;
  return reading;
}

export function updateHeroReading<T>(previous: HeroReading<T> | null, next: HeroReading<T> | null, now: number) {
  const usablePrevious = displayableHeroReading(previous, now);
  const usableNext = displayableHeroReading(next, now);
  if (!usablePrevious) return usableNext;
  if (usableNext) {
    if (usablePrevious.observedAt === null ||
        (usableNext.observedAt !== null && usableNext.observedAt >= usablePrevious.observedAt)) {
      return usableNext;
    }
  }
  return { ...usablePrevious, lastKnown: true };
}

export function mergeHeroCore(previous: HeroCoreMetrics, next: HeroCoreMetrics): HeroCoreMetrics {
  const now = next.checkedAt;
  return {
    height: updateHeroReading(previous.height, next.height, now),
    hashrate: updateHeroReading(previous.hashrate, next.hashrate, now),
    fees: updateHeroReading(previous.fees, next.fees, now),
    mempool: updateHeroReading(previous.mempool, next.mempool, now),
    checkedAt: now,
  };
}
