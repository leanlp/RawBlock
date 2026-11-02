"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import Card, { CardRow } from "../../components/Card";
import { LoadingState } from "../../components/EmptyState";
import { Activity, Server, Clock, ShieldCheck, Database } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || "https://apigoland.rawblock.net"
).replace(/\/$/, "");

interface OpsTelemetry {
    uptime: string;
    lastBlockSynced: number;
    syncSubtitle: string;
    mempoolActive: boolean;
    latency: string;
    backendStatus: string;
    bitcoinStatus: string;
    dbState: string;
    electrsState: string;
    lastChecked: string;
}

export default function OpsPage() {
    const [loading, setLoading] = useState(true);
    const [opsData, setOpsData] = useState<OpsTelemetry | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        let cancelled = false;

        async function loadLiveOps() {
            const started = performance.now();
            try {
                const [healthRes, nodeRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" }),
                    fetch(`${API_BASE_URL}/api/node-health`, { cache: "no-store" }),
                ]);
                const elapsedMs = Math.max(1, Math.round(performance.now() - started));
                const health = healthRes.ok ? await healthRes.json() : null;
                const node = nodeRes.ok ? await nodeRes.json() : null;

                const chain = node?.chain ?? {};
                const deps = health?.dependencies ?? {};
                const inIBD = Boolean(chain.initialBlockDownload);
                const progressPct = typeof chain.verificationProgress === "number"
                    ? `${(chain.verificationProgress * 100).toFixed(1)}%`
                    : "Synced";
                const btcLatency = deps?.bitcoin?.latency_ms
                    ? `${deps.bitcoin.latency_ms}ms`
                    : `${elapsedMs}ms`;

                if (!cancelled) {
                    setOpsData({
                        uptime: health?.ok ? "Operational" : "Degraded",
                        lastBlockSynced: typeof chain.blocks === "number" ? chain.blocks : 0,
                        syncSubtitle: inIBD ? `Initial Sync (${progressPct})` : "Synced with Network",
                        mempoolActive: Boolean(node?.mempool?.loaded ?? health?.ok),
                        latency: btcLatency,
                        backendStatus: health?.ok ? "Operational" : "Degraded",
                        bitcoinStatus: deps?.bitcoin?.ok
                            ? (inIBD ? `Syncing (${progressPct})` : "Operational")
                            : "Unreachable",
                        dbState: deps?.database?.ok ? "Healthy" : "Stateless / Degraded",
                        electrsState: deps?.electrs?.ok ? "Healthy" : "Fallback",
                        lastChecked: health?.timestamp || new Date().toISOString(),
                    });
                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setOpsData({
                        uptime: "Degraded",
                        lastBlockSynced: 0,
                        syncSubtitle: "Telemetry Unreachable",
                        mempoolActive: false,
                        latency: "—",
                        backendStatus: "Unreachable",
                        bitcoinStatus: "Unknown",
                        dbState: "Unknown",
                        electrsState: "Unknown",
                        lastChecked: new Date().toISOString(),
                    });
                    setLoading(false);
                }
            }
        }

        loadLiveOps();
        const interval = setInterval(loadLiveOps, 30000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-900 selection:text-cyan-100 pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <Header />

                <div className="mb-10">
                    <PageHeader
                        title={t.ops.title}
                        subtitle={t.ops.subtitle}
                        icon={<ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />}
                        gradient="from-emerald-400 to-cyan-500"
                    />
                </div>

                {loading || !opsData ? (
                    <LoadingState message={t.common.loading} />
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card variant="panel" className="p-5 bg-slate-900/50 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Status</h3>
                                    <Activity className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-2xl font-bold text-emerald-400">{opsData.uptime}</div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase">Live Health Probe</div>
                            </Card>

                            <Card variant="panel" className="p-5 bg-slate-900/50 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Index Height</h3>
                                    <Database className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="text-3xl font-bold text-cyan-400">
                                    {opsData.lastBlockSynced > 0 ? `#${opsData.lastBlockSynced.toLocaleString()}` : "—"}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase">{opsData.syncSubtitle}</div>
                            </Card>

                            <Card variant="panel" className="p-5 bg-slate-900/50 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mempool Sync</h3>
                                    <Server className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className="text-3xl font-bold text-amber-400">{opsData.mempoolActive ? "Active" : "Degraded"}</div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase">Bitcoin Core Mempool</div>
                            </Card>

                            <Card variant="panel" className="p-5 bg-slate-900/50 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Node RPC Latency</h3>
                                    <Clock className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="text-3xl font-bold text-purple-400">{opsData.latency}</div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase">Live Round-Trip</div>
                            </Card>
                        </div>

                        {/* Detailed Systems Check */}
                        <Card variant="panel" className="p-0 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Service Status Log</h3>
                            </div>
                            <div className="divide-y divide-slate-800/50 p-4">
                                <CardRow label="Backend API (Golang)" value={opsData.backendStatus} mono={false} />
                                <CardRow label="Bitcoin Core Node (Mainnet)" value={opsData.bitcoinStatus} mono={false} />
                                <CardRow label="PostgreSQL Telemetry DB" value={opsData.dbState} mono={false} />
                                <CardRow label="Electrs Address Indexer" value={opsData.electrsState} mono={false} />
                                <CardRow label="Last Checked" value={new Date(opsData.lastChecked).toLocaleString()} mono={true} />
                            </div>
                        </Card>

                        <div className="text-center">
                            <p className="text-xs text-slate-500 font-mono">
                                System metrics are polled every 30s directly from live RawBlock health endpoints.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
