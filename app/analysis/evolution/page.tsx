"use client";

import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import io from "socket.io-client";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";

interface EvolutionData {
    distribution: {
        legacy: number;
        segwit: number;
        taproot: number;
    };
    wastedSpace: string | number;
    fatFingers: Array<{
        txid: string;
        feeRate: string;
        overpay: string;
        size: number;
    }>;
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981']; // Red (Legacy), Amber (Segwit), Emerald (Taproot)

export default function EvolutionPage() {
    const [data, setData] = useState<EvolutionData | null>(null);

    useEffect(() => {
        // Initial Fetch
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/evolution`)
            .then(res => res.json())
            .then(setData)
            .catch(console.error);

        // Socket
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
        socket.on('evolution:update', (newData: EvolutionData) => {
            setData(newData);
        });

        return () => { socket.disconnect(); };
    }, []);

    const chartData = data ? [
        { name: 'Legacy (Old)', value: data.distribution.legacy },
        { name: 'SegWit (Modern)', value: data.distribution.segwit },
        { name: 'Taproot (Next-Gen)', value: data.distribution.taproot },
    ] : [];

    // Derive a bounded percent from distribution to avoid impossible values (>100%).
    const legacyShare = data?.distribution.legacy ?? 0;
    const estimatedWastedSpace = Math.max(0, Math.min(100, legacyShare * 0.4));

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
                            Chain Evolution 🧬
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">Analyzing Protocol Adoption & Network Inefficiency.</p>
                    </div>
                </div>

                {!data ? (
                    <div className="text-center py-20 text-slate-500 animate-pulse">Sequencing Mempool DNA...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* THE GENE POOL */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
                            <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">The Gene Pool (Script Types)</h2>

                            <div className="h-[300px] w-full flex items-center justify-center">
                                <SafeResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                            formatter={(val: any) => Number(val).toFixed(1) + '%'}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </SafeResponsiveContainer>
                            </div>

                            <div className="mt-4 p-4 bg-slate-800/30 rounded-lg text-center">
                                <div className="text-sm text-slate-400">Estimated Capacity Loss</div>
                                <div className="text-2xl font-bold text-red-400">
                                    {estimatedWastedSpace.toFixed(1)}%
                                    <span className="text-xs text-slate-500 font-normal"> from Legacy Script Usage</span>
                                </div>
                            </div>
                        </div>

                        {/* FAT FINGER DETECTOR */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest">⚠️ "Fat Finger" Monitor</h2>
                                <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded-full border border-red-900/50 animate-pulse">Live Feed</div>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {data.fatFingers.length === 0 ? (
                                    <div className="text-center text-slate-600 py-10">
                                        No gross overpayments detected recently.
                                    </div>
                                ) : (
                                    data.fatFingers.map((tx, index) => (
                                        <motion.div
                                            key={`${tx.txid}-${index}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-red-500/30 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-mono text-slate-400 truncate w-32">{tx.txid.substring(0, 12)}...</span>
                                                <span className="text-red-400 font-bold text-xs">+{tx.overpay} sats OVER</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Paid: <span className="text-slate-300">{tx.feeRate} sat/vB</span></span>
                                                <span>Size: {tx.size} vB</span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}
