import { NextResponse } from "next/server";
import { getBitcoinLiveMetrics } from "@/lib/bitcoinData";
import { getHeroCoreMetrics, getHeroHistoryMetrics, getHeroRecentMetrics } from "@/lib/heroMetrics.server";

const headers = { "Cache-Control": "no-store" };

function heroResponse(metrics: unknown, available: number, total: number) {
  const status = available === 0 ? "unavailable" : available < total ? "partial" : "ready";
  return NextResponse.json({ ok: available > 0, status, metrics }, {
    status: available === 0 ? 503 : 200,
    headers: { ...headers, "X-RawBlock-Metrics-Status": status, ...(available === 0 ? { "Retry-After": "5" } : {}) },
  });
}

export async function GET(request: Request) {
  try {
    const view = new URL(request.url).searchParams.get("view");
    if (view === "hero") {
      const metrics = await getHeroCoreMetrics();
      const available = [metrics.height, metrics.hashrate, metrics.fees, metrics.mempool].filter(Boolean).length;
      return heroResponse(metrics, available, 4);
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
