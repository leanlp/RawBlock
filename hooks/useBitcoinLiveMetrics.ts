"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getBitcoinLiveMetrics, type BitcoinLiveMetrics } from "@/lib/bitcoinData";

type MetricsState = {
  loading: boolean;
  error: string | null;
  metrics: BitcoinLiveMetrics | null;
};

export function useBitcoinLiveMetrics(pollIntervalMs = 30_000) {
  const [state, setState] = useState<MetricsState>({
    loading: true,
    error: null,
    metrics: null,
  });

  const fetchMetrics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const metrics = await getBitcoinLiveMetrics();
      setState({ loading: false, error: null, metrics });
    } catch (error) {
      setState((prev) => ({
        loading: false,
        error: error instanceof Error ? error.message : "Data temporarily unavailable",
        metrics: prev.metrics,
      }));
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const timer = window.setInterval(fetchMetrics, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [fetchMetrics, pollIntervalMs]);

  const status = useMemo(() => {
    if (state.loading && !state.metrics) return "loading" as const;
    if (state.error && !state.metrics) return "error" as const;
    return "ready" as const;
  }, [state.error, state.loading, state.metrics]);

  return {
    ...state,
    status,
    retry: fetchMetrics,
  };
}
