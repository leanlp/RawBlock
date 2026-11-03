import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://apigoland.rawblock.net"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 8000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 30;

const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (ipBuckets.size > 2048) {
    for (const [key, entry] of ipBuckets) {
      if (entry.resetAt <= now) ipBuckets.delete(key);
    }
  }
  const existing = ipBuckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (existing.count >= RATE_MAX_REQUESTS) {
    return false;
  }
  existing.count += 1;
  return true;
}

async function fetchBackendJson(path: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Upstream status ${res.status}`);
    }
    return (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(forwarded)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please retry shortly." },
      { status: 429 },
    );
  }

  try {
    const body = (await req.json()) as { query?: unknown };
    if (typeof body?.query !== "string" || !body.query.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const cleanQuery = body.query.trim();
    const isTxID = /^[0-9a-fA-F]{64}$/.test(cleanQuery);
    const isAddress = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(cleanQuery);

    if (isTxID) {
      const tx = await fetchBackendJson(`/api/tx/${encodeURIComponent(cleanQuery)}`);
      const statusObj = (tx.status ?? {}) as Record<string, unknown>;
      const rawVout = Array.isArray(tx.vout) ? tx.vout : [];

      const normalizedVout = rawVout.map((item) => {
        const entry = (item ?? {}) as Record<string, unknown>;
        if (entry.scriptPubKey && typeof entry.scriptPubKey === "object") {
          return entry;
        }
        const sats = typeof entry.value === "number" ? entry.value : 0;
        const address =
          typeof entry.scriptpubkey_address === "string"
            ? entry.scriptpubkey_address
            : undefined;
        const hex =
          typeof entry.scriptpubkey === "string" ? entry.scriptpubkey : "";
        return {
          ...entry,
          value: sats / 1e8,
          scriptPubKey: {
            address,
            addresses: address ? [address] : [],
            hex,
          },
        };
      });

      return NextResponse.json({
        type: "transaction",
        ...tx,
        vout: normalizedVout,
        blocktime:
          typeof tx.blocktime === "number"
            ? tx.blocktime
            : typeof statusObj.block_time === "number"
              ? statusObj.block_time
              : undefined,
        blockheight:
          typeof tx.blockheight === "number"
            ? tx.blockheight
            : typeof statusObj.block_height === "number"
              ? statusObj.block_height
              : undefined,
        confirmations:
          typeof tx.confirmations === "number"
            ? tx.confirmations
            : statusObj.confirmed
              ? 1
              : 0,
      });
    }

    if (isAddress) {
      const wallet = await fetchBackendJson(
        `/api/wallet/${encodeURIComponent(cleanQuery)}/balance`,
      );
      return NextResponse.json({
        type: "address",
        address: cleanQuery,
        balance: typeof wallet.balance === "number" ? wallet.balance : 0,
        utxoCount: typeof wallet.utxoCount === "number" ? wallet.utxoCount : 0,
        utxos: Array.isArray(wallet.utxos) ? wallet.utxos : [],
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Expected mainnet TxID or Bitcoin address." },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to resolve blockchain query from backend." },
      { status: 502 },
    );
  }
}
