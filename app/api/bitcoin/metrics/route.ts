import { NextResponse } from "next/server";
import { getBitcoinLiveMetrics } from "@/lib/bitcoinData";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour (ISR)

export async function GET() {
  try {
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
