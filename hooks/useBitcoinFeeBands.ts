"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toFeeBands, type FeeBandPoint } from "@/lib/feeBands";

type FeeBandsState = {
  loading: boolean;
  error: string | null;
  bands: FeeBandPoint[];
};

type FeeBlockResponse = {
  ok: boolean;
  error?: string;
  blocks?: Array<{
    medianFee: number;
    feeRange: number[];
  }>;
};

export function useBitcoinFeeBands(pollIntervalMs = 30_000) {
  const [state, setState] = useState<FeeBandsState>({
    loading: true,
    error: null,
    bands: [],
  });

  const fetchBands = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/bitcoin/fee-blocks");
      const payload = (await response.json()) as FeeBlockResponse;
      if (!response.ok || !payload.ok || !payload.blocks?.length) {
        throw new Error(payload.error ?? "Unable to fetch fee blocks");
      }
      setState({ loading: false, error: null, bands: toFeeBands(payload.blocks) });
    } catch (error) {
      setState((prev) => ({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to fetch fee bands",
        bands: prev.bands,
      }));
    }
  }, []);

  useEffect(() => {
    fetchBands();
    const timer = window.setInterval(fetchBands, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [fetchBands, pollIntervalMs]);

  const status = useMemo(() => {
    if (state.loading && state.bands.length === 0) return "loading" as const;
    if (state.error && state.bands.length === 0) return "error" as const;
    return "ready" as const;
  }, [state.loading, state.error, state.bands.length]);

  return { ...state, status, retry: fetchBands };
}
