"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import Card, { CardRow } from "../../components/Card";
import { LoadingState } from "../../components/EmptyState";
import { Activity, Server, Clock, ShieldCheck, Database } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function OpsPage() {
    const [loading, setLoading] = useState(true);
    const [opsData, setOpsData] = useState<any>(null);
    const { t } = useTranslation();

    useEffect(() => {
        // Simulating Ops Check / Health Endpoints
        setTimeout(() => {
            setOpsData({
                uptime: "99.99%",
                lastBlockSynced: 840000, // Mock synced block
                mempoolActive: true,
                latency: "45ms",
                dbState: "Healthy",
                lastChecked: new Date().toISOString()
            });
            setLoading(false);
        }, 800);
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

                {loading ? (
                    <LoadingState message={t.common.loading} />
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card variant="panel" className="p-5 bg-slate-900/50 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Uptime</h3>
                                    <Activity className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-3xl font-bold text-emerald-400">{opsData.uptime}</div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase">Trailing 30 Days</div>
                            </Card>

                            <Card variant="panel" className="p-5 bg-slate-900/50 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Index Height</h3>
                                    <Database className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="text-3xl font-bold text-cyan-400">#{opsData.lastBlockSynced.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase">Synced with Network</div>
                            </Card>

                            <Card variant="panel" className="p-5 bg-slate-900/50 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mempool Sync</h3>
                                    <Server className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className="text-3xl font-bold text-amber-400">{opsData.mempoolActive ? 'Active' : 'Degraded'}</div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase">Zero-MQ Stream</div>
                            </Card>

                            <Card variant="panel" className="p-5 bg-slate-900/50 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Latency</h3>
                                    <Clock className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="text-3xl font-bold text-purple-400">{opsData.latency}</div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase">Global Average</div>
                            </Card>
                        </div>

                        {/* Detailed Systems Check */}
                        <Card variant="panel" className="p-0 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Service Status Log</h3>
                            </div>
                            <div className="divide-y divide-slate-800/50 p-4">
                                <CardRow label="Backend API (Golang)" value="Operational" mono={false} />
                                <CardRow label="Bitcoin Core Node (Mainnet)" value="Operational" mono={false} />
                                <CardRow label="Block Index DB" value="Healthy" mono={false} />
                                <CardRow label="Mempool Socket Stream" value="Broadcasting" mono={false} />
                                <CardRow label="Last Checked" value={new Date(opsData.lastChecked).toLocaleString()} mono={true} />
                            </div>
                        </Card>

                        <div className="text-center">
                            <p className="text-xs text-slate-500 font-mono">
                                System metrics are refreshed continuously. All systems nominal.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
