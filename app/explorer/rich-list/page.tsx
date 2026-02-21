'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import ProvenanceBadge from '../../../components/ProvenanceBadge';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

interface WhaleData {
    rank: number;
    address: string;
    balance: number;
    utxoCount: number;
    fetchedAt: string;
}

const toFiniteNumber = (value: unknown, fallback = 0): number => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeWhale = (value: unknown): WhaleData => {
    const candidate = (value ?? {}) as Partial<WhaleData>;
    return {
        rank: Math.max(1, Math.floor(toFiniteNumber(candidate.rank, 1))),
        address: typeof candidate.address === "string" ? candidate.address : "",
        balance: toFiniteNumber(candidate.balance, 0),
        utxoCount: Math.max(0, Math.floor(toFiniteNumber(candidate.utxoCount, 0))),
        fetchedAt: typeof candidate.fetchedAt === "string" ? candidate.fetchedAt : "",
    };
};

export default function RichListPage() {
    const router = useRouter();
    const [decoderQuery, setDecoderQuery] = useState("");
    const [filter, setFilter] = useState("");
    const [whales, setWhales] = useState<WhaleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchWhales = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`${API_URL}/api/rich-list`, { cache: 'no-store', signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const data = (await res.json()) as unknown;
                const normalized = Array.isArray(data) ? data.map(normalizeWhale) : [];
                setWhales(normalized);
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
                console.error('Failed to load rich list:', err);
                setError('Unable to load rich list snapshot from backend.');
            } finally {
                setLoading(false);
            }
        };

        fetchWhales();
        return () => controller.abort();
    }, []);

    const handleViewWhale = (rank: number) => {
        router.push(`/explorer/rich-list/${rank}`);
    };

    const totalBtc = whales.reduce((sum, w) => sum + w.balance, 0);
    const totalUtxos = whales.reduce((sum, w) => sum + w.utxoCount, 0);

    // Mock Address Labels for Top Addresses
    const knownWhales: Record<string, { label: string, color: string }> = {
        "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo": { label: "Binance Cold Storage", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
        "bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97": { label: "Bitfinex Cold Wallet", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
        "1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ": { label: "Unknown Miner", color: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
        "3M219KR5vEneNb47ewrPfWyb5jQ2RNwwGL": { label: "Mt. Gox Hack", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
    };

    const enhancedWhales = useMemo(() => {
        return whales.map(w => {
            // Mock a semi-deterministic 7d change based on address characters
            const changeChar = w.address.charCodeAt(w.address.length - 1);
            let flowDirection = changeChar % 3 === 0 ? -1 : changeChar % 2 === 0 ? 1 : 0; // -1 out, 1 in, 0 flat
            const flowAmount = flowDirection !== 0 ? (changeChar * 25) + (w.rank * 10) : 0;

            return {
                ...w,
                tag: knownWhales[w.address] || (w.rank <= 5 ? { label: "Exchange Cold Wallet", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" } : null),
                flow7d: flowAmount * flowDirection
            };
        });
    }, [whales]);

    const filteredWhales = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return enhancedWhales;
        return enhancedWhales.filter((w) =>
            String(w.rank) === q ||
            w.address.toLowerCase().includes(q) ||
            w.tag?.label.toLowerCase().includes(q)
        );
    }, [filter, enhancedWhales]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono selection:bg-cyan-500/30">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="md:hidden">
                    <Header />
                </div>
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="page-header">
                        <h1 className="page-title bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                            Whale Watch
                        </h1>
                        <div className="page-subtitle uppercase tracking-widest flex items-center gap-4">
                            <span>Top 20 addresses by balance</span>
                            {!loading && !error && (
                                <ProvenanceBadge
                                    source="Cached Snapshot"
                                    timestamp={new Date().toISOString().split('T')[0]}
                                />
                            )}
                        </div>
                    </div>
                    <Link href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors self-start md:self-auto inline-flex items-center min-h-11">
                        ← Back to Dashboard
                    </Link>
                </div>

                {loading ? (
                    <div className="text-sm text-slate-400">Loading weekly snapshot...</div>
                ) : null}
                {error ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                        {error}
                    </div>
                ) : null}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                            Open In Decoder
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const q = decoderQuery.trim();
                                if (!q) return;
                                router.push(`/explorer/decoder?query=${encodeURIComponent(q)}`);
                            }}
                            className="flex gap-2"
                        >
                            <input
                                value={decoderQuery}
                                onChange={(e) => setDecoderQuery(e.target.value)}
                                placeholder="Paste an address or txid..."
                                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                            />
                            <button
                                type="submit"
                                className="min-h-11 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-4 text-xs font-bold text-cyan-300 hover:border-cyan-500/50 hover:text-cyan-200"
                            >
                                Open
                            </button>
                        </form>
                        <div className="mt-2 text-[10px] text-slate-600">
                            Tip: In demo mode, the Decoder supports txid-only fallback.
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                            Filter This Table
                        </div>
                        <input
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Filter by rank or address..."
                            className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                        <div className="mt-2 text-[10px] text-slate-600">
                            Showing {filteredWhales.length} of {whales.length}.
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 border border-amber-500/30 rounded-xl p-5 text-center">
                        <div className="text-3xl font-bold text-amber-400">
                            {totalBtc.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Total BTC</div>
                    </div>
                    <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-5 text-center">
                        <div className="text-3xl font-bold text-cyan-400">
                            {totalUtxos.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Total UTXOs</div>
                    </div>
                    <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-5 text-center">
                        <div className="text-3xl font-bold text-purple-400">{whales.length.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Addresses Tracked</div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-full">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-2 md:p-4 w-20 text-center">Rank</th>
                                    <th className="p-2 md:p-4">Address</th>
                                    <th className="p-2 md:p-4 text-right">Balance (BTC)</th>
                                    <th className="p-2 md:p-4 text-right hidden lg:table-cell">7d Flow</th>
                                    <th className="p-2 md:p-4 text-right hidden md:table-cell">UTXOs</th>
                                    <th className="p-2 md:p-4 w-32 text-center hidden md:table-cell">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredWhales.map((whale) => (
                                    <tr
                                        key={whale.rank}
                                        className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
                                        onClick={() => handleViewWhale(whale.rank)}
                                    >
                                        <td className="p-2 md:p-4 text-center font-bold text-slate-600 group-hover:text-amber-500 transition-colors">
                                            #{whale.rank}
                                        </td>
                                        <td className="p-2 md:p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-mono text-xs md:text-sm text-cyan-300/80 group-hover:text-cyan-300 truncate max-w-[150px] md:max-w-md">
                                                    {whale.address}
                                                </div>
                                                {whale.tag && (
                                                    <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${whale.tag.color}`}>
                                                        {whale.tag.label}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-2 md:p-4 text-right font-bold text-slate-200">
                                            {whale.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-500 font-normal">BTC</span>
                                        </td>
                                        <td className="p-2 md:p-4 text-right hidden lg:table-cell">
                                            {whale.flow7d > 0 ? (
                                                <span className="text-emerald-400 text-xs flex items-center justify-end gap-1">
                                                    ↑ +{Math.abs(whale.flow7d).toLocaleString()}
                                                </span>
                                            ) : whale.flow7d < 0 ? (
                                                <span className="text-rose-400 text-xs flex items-center justify-end gap-1">
                                                    ↓ -{Math.abs(whale.flow7d).toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="p-2 md:p-4 text-right text-slate-400 hidden md:table-cell">
                                            <span className={whale.utxoCount > 1000 ? 'text-amber-400 font-bold' : ''}>
                                                {whale.utxoCount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-2 md:p-4 text-center hidden md:table-cell">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewWhale(whale.rank);
                                                    }}
                                                    className="min-h-11 text-[10px] bg-slate-800 hover:bg-cyan-900/50 text-slate-400 hover:text-cyan-300 border border-slate-700 rounded px-3 py-1 transition-all"
                                                >
                                                    VIEW UTXOS
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/explorer/decoder?query=${encodeURIComponent(whale.address)}`);
                                                    }}
                                                    className="min-h-11 text-[10px] bg-slate-800 hover:bg-amber-900/40 text-slate-400 hover:text-amber-300 border border-slate-700 rounded px-3 py-1 transition-all"
                                                >
                                                    DECODE
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
