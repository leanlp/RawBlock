"use client";

import { useCallback, useEffect, useState } from "react";
import { HERO_FIRST_RETRY_MS, HERO_POLL_MS } from "@/lib/heroMetrics";

export function useHeroSnapshot<T>(
  view: "hero" | "hero-recent" | "hero-history",
  initial: T,
  merge: (previous: T, incoming: T | null) => T,
  firstRefreshDelay = 0,
) {
  const [snapshot, setSnapshot] = useState(initial);
  const [phase, setPhase] = useState<"loading" | "retrying" | "settled">(
    firstRefreshDelay === 0 ? "loading" : "settled",
  );
  const [requestVersion, setRequestVersion] = useState(0);
  const retry = useCallback(() => {
    setPhase("retrying");
    setRequestVersion(version => version + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    const isCore = view === "hero";
    const refresh = async () => {
      let next: T | null = null;
      let complete = false;
      let retryAfterMs = 0;
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
        } else {
          const retryAfter = response.headers.get("retry-after");
          if (retryAfter && /^\d{1,5}$/.test(retryAfter)) retryAfterMs = Number(retryAfter) * 1_000;
        }
      } catch {
        // An unavailable refresh keeps the previous snapshot with its original age.
      }
      if (controller.signal.aborted) return;
      setSnapshot(previous => merge(previous, next));
      failures = complete ? 0 : failures + 1;
      const fastRetry = isCore && failures === 1;
      // Keep the initial loading state during the one quick retry. Subsequent
      // failures show the outage and back off without overlapping requests.
      if (!fastRetry || retryAfterMs > HERO_FIRST_RETRY_MS) setPhase("settled");
      const backoffFailures = Math.max(0, failures - (isCore ? 2 : 1));
      const backoff = fastRetry ? HERO_FIRST_RETRY_MS
        : Math.min(HERO_POLL_MS, 5_000 * 2 ** Math.min(backoffFailures, 3));
      timer = setTimeout(refresh, complete ? HERO_POLL_MS : Math.max(backoff, retryAfterMs));
    };
    timer = setTimeout(refresh, requestVersion > 0 ? 0 : firstRefreshDelay);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [view, merge, firstRefreshDelay, requestVersion]);

  return { snapshot, pending: phase !== "settled", retrying: phase === "retrying", retry };
}
