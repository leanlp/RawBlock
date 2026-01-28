"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';

interface BlockInfo {
    height: number;
    hash: string;
    time: number;
    miner: string;
    coinbaseHex: string;
}

interface Distribution {
    name: string;
    count: number;
}

interface MinerData {
    blocks: BlockInfo[];
    distribution: Distribution[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57'];

export default function MinersPage() {
    const [data, setData] = useState<MinerData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/miners`)
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                            Miner Identification
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">Forensic analysis of coinbase signatures from recent blocks.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500 animate-pulse">Scanning blockchain for signatures...</div>
                ) : data ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Chart Section */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Hashrate Distribution (Last {data.blocks.length} Blocks)</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.distribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="count"
                                        >
                                            {data.distribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                            itemStyle={{ color: '#f1f5f9' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                            <div className="px-6 py-4 border-b border-slate-800">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Forensic Ledger</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Height</th>
                                            <th className="px-6 py-3 font-medium">Miner Tag</th>
                                            <th className="px-6 py-3 font-medium text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {data.blocks.map((block) => (
                                            <tr key={block.hash} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-cyan-300">{block.height}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${block.miner === 'Unknown'
                                                        ? 'bg-slate-800 text-slate-500'
                                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                        {block.miner}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-slate-500">
                                                    {new Date(block.time * 1000).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-red-400">Failed to load data.</div>
                )}
            </div>
        </main>
    );
}
