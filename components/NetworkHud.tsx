"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from "@/lib/i18n";

interface NetworkStats {
    version?: string;
    peers?: number;
    difficulty?: number;
    hashrate?: number;
    chain?: string;
    blocks?: number;
    fees?: {
        fast?: number | string;
        medium?: number | string;
        slow?: number | string;
    };
}

export default function NetworkHud() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://apigoland.rawblock.net').replace(/\/$/, '');
            const res = await fetch(`${apiUrl}/api/network-stats`);
            if (!res.ok) return;
            const json = await res.json();
            setStats(json);
        } catch (e) {
            console.error("Failed to fetch network stats", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    // Formatter
    const formatHashrate = (h?: number) => {
        if (!h || !Number.isFinite(h)) return "0 H/s";
        const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s'];
        const e = Math.floor(Math.log(h) / Math.log(1000));
        return (h / Math.pow(1000, e)).toFixed(2) + " " + units[e];
    };

    const formatDiff = (d?: number) => {
        if (!d || !Number.isFinite(d)) return "—";
        return (d / 1000000000000).toFixed(2) + " T";
    };

    if (loading) return null;
    if (!stats) return null;

    const fastFee = stats.fees?.fast !== undefined && stats.fees?.fast !== null ? String(stats.fees.fast) : "—";
    const slowFee = stats.fees?.slow !== undefined && stats.fees?.slow !== null ? String(stats.fees.slow) : "—";

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 p-4 z-50">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">

                {/* Node Identity */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-widest text-[10px]">{t.components.networkHud.yourNode}</span>
                        <span className="text-cyan-400 font-bold">{stats.version ?? "/Satoshi:28.1.0/"}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-widest text-[10px]">{t.components.networkHud.peers}</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {stats.peers ?? 0}
                        </span>
                    </div>
                </div>

                {/* Global Stats */}
                <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-slate-500 uppercase tracking-widest text-[10px]">{t.components.networkHud.hashrate}</div>
                        <div className="text-slate-300 font-bold">{formatHashrate(stats.hashrate)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-500 uppercase tracking-widest text-[10px]">{t.components.networkHud.difficulty}</div>
                        <div className="text-slate-300 font-bold">{formatDiff(stats.difficulty)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-500 uppercase tracking-widest text-[10px]">{t.components.networkHud.blocks}</div>
                        <div className="text-slate-300 font-bold">{stats.blocks !== undefined ? stats.blocks.toLocaleString() : "—"}</div>
                    </div>
                </div>

                {/* Fee Estimator */}
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex items-center gap-4">
                    <div className="text-slate-500 uppercase tracking-widest text-[10px] mr-1">{t.components.networkHud.fees}</div>

                    <div className="flex flex-col items-center">
                        <span className="text-fuchsia-400 font-bold text-sm">{fastFee}</span>
                        <span className="text-slate-600 text-[9px]">{t.components.networkHud.highPriority}</span>
                    </div>

                    <div className="w-px h-6 bg-slate-800"></div>

                    <div className="flex flex-col items-center">
                        <span className="text-blue-400 font-bold text-sm">{slowFee}</span>
                        <span className="text-slate-600 text-[9px]">{t.components.networkHud.economy}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
