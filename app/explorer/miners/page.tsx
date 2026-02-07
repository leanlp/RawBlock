"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Header from '../../../components/Header';
import Card, { CardRow } from '../../../components/Card';
import EmptyState, { LoadingState, ErrorState } from '../../../components/EmptyState';
import PageHeader from '../../../components/PageHeader';

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
    const router = useRouter();
    const [data, setData] = useState<MinerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        setError(null);

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/miners`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <PageHeader
                    title="Miner Identification"
                    subtitle="Forensic analysis of coinbase signatures from recent blocks."
                    icon="⛏️"
                    gradient="from-amber-400 to-orange-500"
                />

                {loading && <LoadingState message="Scanning blockchain for signatures..." />}

                {!loading && error && <ErrorState message={error} onRetry={fetchData} />}

                {!loading && !error && (!data || !data.blocks || data.blocks.length === 0) && (
                    <EmptyState
                        icon="⛏️"
                        title="No Miner Data"
                        description="Could not retrieve miner information."
                        action={{ label: "Retry", onClick: fetchData }}
                    />
                )}

                {!loading && !error && data && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Chart Section */}
                        {data.distribution && data.distribution.length > 0 && (
                            <Card variant="panel" accent="orange" className="h flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        Hashrate Distribution (Last {data.blocks?.length || 0} Blocks)
                                    </h3>
                                </div>
                                <div className="h-[300px] w-full flex-1">
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
                            </Card>
                        )}

                        {/* List Section */}
                        <Card variant="panel" className="p-0 overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-800">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Forensic Ledger</h3>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden p-4 space-y-3">
                                {(data.blocks || []).map((block) => (
                                    <Card
                                        key={block.hash}
                                        onClick={() => router.push(`/explorer/block/${block.hash}`)}
                                        className="p-4"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-lg font-bold text-cyan-400 font-mono">
                                                #{block.height}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${block.miner === 'Unknown'
                                                ? 'bg-slate-800 text-slate-500'
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                }`}>
                                                {block.miner}
                                            </span>
                                        </div>
                                        <CardRow
                                            label="Time"
                                            value={new Date(block.time * 1000).toLocaleTimeString()}
                                            mono
                                        />
                                    </Card>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Height</th>
                                            <th className="px-6 py-3 font-medium">Miner Tag</th>
                                            <th className="px-6 py-3 font-medium text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {(data.blocks || []).map((block) => (
                                            <tr
                                                key={block.hash}
                                                className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/explorer/block/${block.hash}`)}
                                            >
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
                        </Card>
                    </div>
                )}
            </div>
        </main>
    );
}
