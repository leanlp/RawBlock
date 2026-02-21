"use client";

import { useCallback, useEffect, useState } from "react";

export type FeeHistoryPoint = {
  timestamp: number;
  fast: number;
  medium: number;
  slow: number;
};

export type FeeSnapshot = {
  fast: number;
  medium: number;
  slow: number;
};

export type FeeLongHorizon = {
  satVB: number;
  targetBlocks: number;
  source: "blockstream";
};

export type FeeMarketStats = {
  minObservedSatVB: number;
  avgObservedSatVB: number;
  maxObservedSatVB: number;
  policyFloorSatVB: number;
  mempoolMinSatVB: number;
  minRelaySatVB: number;
};

type NetworkStatsResponse = {
  fees?: {
    fast?: number | string;
    medium?: number | string;
    slow?: number | string;
  };
};

type FeeMarketStatsResponse = {
  snapshot?: {
    minObservedSatVB?: number | string;
    avgObservedSatVB?: number | string;
    maxObservedSatVB?: number | string;
    policyFloorSatVB?: number | string;
    mempoolMinSatVB?: number | string;
    minRelaySatVB?: number | string;
  };
  percentiles?: {
    p10?: number | string;
    p25?: number | string;
    p50?: number | string;
    p75?: number | string;
    p90?: number | string;
    p95?: number | string;
  };
};

type FeeMarketState = {
  loading: boolean;
  error: string | null;
  history: FeeHistoryPoint[];
  current: FeeSnapshot | null;
  currentTimestamp: number | null;
  stats: FeeMarketStats | null;
  longHorizon: FeeLongHorizon | null;
};

const BLOCKSTREAM_API = "https://blockstream.info/api";

function sameFeeSnapshot(a: FeeSnapshot, b: FeeSnapshot): boolean {
  const eps = 0.001;
  return (
    Math.abs(a.fast - b.fast) <= eps &&
    Math.abs(a.medium - b.medium) <= eps &&
    Math.abs(a.slow - b.slow) <= eps
  );
}

function alignHistoryWithCurrent(history: FeeHistoryPoint[], current: FeeSnapshot | null): FeeHistoryPoint[] {
  if (!current) return history;

  const now = Date.now();
  const livePoint: FeeHistoryPoint = {
    timestamp: now,
    fast: current.fast,
    medium: current.medium,
    slow: current.slow,
  };

  if (history.length === 0) {
    return [livePoint];
  }

  const last = history[history.length - 1];
  const lastSnapshot: FeeSnapshot = {
    fast: last.fast,
    medium: last.medium,
    slow: last.slow,
  };

  // Keep chart tail coherent with the cards. If latest history is stale or differs
  // from live snapshot, append a real-time point from /api/network-stats.
  const staleMs = 2 * 60 * 1000;
  if (now-last.timestamp > staleMs || !sameFeeSnapshot(lastSnapshot, current)) {
    return [...history, livePoint].slice(-192);
  }

  return history;
}

function parseFee(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(Math.max(0, value).toFixed(3));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Number(Math.max(0, parsed).toFixed(3)) : null;
  }
  return null;
}

function normalizeOrderedFees(fast: unknown, medium: unknown, slow: unknown): FeeSnapshot | null {
  const parsedFast = parseFee(fast);
  const parsedMedium = parseFee(medium);
  const parsedSlow = parseFee(slow);

  if (parsedFast === null || parsedMedium === null || parsedSlow === null) {
    return null;
  }

  const ordered = [parsedSlow, parsedMedium, parsedFast].sort((a, b) => a - b);
  return {
    slow: ordered[0],
    medium: ordered[1],
    fast: ordered[2],
  };
}

async function fetchBlockstreamFeeSnapshot(): Promise<FeeSnapshot | null> {
  try {
    const response = await fetch(`${BLOCKSTREAM_API}/fee-estimates`, { cache: "no-store" });
    if (!response.ok) return null;

    const estimates = (await response.json()) as Record<string, number>;
    return normalizeOrderedFees(
      estimates["1"] ?? estimates["2"],
      estimates["3"] ?? estimates["4"] ?? estimates["2"],
      estimates["6"] ?? estimates["8"] ?? estimates["12"],
    );
  } catch {
    return null;
  }
}

