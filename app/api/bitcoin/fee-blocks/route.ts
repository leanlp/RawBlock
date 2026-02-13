import { NextResponse } from "next/server";

export const revalidate = 30;

type MempoolFeeBlock = {
  blockVSize: number;
  nTx: number;
  totalFees: number;
  medianFee: number;
  feeRange: number[];
};

const MEMPOOL_API = "https://mempool.space/api";

export async function GET() {
  try {
    const response = await fetch(`${MEMPOOL_API}/v1/fees/mempool-blocks`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) {
      throw new Error(`Fee blocks fetch failed: ${response.status}`);
    }

    const payload = (await response.json()) as MempoolFeeBlock[];
    return NextResponse.json({ ok: true, blocks: payload ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch fee blocks",
        blocks: [],
      },
      { status: 503 },
    );
  }
}
