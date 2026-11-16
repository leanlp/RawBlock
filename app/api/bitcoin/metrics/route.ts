import { NextResponse } from "next/server";
import { getBitcoinLiveMetrics } from "@/lib/bitcoinData";
import { getHeroCoreMetrics, getHeroHistoryMetrics, getHeroRecentMetrics } from "@/lib/heroMetrics.server";
import { hasCompleteHeroCore, isHeroReadingFresh, MEMPOOL_FRESH_MS, NETWORK_FRESH_MS, type HeroCoreMetrics } from "@/lib/heroMetrics";

const headers = { "Cache-Control": "no-store" };

function heroCacheSeconds(metrics: HeroCoreMetrics): number {
  if (!hasCompleteHeroCore(metrics)) return 0;
  const now = Date.now();
  let ttl = 5;
  for (const [reading, freshnessMs] of [
    [metrics.height, NETWORK_FRESH_MS],
    [metrics.hashrate, NETWORK_FRESH_MS],
    [metrics.fees, NETWORK_FRESH_MS],
    [metrics.mempool, MEMPOOL_FRESH_MS],
  ] as const) {
    if (!reading || reading.observedAt === null || !isHeroReadingFresh<unknown>(reading, now, freshnessMs)) return 0;
    ttl = Math.min(ttl, Math.floor((reading.observedAt + freshnessMs - now) / 1_000));
  }
  return ttl;
}

function heroResponse(metrics: unknown, available: number, total: number, cdnSeconds = 0) {
  const status = available === 0 ? "unavailable" : available < total ? "partial" : "ready";
  const cacheHeaders: Record<string, string> = status === "ready" && cdnSeconds > 0 ? {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Vercel-CDN-Cache-Control": `public, s-maxage=${cdnSeconds}`,
  } : headers;
  return NextResponse.json({ ok: available > 0, status, metrics }, {
    status: available === 0 ? 503 : 200,
    headers: { ...cacheHeaders, "X-RawBlock-Metrics-Status": status, ...(available === 0 ? { "Retry-After": "5" } : {}) },
  });
}

export async function GET(request: Request) {
  try {
    const view = new URL(request.url).searchParams.get("view");
    if (view === "hero") {
      const metrics = await getHeroCoreMetrics();
      const available = [metrics.height, metrics.hashrate, metrics.fees, metrics.mempool].filter(Boolean).length;
      return heroResponse(metrics, available, 4, heroCacheSeconds(metrics));
    }
    if (view === "hero-recent") {
      const metrics = await getHeroRecentMetrics();
      return heroResponse(metrics, metrics === null ? 0 : 1, 1);
    }
    if (view === "hero-history") {
      const metrics = await getHeroHistoryMetrics();
      return heroResponse(metrics, metrics === null ? 0 : 1, 1);
    }
    const metrics = await getBitcoinLiveMetrics();
    return NextResponse.json({ ok: true, metrics }, { headers });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch bitcoin metrics",
      },
      { status: 503, headers }
    );
  }
}
