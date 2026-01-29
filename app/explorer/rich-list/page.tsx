'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';

interface Whale {
    rank: number;
    address: string;
    balance: number;
}

export default function RichListPage() {
    const [whales, setWhales] = useState<Whale[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchWhales = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/rich-list`);
                const data = await res.json();
                setWhales(data);
            } catch (err) {
                console.error('Failed to fetch rich list', err);
            } finally {
                setLoading(false);
            }
        };
        fetchWhales();
    }, []);

    const handleInspect = (address: string) => {
        // Navigate to Decoder with the address pre-filled (user needs to find TXID manually for now, 
        // or we update Decoder to handle address search - but for now checking balance is "verify with node")
        // Actually, let's just copy to clipboard for now or go to decoder
        router.push(`/explorer/decoder?query=${address}`);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono selection:bg-cyan-500/30">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-600 mb-2">
                            Whale Watch
                        </h1>
                        <p className="text-slate-400 text-sm uppercase tracking-widest">Global Rich List • Verified Snapshot</p>
                    </div>
                    <Link href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Leaderboard */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4 w-20 text-center">Rank</th>
                                <th className="p-4">Address</th>
                                <th className="p-4 text-right">Balance (BTC)</th>
                                <th className="p-4 w-40 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-500 animate-pulse">Loading Whale Data...</td>
                                </tr>
                            ) : whales.map((whale) => (
                                <tr key={whale.rank} className="group hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-center font-bold text-slate-600 group-hover:text-amber-500 transition-colors">
                                        #{whale.rank}
                                    </td>
                                    <td className="p-4 font-mono text-sm text-cyan-300/80 group-hover:text-cyan-300 break-all">
                                        {whale.address}
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-200">
                                        {whale.balance.toLocaleString()} BTC
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleInspect(whale.address)}
                                            className="text-[10px] bg-slate-800 hover:bg-cyan-900/50 text-slate-400 hover:text-cyan-300 border border-slate-700 rounded px-3 py-1 transition-all"
                                        >
                                            INSPECT
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
