"use client";

import { useEffect, useState } from "react";
import Header from '../../../components/Header';
import Link from "next/link";

interface VitalsData {
    halving?: {
        nextHeight: number;
        blocksRemaining: number;
        estDate: string;
    };
    difficulty?: {
        current: number;
        networkHashps: number;
    };
    node?: {
        version: string;
        uptime: number; // seconds
        bandwidth?: {
            sent: number;
            recv: number;
        };
    };
}

export default function VitalsPage() {
    const [data, setData] = useState<VitalsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/vitals`)
            .then(res => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Vitals fetch error:", err);
                setError(err.message || "Failed to load network vitals.");
                setLoading(false);
            });
    }, []);

    const formatUptime = (seconds: number) => {
        if (!seconds && seconds !== 0) return "N/A";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    const formatBytes = (bytes?: number) => {
        if (bytes === undefined || bytes === null) return '0 B';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatHashrate = (hashes?: number) => {
        if (!hashes) return "Measuring...";
        const eh = hashes / 1e18;
        return eh.toFixed(2) + " EH/s";
    };

    // Calculate time diff for countdown (rough)
    const getTimeDiff = (targetDate?: string) => {
        if (!targetDate) return { days: 0, hours: 0, minutes: 0 };
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        if (isNaN(target)) return { days: 0, hours: 0, minutes: 0 };

        const diff = Math.max(0, target - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    };

    const countdown = getTimeDiff(data?.halving?.estDate);

    // Defensive render checks
    const hasHalving = !!data?.halving;
    const hasDifficulty = !!data?.difficulty;
    const hasNode = !!data?.node;

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-center md:items-end pb-6 border-b border-slate-800">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                            Protocol Vital Signs
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">Monitoring the heartbeat of the Bitcoin Network.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500 animate-pulse">Establishing uplink to node...</div>
                ) : error ? (
                    <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
                        <h3 className="text-red-400 font-bold mb-2">Connection Failure</h3>
                        <p className="text-red-300 text-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold transition-colors"
                        >
                            Retry Uplink
                        </button>
                    </div>
                ) : data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* HALVING COUNTDOWN HERO */}
                        {hasHalving ? (
                            <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-10 relative overflow-hidden backdrop-blur-sm group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
                                <h2 className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mb-8 text-center">Next Halving Event</h2>

                                <div className="flex justify-center items-start gap-4 md:gap-12 text-center">
                                    <div>
                                        <div className="text-5xl md:text-7xl font-black text-slate-100 tabular-nums">{countdown.days}</div>
                                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Days</div>
                                    </div>
                                    <div className="text-5xl md:text-7xl font-thin text-slate-700 leading-none pt-1">:</div>
                                    <div>
                                        <div className="text-5xl md:text-7xl font-black text-slate-100 tabular-nums">{countdown.hours}</div>
                                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Hours</div>
                                    </div>
                                    <div className="text-5xl md:text-7xl font-thin text-slate-700 leading-none pt-1">:</div>
                                    <div>
                                        <div className="text-5xl md:text-7xl font-black text-slate-100 tabular-nums">{countdown.minutes}</div>
                                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Minutes</div>
                                    </div>
                                </div>

                                <div className="mt-8 text-center">
                                    <div className="inline-block px-4 py-2 bg-slate-800 rounded-full text-xs font-mono text-purple-300">
                                        Target Block: <span className="text-white font-bold">{data.halving!.nextHeight.toLocaleString()}</span>
                                        <span className="mx-2 text-slate-600">|</span>
                                        Remaining: <span className="text-white font-bold">{data.halving!.blocksRemaining.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="md:col-span-2 p-10 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500">
                                Halving data unavailable
                            </div>
                        )}

                        {/* Difficulty & Hashrate */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Network Security</h3>
                            {hasDifficulty ? (
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-2xl md:text-3xl font-black text-white">{formatHashrate(data.difficulty!.networkHashps)}</div>
                                        <div className="text-sm text-slate-400">Global Hashrate</div>
                                    </div>
                                    <div className="h-px bg-slate-800" />
                                    <div>
                                        <div className="text-xl md:text-2xl font-bold text-slate-200 tabular-nums">{(data.difficulty!.current / 1e12).toFixed(2)} T</div>
                                        <div className="text-sm text-slate-400">Mining Difficulty</div>
                                    </div>
                                </div>
                            ) : (<div className="text-slate-600 text-sm">Security metrics unavailable</div>)}
                        </div>

                        {/* Node Health */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Local Node Health</h3>
                            {hasNode ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-800/50 rounded-lg">
                                        <div className="text-xs text-slate-400 mb-1">Uptime</div>
                                        <div className="text-lg font-mono text-emerald-400">{formatUptime(data.node!.uptime)}</div>
                                    </div>
                                    <div className="p-4 bg-slate-800/50 rounded-lg">
                                        <div className="text-xs text-slate-400 mb-1">Version</div>
                                        <div className="text-sm md:text-lg font-mono text-slate-200 break-all leading-tight">
                                            {data.node!.version ? data.node!.version.replace(/\//g, '') : 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-800/50 rounded-lg">
                                        <div className="text-xs text-slate-400 mb-1">Data Upload</div>
                                        <div className="text-lg font-mono text-cyan-400">{formatBytes(data.node!.bandwidth?.sent)}</div>
                                    </div>
                                    <div className="p-4 bg-slate-800/50 rounded-lg">
                                        <div className="text-xs text-slate-400 mb-1">Data Download</div>
                                        <div className="text-lg font-mono text-indigo-400">{formatBytes(data.node!.bandwidth?.recv)}</div>
                                    </div>
                                </div>
                            ) : (<div className="text-slate-600 text-sm">Node connection inactive</div>)}
                        </div>

                    </div>
                ) : null}
            </div>
        </main>
    );
}
