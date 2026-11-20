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
    let failures = 0;
    const refresh = async () => {
      let next: T | null = null;
      let complete = false;
      // Longer than the server's 3.5s response deadline, including transport.
      const deadline = AbortSignal.any([controller.signal, AbortSignal.timeout(5_000)]);
      try {
        const response = await fetch(`/api/bitcoin/metrics?view=${view}`, {
          cache: "no-store",
          signal: deadline,
        });
        if (response.ok) {
          const body = await response.json() as { ok: boolean; metrics: T; status?: string };
          if (body.ok) {
            next = body.metrics;
            complete = next != null && body.status !== "partial" && body.status !== "unavailable";
          }
        }
      } catch {
        // An unavailable refresh keeps the previous snapshot with its original age.
      }
      if (controller.signal.aborted) return;
      setSnapshot(previous => merge(previous, next));
      setFirstRefreshPending(false);
      // A cold miss should recover promptly, not leave an empty hero for 30s.
      // Back off during longer outages, preserving the original observation age.
      failures = complete ? 0 : failures + 1;
      timer = setTimeout(refresh, complete ? HERO_POLL_MS : Math.min(HERO_POLL_MS, 5_000 * 2 ** Math.min(failures - 1, 3)));
    };
    timer = setTimeout(refresh, requestVersion > 0 ? 0 : firstRefreshDelay);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [view, merge, firstRefreshDelay, requestVersion]);

  return { snapshot, firstRefreshPending, retry };
}
