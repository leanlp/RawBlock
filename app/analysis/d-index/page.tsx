"use client";

import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { motion } from "framer-motion";
import { calculateDIndex, DIndexResult } from "../../../utils/d-index";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";

export default function DIndexPage() {
    const [result, setResult] = useState<DIndexResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate aggregating data from our various endpoints
        // In a real app, we'd fetch /api/miners, /api/network-stats, etc.
        // Here we simulate the values for the MVP demonstration of the Index.

        async function constructIndex() {
            setLoading(true);
            await new Promise(r => setTimeout(r, 1500)); // Dramatic pause

            // Simulation Data Points
            const nakamoto = 2; // Only 2 pools needed for 51% (Foundry + Antpool usually ~55%)
            const usNodeShare = 30; // US hosts ~30% of nodes
            const whaleHoldings = 15; // Top 100 addresses hold ~15%? (Just a guess for demo)
            const adoption = 85; // SegWit usage is high

            const index = calculateDIndex(nakamoto, usNodeShare, whaleHoldings, adoption);
            setResult(index);
            setLoading(false);
        }

        constructIndex();
    }, []);

    const radarData = result ? [
        { subject: 'Mining Resilience', A: result.metrics.miningResilience, fullMark: 100 },
        { subject: 'Node Diversity', A: result.metrics.nodeDiversity, fullMark: 100 },
        { subject: 'Economic Breadth', A: result.metrics.economicBreadth, fullMark: 100 },
        { subject: 'Protocol Modernity', A: result.metrics.protocolModernity, fullMark: 100 },
    ] : [];

    const getGradeColor = (grade: string) => {
        if (grade === 'AAA' || grade === 'A') return 'text-emerald-400';
        if (grade === 'B') return 'text-cyan-400';
        if (grade === 'C') return 'text-yellow-400';
        return 'text-red-500';
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
                            The D-Index 🌍
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">Global Network Health & Decentralization Score.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center animate-pulse">
                        <div className="text-6xl mb-4">🩺</div>
                        <div className="text-slate-500">Auditing Network Vitality...</div>
                    </div>
                ) : result && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* LEFT: The Big Score */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                            </div>

                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Aggregate Health Score</h2>

                            <div className="relative w-64 h-64 flex items-center justify-center">
                                {/* SVG Circle Progress could go here, for now simpler text */}
                                <div className={`text-[120px] font-black leading-none ${getGradeColor(result.grade)}`}>
                                    {result.score}
                                </div>
                            </div>

                            <div className={`text-3xl font-bold mt-4 ${getGradeColor(result.grade)}`}>
                                GRADE: {result.grade}
                            </div>

                            <div className="mt-8 space-y-2 w-full">
                                {result.analysis.map((msg, i) => (
                                    <div key={i} className="bg-slate-950/50 p-3 rounded border-l-4 border-yellow-500 text-xs text-slate-300">
                                        {msg}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* RIGHT: The Radar */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative"
                        >
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Metric Composition</h2>

                            <div className="h-[400px] w-full">
                                <SafeResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Score"
                                            dataKey="A"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fill="#10b981"
                                            fillOpacity={0.3}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                                            labelStyle={{ color: '#cbd5e1' }}
                                        />
                                    </RadarChart>
                                </SafeResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="bg-slate-800/30 p-3 rounded">
                                    <div className="text-[10px] text-slate-500 uppercase">Mining Resilience</div>
                                    <div className="text-xl font-bold text-slate-200">{result.metrics.miningResilience}/100</div>
                                </div>
                                <div className="bg-slate-800/30 p-3 rounded">
                                    <div className="text-[10px] text-slate-500 uppercase">Node Diversity</div>
                                    <div className="text-xl font-bold text-slate-200">{result.metrics.nodeDiversity}/100</div>
                                </div>
                                <div className="bg-slate-800/30 p-3 rounded">
                                    <div className="text-[10px] text-slate-500 uppercase">Economic Breadth</div>
                                    <div className="text-xl font-bold text-slate-200">{result.metrics.economicBreadth}/100</div>
                                </div>
                                <div className="bg-slate-800/30 p-3 rounded">
                                    <div className="text-[10px] text-slate-500 uppercase">Proto Modernity</div>
                                    <div className="text-xl font-bold text-slate-200">{result.metrics.protocolModernity}/100</div>
                                </div>
                            </div>

                        </motion.div>

                    </div>
                )}
            </div>
        </main>
    );
}
