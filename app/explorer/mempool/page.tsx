"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import MempoolVisualizer from "../../../components/MempoolVisualizer";
import NetworkHud from "../../../components/NetworkHud";
import Header from "../../../components/Header";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";

// Types
interface Transaction {
    txid: string;
    fee: number;
    size: number;
    time: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const FALLBACK_MEMPOOL_RECENT_URL = "https://mempool.space/api/mempool/recent";

type DataMode = "live" | "snapshot";

function normalizeTransactions(rows: unknown[]): Transaction[] {
    return rows
        .map((row) => {
            const item = row as Partial<{ txid: string; fee: number; size: number; vsize: number; time: number }>;
            const rawFee = Number(item.fee ?? 0);
            const feeBtc = rawFee > 1 ? rawFee / 100_000_000 : rawFee;
            return {
                txid: String(item.txid ?? ""),
                fee: Number.isFinite(feeBtc) ? feeBtc : 0,
                size: Number(item.size ?? item.vsize ?? 0),
                time: Number(item.time ?? Date.now() / 1000),
            };
        })
        .filter((tx) => tx.txid.length > 0);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 8_000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

export default function MempoolPage() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [connected, setConnected] = useState<boolean>(false);
    const [socketMempoolCount, setSocketMempoolCount] = useState<number>(0);
    const [dataMode, setDataMode] = useState<DataMode>(API_URL ? "live" : "snapshot");
    const [modeNotice, setModeNotice] = useState<string | null>(
        API_URL ? null : "Demo mode: showing public mempool snapshot data.",
    );
    const [error, setError] = useState<string | null>(null);
    const { metrics: liveMetrics } = useBitcoinLiveMetrics(30_000);

    // Use ref for socket to avoid re-creation
    const socketRef = useRef<Socket | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (API_URL) {
                try {
                    const res = await fetchWithTimeout(`${API_URL}/api/mempool-recent`, { cache: "no-store" });
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`);
                    }
                    const json = await res.json();
                    setData(normalizeTransactions(Array.isArray(json) ? json : []));
                    setDataMode("live");
                    setModeNotice(null);
                    return;
                } catch (primaryError) {
                    console.warn("Live mempool feed unavailable, falling back to snapshot mode:", primaryError);
                }
            }

            const fallbackRes = await fetchWithTimeout(FALLBACK_MEMPOOL_RECENT_URL, { cache: "no-store" });
            if (!fallbackRes.ok) {
                throw new Error(`Snapshot source failed (HTTP ${fallbackRes.status})`);
            }
            const fallbackJson = await fallbackRes.json();
            setData(normalizeTransactions(Array.isArray(fallbackJson) ? fallbackJson : []));
            setDataMode("snapshot");
            setModeNotice("Demo mode: showing public mempool snapshot data.");
            setConnected(false);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial Fetch
        fetchData();
        const refresh = setInterval(fetchData, 30_000);

        if (!API_URL) {
            return () => {
                clearInterval(refresh);
            };
        }

        // Socket Connection for full live mode.
        socketRef.current = io(API_URL, {
            transports: ["websocket"],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        socket.on("connect", () => {
            setConnected(true);
            setDataMode("live");
            setModeNotice(null);
            console.log("Socket Connected");
        });

        socket.on("disconnect", () => {
            setConnected(false);
            console.log("Socket Disconnected");
        });

        socket.on("tx:new", (newTxs: Transaction[]) => {
            // Add new transactions to the top of the list
            setData((prev) => {
                // Merge and dedup
                const combined = [...newTxs, ...prev];
                // Identify unique by txid
                const unique = combined.filter((tx, index, self) =>
                    index === self.findIndex((t) => (
                        t.txid === tx.txid
                    ))
                );
                // Sort by fee (desc) 
                unique.sort((a, b) => b.fee - a.fee);

                // Keep only top 50 
                return unique.slice(0, 50);
            });
        });

        socket.on("mempool:stats", (stats: { count: number }) => {
            setSocketMempoolCount(stats.count);
        });

        socket.on("connect_error", (socketErr: Error) => {
            console.warn("Socket connection failed, using snapshot mode:", socketErr.message);
            setConnected(false);
            setDataMode("snapshot");
            setModeNotice("Live stream unavailable. Showing public mempool snapshot data.");
        });

        socket.on("rbf:conflict", (event: { txid: string, replacedTxid: string, feeDiff: string }) => {
            // Trigger visual alert
            setRbfAlert(event);
            // Auto-clear after 5s
            setTimeout(() => setRbfAlert(null), 5000);
        });

        return () => {
            clearInterval(refresh);
            socket.disconnect();
        };
    }, [fetchData]);

    const [rbfAlert, setRbfAlert] = useState<{ txid: string, replacedTxid: string, feeDiff: string } | null>(null);
    const canonicalMempoolCount = liveMetrics?.mempoolTxCount ?? socketMempoolCount;

    return (
        <>
            {/* Header */}
            <Header />

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Live Mempool Feed
                    </h1>
                    <p className="mt-2 text-slate-400 text-sm">Real-time unconfirmed transaction stream.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-right space-y-1">
                        <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-slate-500 uppercase tracking-wider">Stream</span>
                            {dataMode === "snapshot" ? (
                                <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                    Snapshot mode
                                </span>
                            ) : connected ? (
                                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Live
                                </span>
                            ) : (
                                <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Disconnected</span>
                            )}
                        </div>
                        {canonicalMempoolCount > 0 && (
                            <div className="text-slate-500">
                                <span className="font-mono text-slate-300">{canonicalMempoolCount.toLocaleString()}</span> txs in mempool
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modeNotice ? (
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                    {modeNotice}
                </div>
            ) : null}

            {/* Status / Error */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                </div>
            )}

            {/* RBF Radar Alert */}
            {rbfAlert && (
                <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-right duration-500">
                    <div className="bg-slate-900 border border-amber-500/50 rounded-lg shadow-2xl p-4 flex items-start gap-4 max-w-sm">
                        <div className="bg-amber-500/10 p-2 rounded-full text-amber-500 animate-pulse">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-amber-500 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                RBF Conflict Detected
                            </h4>
                            <div className="text-xs text-slate-400 mt-1 font-mono">
                                <p>Target: <span className="text-slate-200">{rbfAlert.txid.substring(0, 8)}...</span></p>
                                <p>Replaced: <span className="text-red-400 line-through">{rbfAlert.replacedTxid}</span></p>
                                <p className="text-emerald-400 mt-1">+ {rbfAlert.feeDiff} BTC Fee Bump</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mempool Visualization */}
            <div className="mb-8">
                <MempoolVisualizer />
            </div>

            {/* Content */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-6 md:col-span-7">Transaction ID</div>
                    <div className="col-span-3 md:col-span-2 text-right">Fee (BTC)</div>
                    <div className="col-span-3 md:col-span-3 text-right">Size (vB)</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-800/50">
                    {data.length === 0 && !loading && !error ? (
                        <div className="p-12 text-center text-slate-500">
                            Waiting for transactions...
                        </div>
                    ) : (
                        data.map((tx) => (
                            <div key={tx.txid}>
                                <div className="md:hidden p-4 hover:bg-slate-800/30 transition-colors duration-150 group code-font text-sm animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="font-mono text-cyan-300 truncate opacity-90 group-hover:opacity-100 mb-2">
                                        {tx.txid}
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-mono">
                                        <span className="text-slate-500">Fee (BTC)</span>
                                        <span className="text-slate-300">{tx.fee.toFixed(8)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-mono mt-1">
                                        <span className="text-slate-500">Size (vB)</span>
                                        <span className="text-slate-400">{tx.size.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="hidden md:grid grid-cols-12 gap-4 p-4 hover:bg-slate-800/30 transition-colors duration-150 group code-font text-sm items-center animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="col-span-7 font-mono text-cyan-300 truncate opacity-90 group-hover:opacity-100">
                                        {tx.txid}
                                    </div>
                                    <div className="col-span-2 text-right font-mono text-slate-300">
                                        {tx.fee.toFixed(8)}
                                    </div>
                                    <div className="col-span-3 text-right font-mono text-slate-400">
                                        {tx.size.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {loading && data.length === 0 && (
                        /* Skeleton Loader */
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="md:hidden p-4 space-y-2">
                                    <div className="h-4 bg-slate-800 rounded w-4/5"></div>
                                    <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                                    <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                                </div>
                                <div className="hidden md:grid grid-cols-12 gap-4 p-4">
                                    <div className="col-span-7 h-4 bg-slate-800 rounded w-3/4"></div>
                                    <div className="col-span-2 h-4 bg-slate-800 rounded w-full"></div>
                                    <div className="col-span-3 h-4 bg-slate-800 rounded w-1/2 ml-auto"></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex justify-between text-xs text-slate-600 px-1 pb-20">
                <p>
                    {dataMode === "live"
                        ? "Data provided by local Bitcoin Core node via WebSocket."
                        : "Data provided by public mempool snapshot feed (demo mode)."}
                </p>
            </div>

            {API_URL ? <NetworkHud /> : null}
        </>
    );
}
