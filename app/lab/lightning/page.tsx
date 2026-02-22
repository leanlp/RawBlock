"use client";

import React, { useState } from 'react';
import { ShieldAlert, Cpu, Award, Layers } from 'lucide-react';
import Header from '../../../components/Header';
import PageHeader from '../../../components/PageHeader';
import LightningNodeConsole from '../../../components/labs/LightningNodeConsole';
import { useTranslation } from "@/lib/i18n";
import { useLearningPath } from '../../../stores/learningPathStore';
import { useRouter } from 'next/navigation';

interface Channel {
    id: string;
    alias: string;
    localBalance: number;
    remoteBalance: number;
    baseFee: number;
    feeRate: number;
    status: 'active' | 'offline' | 'depleted';
}
export default function LightningSimulatorPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { isLoaded, isModuleUnlocked } = useLearningPath();

    React.useEffect(() => {
        if (isLoaded && !isModuleUnlocked('lightning_routing')) {
            router.push('/academy/paths');
        }
    }, [isLoaded, isModuleUnlocked, router]);

    const [channels, setChannels] = useState<Channel[]>([
        { id: 'chan1', alias: 'ACINQ Hub', localBalance: 0.5, remoteBalance: 2.0, baseFee: 1000, feeRate: 50, status: 'active' },
        { id: 'chan2', alias: 'Kraken_LN', localBalance: 1.2, remoteBalance: 0.1, baseFee: 500, feeRate: 10, status: 'active' },
        { id: 'chan3', alias: 'WalletOfSatoshi', localBalance: 0.05, remoteBalance: 1.5, baseFee: 1000, feeRate: 100, status: 'depleted' }
    ]);

    const [earnedFees, setEarnedFees] = useState(0); // in sats
    const [routedTxs, setRoutedTxs] = useState(0);

    const handleConsoleAction = (action: string) => {
        if (action === 'rebalance') {
            // Simple mockup of a circular rebalance
            setChannels(prev => prev.map(c => {
                if (c.id === 'chan3') return { ...c, localBalance: 0.5, remoteBalance: 1.05, status: 'active' };
                if (c.id === 'chan2') return { ...c, localBalance: 0.75, remoteBalance: 0.55 };
                return c;
            }));
        } else if (action === 'start_routing') {
            // Simulate a successful route through our node
            setRoutedTxs(prev => prev + 1);
            setEarnedFees(prev => prev + 450); // Earned 450 sats

            // Deduct local outbound liquidity
            setChannels(prev => prev.map(c => {
                if (c.id === 'chan1') return { ...c, localBalance: Math.max(0, c.localBalance - 0.1), remoteBalance: c.remoteBalance + 0.1 };
                return c;
            }));
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 p-4 md:p-8 xl:p-12 font-sans text-slate-300">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Global Header */}
                <Header />

                {/* Page specific Header */}
                <PageHeader
                    title={t.lightningLab.title + " Simulator"}
                    subtitle="Manage liquidity, set routing fees, and balance channels to earn sats without getting your node depleted."
                    icon={<Cpu className="w-8 h-8 text-cyan-500" />}
                    gradient="from-cyan-500 to-emerald-500"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Node State & Channels */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
                                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-1 flex items-center gap-2">
                                    <Award size={14} className="text-amber-400" /> Fees Earned
                                </span>
                                <span className="text-2xl font-mono font-bold text-amber-400">{earnedFees.toLocaleString()} <span className="text-sm">sats</span></span>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
                                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-1">Routed Txs</span>
                                <span className="text-2xl font-mono font-bold text-slate-200">{routedTxs}</span>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
                                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-1">Node Score</span>
                                <span className="text-2xl font-mono font-bold text-emerald-400">92.4%</span>
                            </div>
                        </div>

                        {/* Channel Manager */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                <Layers className="text-cyan-500" />
                                Active Channels
                            </h3>

                            <div className="space-y-4">
                                {channels.map(channel => (
                                    <div key={channel.id} className={`p-4 rounded-lg border transition-all ${channel.status === 'depleted' ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${channel.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                                <span className="font-bold text-slate-200 text-sm">{channel.alias}</span>
                                            </div>
                                            <div className="text-xs font-mono text-slate-500">
                                                Fee: {channel.baseFee} / {channel.feeRate} ppm
                                            </div>
                                        </div>

                                        {/* Liquidity Bar */}
                                        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden flex items-center outline outline-1 outline-slate-700/50">
                                            <div className="h-full bg-cyan-500/80 transition-all duration-500" style={{ width: `${(channel.localBalance / (channel.localBalance + channel.remoteBalance)) * 100}%` }}></div>
                                            <div className="absolute inset-0 flex justify-center items-center text-[9px] font-mono font-bold text-white shadow-sm pointer-events-none mix-blend-difference">
                                                LOCAL: {channel.localBalance.toFixed(2)} BTC | REMOTE: {channel.remoteBalance.toFixed(2)} BTC
                                            </div>
                                        </div>

                                        {channel.status === 'depleted' && (
                                            <p className="text-xs text-red-400 mt-2 flex items-center gap-1 animate-pulse">
                                                <ShieldAlert size={12} /> Local outbound liquidity is completely depleted. Node cannot route payments to this peer!
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right: The Node Console */}
                    <div className="h-[600px] lg:h-auto">
                        <LightningNodeConsole onAction={handleConsoleAction} />
                    </div>
                </div>
            </div>
        </main>
    );
}
