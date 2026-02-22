"use client";

import React from 'react';
import { Activity, Network, TrendingUp, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import BridgeHealthMonitor from '../../../components/bridges/BridgeHealthMonitor';
import { BRIDGE_DATA, DEX_VOLUME_DATA } from '../../../utils/bridgeData';

export default function BridgesAnalyticsPage() {
    return (
        <main className="min-h-screen bg-slate-950 p-4 md:p-8 xl:p-12 font-sans text-slate-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
                    <PageHeader
                        title="DEX & Bridge Forensics Benchmark"
                        subtitle="Monitoring cross-chain peg anomalies and P2P orderbook liquidity."
                        icon={<Network className="w-8 h-8 text-indigo-400" />}
                        gradient="from-indigo-400 to-purple-500"
                    />
                    <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 rounded-lg p-2 px-4 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                        <Activity size={16} className="text-emerald-400 animate-pulse" />
                        <span className="text-sm font-bold text-white tracking-widest uppercase">System Operational</span>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Left Column: Bridge Health Monitors (Takes up 2/3 width on large screens) */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="text-indigo-400" size={20} />
                                L2 / Sidechain Bridge Health
                            </h2>
                            <span className="text-xs text-slate-500 font-mono">Last 30 Days</span>
                        </div>

                        {Object.entries(BRIDGE_DATA).map(([bridgeName, data]) => (
                            <BridgeHealthMonitor key={bridgeName} bridgeName={bridgeName} data={data} />
                        ))}
                    </div>

                    {/* Right Column: P2P Liquidity Radar */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="text-purple-400" size={20} />
                            P2P Liquidity Radar (24h)
                        </h2>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-slate-800/50 bg-slate-800/20">
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Aggregated global volume across non-KYC decentralized exchanges. Sudden drops in liquidity often precede regulatory actions.
                                </p>
                            </div>

                            <div className="divide-y divide-slate-800">
                                {DEX_VOLUME_DATA.map((dex) => (
                                    <div key={dex.name} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between group">
                                        <div>
                                            <h4 className="text-white font-bold group-hover:text-purple-400 transition-colors">
                                                {dex.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                                                <span className="text-slate-500">Offers: <span className="text-slate-300">{dex.activeOffers}</span></span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-lg font-mono text-white">
                                                {dex.volume24h} <span className="text-[10px] text-slate-500 uppercase">BTC</span>
                                            </div>
                                            <div className={`text-xs font-bold font-mono ${dex.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {dex.change24h > 0 ? '+' : ''}{dex.change24h}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link href="/analysis/forensics" className="block w-full p-4 text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/10 transition-colors uppercase tracking-widest border-t border-slate-800 flex items-center justify-center gap-2 group">
                                Deep Dive Entity Trades <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                </div>

            </div>
        </main>
    );
}
