"use client";

import { useCallback, useEffect, useState } from "react";
import { HERO_POLL_MS } from "@/lib/heroMetrics";

export function useHeroSnapshot<T>(
  view: "hero" | "hero-recent" | "hero-history",
  initial: T,
  merge: (previous: T, incoming: T | null) => T,
  firstRefreshDelay = 0,
) {
  const [snapshot, setSnapshot] = useState(initial);
  const [firstRefreshPending, setFirstRefreshPending] = useState(firstRefreshDelay === 0);
  const [requestVersion, setRequestVersion] = useState(0);
  const retry = useCallback(() => setRequestVersion(version => version + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      let next: T | null = null;
      const deadline = AbortSignal.any([controller.signal, AbortSignal.timeout(3_500)]);
      try {
        const response = await fetch(`/api/bitcoin/metrics?view=${view}`, {
          cache: "no-store",
          signal: deadline,
        });
        if (response.ok) {
          const body = await response.json() as { ok: boolean; metrics: T };
          if (body.ok) next = body.metrics;
        }
      } catch {
        // An unavailable refresh keeps the previous snapshot with its original age.
      }
      if (controller.signal.aborted) return;
      setSnapshot(previous => merge(previous, next));
      setFirstRefreshPending(false);
      timer = setTimeout(refresh, HERO_POLL_MS);
    };
    timer = setTimeout(refresh, requestVersion > 0 ? 0 : firstRefreshDelay);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [view, merge, firstRefreshDelay, requestVersion]);

  return { snapshot, firstRefreshPending, retry };
}
