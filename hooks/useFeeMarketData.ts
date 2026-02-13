"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type NetworkStatsResponse = {
  fees?: {
    fast?: number | string;
    medium?: number | string;
    slow?: number | string;
  };
};

type FeeMarketState = {
  loading: boolean;
  error: string | null;
  history: FeeHistoryPoint[];
  current: FeeSnapshot | null;
};
const FRONTEND_FEE_FLOOR = 0.2;

function parseFee(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(Math.max(FRONTEND_FEE_FLOOR, value).toFixed(2));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Number(Math.max(FRONTEND_FEE_FLOOR, parsed).toFixed(2)) : null;
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
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const [historyRes, currentRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/fee-history`, { cache: "no-store" }),
        fetch(`${baseUrl}/api/network-stats`, { cache: "no-store" }),
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
      if (isFulfilledOk(currentRes)) {
        const payload = (await currentRes.value.json()) as NetworkStatsResponse;
        normalizedCurrent = normalizeOrderedFees(payload.fees?.fast, payload.fees?.medium, payload.fees?.slow);
      }

      setState((prev) => {
        const history = normalizedHistory ?? prev.history;
        const current = normalizedCurrent ?? prev.current;
        const hasAnyData = history.length > 0 || current !== null;
        const bothFailed = !isFulfilledOk(historyRes) && !isFulfilledOk(currentRes);

        return {
          loading: false,
          error: bothFailed && !hasAnyData ? "Unable to load fee market data." : null,
          history,
          current,
        };
      });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: prev.history.length > 0 || prev.current ? prev.error : "Unable to load fee market data.",
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = window.setInterval(fetchData, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [fetchData, pollIntervalMs]);

  const cardFees = useMemo(() => {
    const latest = state.history.length ? state.history[state.history.length - 1] : null;
    if (latest) {
      return {
        fast: latest.fast,
        medium: latest.medium,
        slow: latest.slow,
      };
    }

    return {
      fast: state.current?.fast ?? null,
      medium: state.current?.medium ?? null,
      slow: state.current?.slow ?? null,
    };
  }, [state.current, state.history]);

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
