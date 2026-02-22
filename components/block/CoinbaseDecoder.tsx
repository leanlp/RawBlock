"use client";

import { useState } from "react";

// The coinbase transaction contains arbitrary data (miner tags, extra nonce, etc.)
// Building a dedicated decoder enhances the block page.

export default function CoinbaseDecoder({ coinbaseTxid }: { coinbaseTxid: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [decoded, setDecoded] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rawCoinbaseHex, setRawCoinbaseHex] = useState("");

    const resolveTxPayload = (payload: unknown) => {
        if (!payload || typeof payload !== "object") return null;
        const candidate = payload as Record<string, unknown>;
        if (Array.isArray(candidate.vin)) return candidate;
        if (candidate.result && typeof candidate.result === "object") return candidate.result as Record<string, unknown>;
        if (candidate.data && typeof candidate.data === "object") return candidate.data as Record<string, unknown>;
        if (candidate.tx && typeof candidate.tx === "object") return candidate.tx as Record<string, unknown>;
        return candidate;
    };

    const extractCoinbaseHex = (payload: unknown) => {
        if (!payload || typeof payload !== "object") return "";
        const candidate = payload as {
            vin?: Array<{
                coinbase?: string;
                scriptsig?: string;
                scriptSig?: { hex?: string };
            }>;
        };
        const input = candidate.vin?.[0];
        return input?.coinbase || input?.scriptSig?.hex || input?.scriptsig || "";
    };

    const fetchCoinbase = async () => {
        setLoading(true);
        setError(null);
        setRawCoinbaseHex("");
        try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
            const canUseBackend = baseUrl.length > 0;
            const res = canUseBackend
                ? await fetch(`${baseUrl}/api/decode-tx`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: coinbaseTxid })
                })
                : null;

            if (!res || !res.ok) {
                // fallback to mempool.space for demo purposes
                const mempoolRes = await fetch(`https://mempool.space/api/tx/${coinbaseTxid}`);
                if (!mempoolRes.ok) throw new Error("Failed to fetch coinbase transaction");
                const tx = await mempoolRes.json();
                const resolved = resolveTxPayload(tx);
                setDecoded(resolved);
                setRawCoinbaseHex(extractCoinbaseHex(resolved));
                return;
            }

            const data = await res.json();
            const resolved = resolveTxPayload(data);
            setDecoded(resolved);
            setRawCoinbaseHex(extractCoinbaseHex(resolved));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "Failed to decode");
        } finally {
            setLoading(false);
        }
    };

    const extractText = (hexStr: string) => {
        try {
            let str = "";
            for (let i = 0; i < hexStr.length; i += 2) {
                const code = parseInt(hexStr.substring(i, i + 2), 16);
                if (code >= 32 && code <= 126) {
                    str += String.fromCharCode(code);
                } else {
                    str += ".";
                }
            }
            return str;
        } catch {
            return "Unable to parse text";
        }
    };

    return (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-amber-400">Coinbase Trace & Decoder</h3>
                    <p className="text-xs text-slate-400">
                        Inspect the block&apos;s generation transaction to see miner tags, BIP34 height, and extra nonce data.
                    </p>
                </div>
                {!decoded && !loading && (
                    <button
                        onClick={fetchCoinbase}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors"
                    >
                        Decode Coinbase Tx
                    </button>
                )}
            </div>

            {loading && <div className="text-slate-400 animate-pulse text-xs">Fetching transaction data...</div>}
            {error && <div className="text-red-400 text-xs">{error}</div>}

            {decoded && (
                <div className="animate-in fade-in duration-500 mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Raw Base Hex (scriptSig)</div>
                            <div className="font-mono text-xs break-all text-slate-300">
                                {rawCoinbaseHex || "Unavailable"}
                            </div>
                        </div>
                        <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Decoded ASCII Text (Miner Tag)</div>
                            <div className="font-mono text-xs break-all text-amber-300 bg-slate-900 p-2 rounded">
                                {rawCoinbaseHex ? extractText(rawCoinbaseHex) : "Unavailable"}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
