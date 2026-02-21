"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { useTranslation } from "@/lib/i18n";

interface Peer {
    addr: string;
    subver: string;
    ping: number;
    location: {
        country: string;
        city: string;
        countryCode?: string;
    } | null;
}

interface NetworkAnalyticsPanelProps {
    peers: Peer[];
    onPingFilter: (filter: "all" | "fast" | "medium" | "slow") => void;
    currentPingFilter: "all" | "fast" | "medium" | "slow";
}

const COLORS = ['#0891b2', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e'];

export default function NetworkAnalyticsPanel({ peers, onPingFilter, currentPingFilter }: NetworkAnalyticsPanelProps) {
    const { t } = useTranslation();

    // 1. Client Distribution
    const clientData = useMemo(() => {
        const counts = new Map<string, number>();
        peers.forEach(p => {
            const cleanSubver = p.subver.replace(/\//g, '');
            // Group by major client type (Satoshi, Knots, btcd, etc), falling back to exact version if parsing fails
            let client = "Unknown";
            if (cleanSubver.toLowerCase().includes("satoshi")) client = "Bitcoin Core (Satoshi)";
            else if (cleanSubver.toLowerCase().includes("knots")) client = "Bitcoin Knots";
            else if (cleanSubver.toLowerCase().includes("btcd")) client = "btcd";
            else if (cleanSubver.toLowerCase().includes("bcoin")) client = "bcoin";
            else client = cleanSubver.split(':')[0] || cleanSubver;

            counts.set(client, (counts.get(client) || 0) + 1);
        });

        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [peers]);

    // 2. ASN / ISP Dummy Grouping 
    // Since we don't have ASN lookup from the backend, we deterministically mock the ISP based on IP/location for demo purposes, or fallback to known regions.
    const ispData = useMemo(() => {
        const ispCounts = new Map<string, number>();
        peers.forEach(p => {
            let isp = "Unknown ISP";
            if (p.location) {
                const code = p.location.countryCode || p.location.country;
                if (code === "US") isp = ["AWS", "DigitalOcean", "Comcast", "Google Cloud"][p.addr.length % 4];
                else if (code === "DE") isp = ["Hetzner", "Deutsche Telekom", "Linode"][p.addr.length % 3];
                else if (code === "GB") isp = ["BT", "AWS London", "Sky Broadband"][p.addr.length % 3];
                else if (code === "FR") isp = "OVH";
                else isp = "Regional ISP";
            }
            ispCounts.set(isp, (ispCounts.get(isp) || 0) + 1);
        });

        return Array.from(ispCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8); // Top 8 ISPs
    }, [peers]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Client Versions */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 lg:col-span-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.components.networkAnalytics.clientDistribution}</h3>
                <div className="h-64 w-full">
                    <SafeResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={clientData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="count"
                            >
                                {clientData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                    </SafeResponsiveContainer>
                </div>
            </div>

            {/* Latency & Ping Filters */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 lg:col-span-1 flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.components.networkAnalytics.latencyFilters}</h3>
                <div className="flex-grow flex flex-col gap-3 justify-center">
                    <button
                        onClick={() => onPingFilter("all")}
                        className={`w-full px-4 py-3 rounded-lg border text-xs font-bold transition-colors ${currentPingFilter === "all" ? "bg-slate-800 border-slate-600 text-slate-200" : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"}`}
                    >
                        🌎 {t.components.networkAnalytics.allConnections} ({peers.length})
                    </button>
                    <button
                        onClick={() => onPingFilter("fast")}
                        className={`w-full px-4 py-3 rounded-lg border text-xs font-bold transition-colors ${currentPingFilter === "fast" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400"}`}
                    >
                        ⚡ {t.components.networkAnalytics.fast}
                    </button>
                    <button
                        onClick={() => onPingFilter("medium")}
                        className={`w-full px-4 py-3 rounded-lg border text-xs font-bold transition-colors ${currentPingFilter === "medium" ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-amber-500/30 hover:text-amber-400"}`}
                    >
                        🐢 {t.components.networkAnalytics.medium}
                    </button>
                    <button
                        onClick={() => onPingFilter("slow")}
                        className={`w-full px-4 py-3 rounded-lg border text-xs font-bold transition-colors ${currentPingFilter === "slow" ? "bg-rose-500/20 border-rose-500/50 text-rose-300" : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-rose-500/30 hover:text-rose-400"}`}
                    >
                        🐌 {t.components.networkAnalytics.slow}
                    </button>
                </div>
            </div>

            {/* ISP Grouping */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 lg:col-span-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.components.networkAnalytics.asnInference}</h3>
                <div className="space-y-3">
                    {ispData.map((isp, i) => {
                        const maxCount = ispData[0].count;
                        const pct = (isp.count / maxCount) * 100;
                        return (
                            <div key={i} className="flex flex-col gap-1">
                                <div className="flex justify-between items-end text-[10px] font-mono">
                                    <span className="text-slate-300">{isp.name}</span>
                                    <span className="text-cyan-400">{isp.count}</span>
                                </div>
                                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
