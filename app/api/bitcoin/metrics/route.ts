import { NextResponse } from "next/server";
import { getBitcoinLiveMetrics } from "@/lib/bitcoinData";
import { getHeroCoreMetrics, getHeroHistoryMetrics, getHeroRecentMetrics } from "@/lib/heroMetrics.server";

export async function GET(request: Request) {
  try {
    const view = new URL(request.url).searchParams.get("view");
    if (view === "hero") {
      return NextResponse.json({ ok: true, metrics: await getHeroCoreMetrics() });
    }
    if (view === "hero-recent") {
      return NextResponse.json({ ok: true, metrics: await getHeroRecentMetrics() });
    }
    if (view === "hero-history") {
      return NextResponse.json({ ok: true, metrics: await getHeroHistoryMetrics() });
    }
    const metrics = await getBitcoinLiveMetrics();
    return NextResponse.json({ ok: true, metrics });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch bitcoin metrics",
      },
      { status: 503 }
    );
  }
}
