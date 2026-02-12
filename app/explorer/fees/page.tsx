"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { LoadingState, ErrorState } from "../../../components/EmptyState";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";

interface FeeEntry {
    timestamp: number; // API returns 'timestamp', not 'time'
    fast: number;   // 1 block
    medium: number; // 6 blocks
    slow: number;   // 144 blocks
}

export default function FeesPage() {
    const [history, setHistory] = useState<FeeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { metrics } = useBitcoinLiveMetrics(30_000);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const [historyRes] = await Promise.allSettled([fetch(`${baseUrl}/api/fee-history`)]);

            if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
                const data = await historyRes.value.json();
                const normalized = data.map((entry: any) => ({
                    ...entry,
                    time: entry.time || entry.timestamp,
                    timestamp: entry.timestamp || entry.time
                }));
                setHistory(normalized);
            }

            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Unable to load fee market data. The API might be offline.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Format time for chart
    const formatTime = (time: number) => {
        return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper to format fee value safely
    const formatFee = (val: number | null | undefined) => {
        if (val === undefined || val === null) return "---";
        return val;
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                            Fee Market Intelligence
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">Real-time estimation and historical trend analysis.</p>
                    </div>
                </div>

                {loading && <LoadingState message="Analyzing mempool dynamics..." />}

                {!loading && error && <ErrorState message={error} onRetry={fetchData} />}

                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Priority Cards */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Economy (Low Priority)</h3>
                            <div className="text-4xl font-black text-slate-200">{formatFee(metrics?.feeHour)} <span className="text-lg font-medium text-slate-500">sat/vB</span></div>
                            <p className="text-xs text-slate-400 mt-2">~1 Hour Confirmation</p>
                        </div>

                        <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Standard (Recommended)</h3>
                            <div className="text-5xl font-black text-amber-400">{formatFee(metrics?.feeHalfHour)} <span className="text-lg font-medium text-amber-500/70">sat/vB</span></div>
                            <p className="text-xs text-slate-400 mt-2">~30 Min Confirmation</p>
                        </div>

                        <div className="bg-slate-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Express (Next Block)</h3>
                            <div className="text-4xl font-black text-red-400">{formatFee(metrics?.feeFast)} <span className="text-lg font-medium text-red-500/70">sat/vB</span></div>
                            <p className="text-xs text-slate-400 mt-2">~10 Min Confirmation</p>
                        </div>

                        {/* Chart Section */}
                        <div className="md:col-span-3 bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm min-h-[400px]">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">24-Hour Fee Trend (The "Purge" Graph)</h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono">
                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>Economy</span>
                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span>Standard</span>
                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>Express</span>
                                </div>
                            </div>

                            <div className="h-[350px] w-full min-w-0">
                                <SafeResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={history}>
                                        <defs>
                                            <linearGradient id="colorSlow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorFast" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={formatTime}
                                            stroke="#475569"
                                            tick={{ fontSize: 12 }}
                                            minTickGap={50}
                                        />
                                        <YAxis stroke="#475569" tick={{ fontSize: 12 }} label={{ value: 'Sat/vByte', angle: -90, position: 'insideLeft', fill: '#475569' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                            labelFormatter={(value: any) => formatTime(Number(value))}
                                        />
                                        <Area type="monotone" dataKey="fast" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFast)" activeDot={{ r: 6 }} name="Express" />
                                        <Area type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorMedium)" activeDot={{ r: 6 }} name="Standard" />
                                        <Area type="monotone" dataKey="slow" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSlow)" activeDot={{ r: 6 }} name="Economy" />
                                    </AreaChart>
                                </SafeResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}
