'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';

// Static imports - all whale data embedded in frontend
import whale01 from '../../../data/whales/whale_01.json';
import whale02 from '../../../data/whales/whale_02.json';
import whale03 from '../../../data/whales/whale_03.json';
import whale04 from '../../../data/whales/whale_04.json';
import whale05 from '../../../data/whales/whale_05.json';
import whale06 from '../../../data/whales/whale_06.json';
import whale07 from '../../../data/whales/whale_07.json';
import whale08 from '../../../data/whales/whale_08.json';
import whale09 from '../../../data/whales/whale_09.json';
import whale10 from '../../../data/whales/whale_10.json';
import whale11 from '../../../data/whales/whale_11.json';
import whale12 from '../../../data/whales/whale_12.json';
import whale13 from '../../../data/whales/whale_13.json';
import whale14 from '../../../data/whales/whale_14.json';
import whale15 from '../../../data/whales/whale_15.json';
import whale16 from '../../../data/whales/whale_16.json';
import whale17 from '../../../data/whales/whale_17.json';
import whale18 from '../../../data/whales/whale_18.json';
import whale19 from '../../../data/whales/whale_19.json';
import whale20 from '../../../data/whales/whale_20.json';

// All whales array for easy access
const allWhales = [
    whale01, whale02, whale03, whale04, whale05,
    whale06, whale07, whale08, whale09, whale10,
    whale11, whale12, whale13, whale14, whale15,
    whale16, whale17, whale18, whale19, whale20
];

interface WhaleData {
    rank: number;
    address: string;
    balance: number;
    utxoCount: number;
    fetchedAt: string;
}

export default function RichListPage() {
    const router = useRouter();
    const [decoderQuery, setDecoderQuery] = useState("");
    const [filter, setFilter] = useState("");

    const whales: WhaleData[] = useMemo(
        () =>
            allWhales.map((w) => ({
                rank: w.rank,
                address: w.address,
                balance: w.balance,
                utxoCount: w.utxoCount,
                fetchedAt: w.fetchedAt,
            })),
        [],
    );

    const handleViewWhale = (rank: number) => {
        router.push(`/explorer/rich-list/${rank}`);
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const totalBtc = whales.reduce((sum, w) => sum + w.balance, 0);
    const totalUtxos = whales.reduce((sum, w) => sum + w.utxoCount, 0);

    const filteredWhales = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return whales;
        return whales.filter((w) =>
            String(w.rank) === q ||
            w.address.toLowerCase().includes(q)
        );
    }, [filter, whales]);

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
                        <p className="page-subtitle uppercase tracking-widest">
                            Top 20 addresses by balance • static snapshot
                        </p>
                    </div>
                    <Link href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors self-start md:self-auto inline-flex items-center min-h-11">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Data Source Notice */}
                <div className="bg-sky-900/20 border border-sky-500/30 rounded-lg px-4 py-3 text-xs text-sky-200/90">
                    ℹ️ <span className="font-bold">Static address snapshot</span> — This table ranks single addresses, not entities.
                    Exchanges/custodians may represent many users. Use the Decoder for details.
                    Last updated: {formatDate(whales[0]?.fetchedAt)}
                </div>

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
                        <div className="text-3xl font-bold text-purple-400">20</div>
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
                                        <td className="p-2 md:p-4 font-mono text-xs md:text-sm text-cyan-300/80 group-hover:text-cyan-300">
                                            {whale.address.slice(0, 12)}...{whale.address.slice(-8)}
                                        </td>
                                        <td className="p-2 md:p-4 text-right font-bold text-slate-200">
                                            {whale.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC
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