async function fetchBlockstreamLongHorizonFee(): Promise<FeeLongHorizon | null> {
  try {
    const response = await fetch(`${BLOCKSTREAM_API}/fee-estimates`, { cache: "no-store" });
    if (!response.ok) return null;

    const estimates = (await response.json()) as Record<string, number>;
    const preferredTargets = [144, 72, 36, 24];
    for (const target of preferredTargets) {
      const fee = parseFee(estimates[String(target)]);
      if (fee !== null) {
        return {
          satVB: fee,
          targetBlocks: target,
          source: "blockstream",
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function toHistoryPoint(entry: unknown): FeeHistoryPoint | null {
  if (!entry || typeof entry !== "object") return null;

  const raw = entry as {
    timestamp?: unknown;
    time?: unknown;
    fast?: unknown;
    medium?: unknown;
    slow?: unknown;
  };

  const timestampValue =
    typeof raw.timestamp === "number"
      ? raw.timestamp
      : typeof raw.time === "number"
        ? raw.time
        : null;

  if (!timestampValue || !Number.isFinite(timestampValue)) return null;

  const normalized = normalizeOrderedFees(raw.fast, raw.medium, raw.slow);
  if (!normalized) return null;

  return {
    timestamp: timestampValue,
    fast: normalized.fast,
    medium: normalized.medium,
    slow: normalized.slow,
  };
}

function isFulfilledOk(result: PromiseSettledResult<Response>): result is PromiseFulfilledResult<Response> {
  return result.status === "fulfilled" && result.value.ok;
}

export function formatFeeTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function useFeeMarketData(pollIntervalMs = 30_000) {
  const [state, setState] = useState<FeeMarketState>({
    loading: true,
    error: null,
    history: [],
    current: null,
    currentTimestamp: null,
    stats: null,
    longHorizon: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

      const [historyRes, currentRes, statsRes, longHorizonRes] = await Promise.allSettled([
        fetchWithTimeout(`${baseUrl}/api/fee-history`),
        fetchWithTimeout(`${baseUrl}/api/network-stats`),
        fetchWithTimeout(`${baseUrl}/api/fee-market-stats`),
        fetchBlockstreamLongHorizonFee(),
      ]);

      let normalizedHistory: FeeHistoryPoint[] | null = null;
      if (isFulfilledOk(historyRes)) {
        const payload = (await historyRes.value.json()) as unknown;
        const entries = Array.isArray(payload) ? payload : [];
        normalizedHistory = entries
          .map((entry) => toHistoryPoint(entry))
          .filter((point): point is FeeHistoryPoint => point !== null)
          .sort((a, b) => a.timestamp - b.timestamp);
      }

      let normalizedCurrent: FeeSnapshot | null = null;
      let normalizedCurrentTimestamp: number | null = null;
      if (isFulfilledOk(currentRes)) {
        const payload = (await currentRes.value.json()) as NetworkStatsResponse;
        normalizedCurrent = normalizeOrderedFees(payload.fees?.fast, payload.fees?.medium, payload.fees?.slow);
        normalizedCurrentTimestamp = Date.now();
      }

      let normalizedStats: FeeMarketStats | null = null;
      let normalizedCurrentFromStats: FeeSnapshot | null = null;
      if (isFulfilledOk(statsRes)) {
        const payload = (await statsRes.value.json()) as FeeMarketStatsResponse;
        const minObservedSatVB = parseFee(payload.snapshot?.minObservedSatVB);
        const avgObservedSatVB = parseFee(payload.snapshot?.avgObservedSatVB);
        const maxObservedSatVB = parseFee(payload.snapshot?.maxObservedSatVB);
        const policyFloorSatVB = parseFee(payload.snapshot?.policyFloorSatVB);
        const mempoolMinSatVB = parseFee(payload.snapshot?.mempoolMinSatVB);
        const minRelaySatVB = parseFee(payload.snapshot?.minRelaySatVB);

        if (
          minObservedSatVB !== null &&
          avgObservedSatVB !== null &&
          maxObservedSatVB !== null &&
          policyFloorSatVB !== null &&
          mempoolMinSatVB !== null &&
          minRelaySatVB !== null
        ) {
          normalizedStats = {
            minObservedSatVB,
            avgObservedSatVB,
            maxObservedSatVB,
            policyFloorSatVB,
            mempoolMinSatVB,
            minRelaySatVB,
          };
        }

        normalizedCurrentFromStats = normalizeOrderedFees(
          payload.percentiles?.p95 ?? payload.percentiles?.p90,
          payload.percentiles?.p75 ?? payload.percentiles?.p50,
          payload.percentiles?.p50 ?? payload.percentiles?.p25 ?? payload.snapshot?.minObservedSatVB,
        );
      }
      const longHorizonFee =
        longHorizonRes.status === "fulfilled" ? longHorizonRes.value : null;

      const statsEndpointAvailable = isFulfilledOk(statsRes);
      let blockstreamCurrent: FeeSnapshot | null = null;

      if (normalizedCurrentFromStats) {
        normalizedCurrent = normalizedCurrentFromStats;
        normalizedCurrentTimestamp = Date.now();
      }

      // Legacy backends can floor fees around 1 sat/vB. When fee-market stats
      // endpoint is unavailable, prefer raw explorer-style fee estimates.
      if (normalizedCurrent === null || !statsEndpointAvailable) {
        blockstreamCurrent = await fetchBlockstreamFeeSnapshot();
      }

      if (blockstreamCurrent && (normalizedCurrent === null || !statsEndpointAvailable)) {
        normalizedCurrent = blockstreamCurrent;
        normalizedCurrentTimestamp = Date.now();
      }

      setState((prev) => {
        const current = normalizedCurrent ?? prev.current;
        const currentTimestamp = normalizedCurrentTimestamp ?? prev.currentTimestamp;
        const historyBase = normalizedHistory ?? prev.history;
        const history = alignHistoryWithCurrent(historyBase, current);
        const stats = normalizedStats ?? prev.stats;
        const longHorizon = longHorizonFee ?? prev.longHorizon;
        const hasAnyData = history.length > 0 || current !== null || stats !== null;
        const allFailed =
          !isFulfilledOk(historyRes) &&
          !isFulfilledOk(currentRes) &&
          !isFulfilledOk(statsRes) &&
          blockstreamCurrent === null;

        return {
          loading: false,
          error: allFailed && !hasAnyData ? "Unable to load fee market data." : null,
          history,
          current,
          currentTimestamp,
          stats,
          longHorizon,
        };
      });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: prev.history.length > 0 || prev.current || prev.stats ? prev.error : "Unable to load fee market data.",
      }));
    }
  }, []);

  useEffect(() => {
    const bootstrap = window.setTimeout(() => {
      void fetchData();
    }, 0);
    const timer = window.setInterval(fetchData, pollIntervalMs);
    return () => {
      window.clearTimeout(bootstrap);
      window.clearInterval(timer);
    };
  }, [fetchData, pollIntervalMs]);

  const latest = state.history.length ? state.history[state.history.length - 1] : null;
  const cardFees = state.current
    ? {
        fast: state.current.fast,
        medium: state.current.medium,
        slow: state.current.slow,
      }
    : latest
      ? {
          fast: latest.fast,
          medium: latest.medium,
          slow: latest.slow,
        }
      : {
          fast: null,
          medium: null,
          slow: null,
        };

  const hasData =
    state.history.length > 0 ||
    cardFees.fast !== null ||
    cardFees.medium !== null ||
    cardFees.slow !== null;

  return {
    ...state,
    cardFees,
    hasData,
    retry: fetchData,
  };
}
