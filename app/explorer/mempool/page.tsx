"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import MempoolVisualizer from "../../../components/MempoolVisualizer";
import NetworkHud from "../../../components/NetworkHud";
import Header from "../../../components/Header";

// Types
interface Transaction {
    txid: string;
    fee: number;
    size: number;
    time: number;
}

export default function MempoolPage() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [connected, setConnected] = useState<boolean>(false);
    const [mempoolCount, setMempoolCount] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    // Use ref for socket to avoid re-creation
    const socketRef = useRef<Socket | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!apiUrl) throw new Error("API URL not configured");

            const res = await fetch(`${apiUrl}/api/mempool-recent`);
            if (!res.ok) {
                throw new Error("Failed to fetch data");
            }
            const json = await res.json();
            setData(json);
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
    };

    useEffect(() => {
        // Initial Fetch
        fetchData();

        // Socket Connection
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

        // Force websocket transport to avoid polling CORS issues
        socketRef.current = io(socketUrl, {
            transports: ["websocket"],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        socket.on("connect", () => {
            setConnected(true);
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
            setMempoolCount(stats.count);
        });

        socket.on("rbf:conflict", (event: { txid: string, replacedTxid: string, feeDiff: string }) => {
            // Trigger visual alert
            setRbfAlert(event);
            // Auto-clear after 5s
            setTimeout(() => setRbfAlert(null), 5000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const [rbfAlert, setRbfAlert] = useState<{ txid: string, replacedTxid: string, feeDiff: string } | null>(null);

    return (
        <>
            {/* Header */}
            <Header />

            <div className="flex justify-between items-center pb-6 border-b border-slate-800">
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
                            {connected ? (
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
                        {mempoolCount > 0 && (
                            <div className="text-slate-500">
                                <span className="font-mono text-slate-300">{mempoolCount.toLocaleString()}</span> txs in mempool
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                            <div key={tx.txid} className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-800/30 transition-colors duration-150 group code-font text-sm items-center animate-in fade-in slide-in-from-top-1 duration-300">
                                <div className="col-span-6 md:col-span-7 font-mono text-cyan-300 truncate opacity-90 group-hover:opacity-100">
                                    {tx.txid}
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right font-mono text-slate-300">
                                    {tx.fee.toFixed(8)}
                                </div>
                                <div className="col-span-3 md:col-span-3 text-right font-mono text-slate-400">
                                    {tx.size.toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}

                    {loading && data.length === 0 && (
                        /* Skeleton Loader */
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 p-4 animate-pulse">
                                <div className="col-span-7 h-4 bg-slate-800 rounded w-3/4"></div>
                                <div className="col-span-2 h-4 bg-slate-800 rounded w-full"></div>
                                <div className="col-span-3 h-4 bg-slate-800 rounded w-1/2 ml-auto"></div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex justify-between text-xs text-slate-600 px-1 pb-20">
                <p>Data provided by local Bitcoin Core node via WebSocket.</p>
            </div>

            <NetworkHud />
        </>
    );
}
