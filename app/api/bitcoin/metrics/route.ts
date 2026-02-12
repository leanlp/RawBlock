import { NextResponse } from "next/server";
import { getBitcoinLiveMetrics } from "@/lib/bitcoinData";

export const revalidate = 30;

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
      { status: 503 },
    );
  }
}
