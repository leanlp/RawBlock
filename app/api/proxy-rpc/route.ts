import { NextResponse } from "next/server";

function getApiBaseUrl(): string {
  const raw =
    process.env.RAWBLOCK_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://apigoland.rawblock.net";
  return raw.trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

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

async function fetchBackendJson(path: string, clientUserAgent?: string | null): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${baseUrl}${cleanPath}`;
  const userAgent =
    clientUserAgent && !clientUserAgent.includes("RawBlock-Proxy")
      ? clientUserAgent
      : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Upstream ${targetUrl} status ${res.status}: ${errBody.slice(0, 150)}`);
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
    const clientUserAgent = req.headers.get("user-agent");
    const body = (await req.json()) as { query?: unknown };
    if (typeof body?.query !== "string" || !body.query.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const cleanQuery = body.query.trim();
    const isTxID = /^[0-9a-fA-F]{64}$/.test(cleanQuery);
    const isAddress = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(cleanQuery);

    if (isTxID) {
      let tx: Record<string, unknown>;
      try {
        tx = await fetchBackendJson(`/api/tx/${encodeURIComponent(cleanQuery)}`, clientUserAgent);
      } catch (err) {
        console.warn("Primary backend /api/tx fetch failed, using fallback:", err);
        const fbRes = await fetch(`https://mempool.space/api/tx/${encodeURIComponent(cleanQuery)}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (fbRes.ok) {
          tx = (await fbRes.json()) as Record<string, unknown>;
        } else {
          throw err;
        }
      }

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
      let wallet: Record<string, unknown>;
      try {
        wallet = await fetchBackendJson(
          `/api/wallet/${encodeURIComponent(cleanQuery)}/balance`,
          clientUserAgent,
        );
      } catch (err) {
        console.warn("Primary backend /api/wallet fetch failed, using fallback:", err);
        const fbRes = await fetch(`https://mempool.space/api/address/${encodeURIComponent(cleanQuery)}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (fbRes.ok) {
          const fbData = (await fbRes.json()) as {
            chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number; funded_txo_count?: number };
          };
          const funded = fbData.chain_stats?.funded_txo_sum || 0;
          const spent = fbData.chain_stats?.spent_txo_sum || 0;
          wallet = {
            balance: (funded - spent) / 1e8,
            utxoCount: fbData.chain_stats?.funded_txo_count || 0,
            utxos: [],
          };
        } else {
          throw err;
        }
      }

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
  } catch (err) {
    console.error("proxy-rpc error:", err);
    return NextResponse.json(
      {
        error: "Unable to resolve blockchain query from backend.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
