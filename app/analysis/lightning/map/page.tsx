"use client";

import React from 'react';
import { Activity, TrendingUp, Layers } from 'lucide-react';
import PageHeader from '../../../../components/PageHeader';
import ChannelGraph from '../../../../components/lightning/ChannelGraph';

export default function LightningCartographyPage() {
    return (
        <main className="h-screen w-full bg-slate-950 flex flex-col relative overflow-hidden font-sans text-slate-300">
            {/* Header Section */}
            <div className="bg-slate-950 px-4 md:px-8 pt-4 z-40 shadow-sm border-b border-slate-900 shrink-0">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4">
                    <PageHeader
                        title="L2 Liquidity Mapping"
                        subtitle="Visualizing Lightning Network centrality, channel capacities, and routing fees."
                        icon={<Layers className="w-8 h-8 text-pink-500" />}
                        gradient="from-pink-500 to-indigo-500"
                    />

                    {/* Quick Stats Panel */}
                    <div className="flex bg-slate-900/50 border border-slate-800 rounded-lg p-2 gap-4">
                        <div className="flex flex-col px-3">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Known Capacity</span>
                            <span className="font-mono text-pink-400 font-bold">5,412.3 BTC</span>
                        </div>
                        <div className="w-px bg-slate-800"></div>
                        <div className="flex flex-col px-3">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Channels</span>
                            <span className="font-mono text-slate-300 font-bold">62,840</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Interactive Map Area */}
            <div className="flex-1 relative w-full h-full bg-slate-950">

                {/* Information Overlay */}
                <div className="absolute top-6 left-6 z-50 pointer-events-none max-w-sm">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-2xl pointer-events-auto">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-2">
                            <Activity size={16} className="text-pink-400" />
                            Network Intel
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            You are viewing a subset of major routing hubs. The thickness of the edge represents total channel capacity. Edges highlighted in <span className="text-red-400 font-bold">red</span> represent anomalous routing fees compared to the global average.
                        </p>

                        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Highest Capacity Hub</span>
                                <span className="font-mono text-indigo-400 font-bold">ACINQ</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Avg Fee Rate</span>
                                <span className="font-mono text-slate-300">120 ppm</span>
                            </div>
                        </div>

                        <button className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700/50">
                            <TrendingUp size={14} /> View All Routing Nodes
                        </button>
                    </div>
                </div>

                {/* React Flow Component Container */}
                <ChannelGraph />

            </div>
        </main>
    );
}
