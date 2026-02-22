"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Crosshair, AlertTriangle, Clock, Ban, Network } from 'lucide-react';
import PageHeader from '../../../../components/PageHeader';

// Mocked real-time threat data
type ThreatType = 'griefing' | 'jamming' | 'probing' | 'zombie';

interface ThreatEvent {
    id: string;
    timestamp: Date;
    nodePubKey: string;
    alias: string;
    type: ThreatType;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    details: {
        totalChannels?: number;
        failedRoutes?: number;
        htlcHoldTimeMs?: number;
        offlineDuration?: string;
    };
    status: 'active' | 'mitigated' | 'investigating';
}

const initialThreats: ThreatEvent[] = [
    {
        id: 't-101',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
        nodePubKey: '02816913501a3501a3501a...attack_vector_1',
        alias: 'Unknown Route Spammer',
        type: 'jamming',
        severity: 'critical',
        description: 'Micro-payment spam flooding across 50+ channels. 99.4% route failure rate.',
        details: { totalChannels: 52, failedRoutes: 14502 },
        status: 'active'
    },
    {
        id: 't-102',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
        nodePubKey: '03d4v94k4v...griefer_node',
        alias: 'LN_Ninja_Hub',
        type: 'griefing',
        severity: 'high',
        description: 'Intentional HTLC holding. Maliciously delaying settlement to lock network liquidity.',
        details: { htlcHoldTimeMs: 45000 }, // 45 seconds (very anomalous for lightning)
        status: 'investigating'
    },
    {
        id: 't-103',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        nodePubKey: '03c...probe_bot',
        alias: 'ProbeBot_Alpha',
        type: 'probing',
        severity: 'medium',
        description: 'Systematic channel capacity probing detected. Attempting to map hidden network liquidity.',
        details: { failedRoutes: 840 },
        status: 'active'
    }
];

export default function ThreatIntelligencePage() {
    const [threats, setThreats] = useState<ThreatEvent[]>(initialThreats);
    const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(initialThreats[0]);
    const [isScanning] = useState(true);

    // Simulate real-time monitoring
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.8) {
                const newThreat: ThreatEvent = {
                    id: `t-${Math.floor(Math.random() * 10000)}`,
                    timestamp: new Date(),
                    nodePubKey: `0x${Math.random().toString(16).substring(2, 10)}...anomalous_peer`,
                    alias: `Unidentified_Peer_${Math.floor(Math.random() * 1000)}`,
                    type: ['probing', 'zombie', 'griefing', 'jamming'][Math.floor(Math.random() * 4)] as ThreatType,
                    severity: Math.random() > 0.5 ? 'medium' : 'high',
                    description: 'Automated heuristics engine flagged anomalous routing behavior.',
                    details: { failedRoutes: Math.floor(Math.random() * 500) },
                    status: 'active'
                };
                setThreats(prev => [newThreat, ...prev].slice(0, 10)); // Keep last 10
            }
        }, 8000); // Check every 8 seconds

        return () => clearInterval(interval);
    }, []);

    const getTypeIcon = (type: ThreatType) => {
        switch (type) {
            case 'jamming': return <Activity className="text-red-500" />;
            case 'griefing': return <Clock className="text-amber-500" />;
            case 'probing': return <Crosshair className="text-cyan-500" />;
            case 'zombie': return <Ban className="text-slate-500" />;
        }
    };

    const getTypeLabel = (type: ThreatType) => {
        switch (type) {
            case 'jamming': return 'Channel Jamming';
            case 'griefing': return 'HTLC Griefing';
            case 'probing': return 'Liquidity Probing';
            case 'zombie': return 'Zombie Node Trap';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'high': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
            case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 p-4 md:p-8 xl:p-12 font-sans text-slate-300">
            <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">

                {/* Header */}
                <PageHeader
                    title="L2 Threat Intelligence"
                    subtitle="Real-time heuristic monitoring for malicious Lightning Network routing behaviors."
                    icon={<ShieldAlert className="w-8 h-8 text-red-500" />}
                    gradient="from-red-500 to-amber-500"
                />

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

                    {/* Left: Live Threat Feed */}
                    <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col h-[700px]">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <Activity size={18} className="text-red-500" />
                                Live Threat Feed
                            </h2>
                            {isScanning && (
                                <span className="flex items-center gap-2 text-xs text-red-400 font-mono animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Monitoring Gossip
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                            {threats.map((threat) => (
                                <div
                                    key={threat.id}
                                    onClick={() => setSelectedThreat(threat)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedThreat?.id === threat.id ? 'bg-slate-800 border-slate-600 shadow-md' : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(threat.type)}
                                            <span className="font-bold text-slate-200 text-sm">{getTypeLabel(threat.type)}</span>
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getSeverityColor(threat.severity)}`}>
                                            {threat.severity}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono mb-2 truncate">
                                        {threat.alias}
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                        <span>{threat.timestamp.toLocaleTimeString()}</span>
                                        <span className={`capitalize ${threat.status === 'active' ? 'text-red-400' : 'text-amber-400'}`}>
                                            {threat.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Threat Analysis Pane */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden flex flex-col">
                        {/* Background Cyber Graphic */}
                        <div className="absolute -top-32 -right-32 text-slate-800/20 opacity-10 pointer-events-none">
                            <Network size={400} />
                        </div>

                        {selectedThreat ? (
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="border-b border-slate-800 pb-6 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                            {getTypeIcon(selectedThreat.type)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{getTypeLabel(selectedThreat.type)}</h2>
                                            <p className="text-sm font-mono text-slate-400">{selectedThreat.id} • Detected at {selectedThreat.timestamp.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <p className="text-slate-300 leading-relaxed text-sm">
                                        {selectedThreat.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-2">Adversary Entity</span>
                                        <div className="font-mono text-sm text-cyan-400 break-all">{selectedThreat.nodePubKey}</div>
                                        <div className="text-sm text-slate-300 mt-1">Alias: {selectedThreat.alias}</div>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-2">Heuristic Metrics</span>
                                        <ul className="space-y-2 text-sm text-slate-300 font-mono">
                                            {selectedThreat.details.failedRoutes && (
                                                <li className="flex justify-between"><span>Failed Routes:</span> <span className="text-red-400">{selectedThreat.details.failedRoutes.toLocaleString()}</span></li>
                                            )}
                                            {selectedThreat.details.htlcHoldTimeMs && (
                                                <li className="flex justify-between"><span>Avg HTLC Hold:</span> <span className="text-amber-400">{selectedThreat.details.htlcHoldTimeMs} ms</span></li>
                                            )}
                                            {selectedThreat.details.totalChannels && (
                                                <li className="flex justify-between"><span>Known Channels:</span> <span>{selectedThreat.details.totalChannels}</span></li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-auto bg-red-950/20 border border-red-900/50 rounded-lg p-4 flex gap-4 items-start">
                                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-red-400 font-bold mb-1">Recommended Action</h4>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            {selectedThreat.type === 'jamming' ? "Blacklist incoming HTLC routing requests from this node. Implement dynamic base fees to deter further spam." :
                                                selectedThreat.type === 'griefing' ? "Lower the maximum channel size available for routing to this peer. Force closure of the channel if hold delays exceed 60 seconds." :
                                                    "Monitor outbound liquidity to ensure this peer is not systematically draining specific routes for surveillance purposes."}
                                        </p>
                                        <div className="mt-4 flex gap-3">
                                            <button className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded transition-colors shadow-lg shadow-red-500/20">
                                                Ban Node (Network Blacklist)
                                            </button>
                                            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold px-4 py-2 rounded transition-colors">
                                                Isolate Channel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                <Crosshair size={48} className="opacity-50" />
                                <p>Select an adversary event from the live feed to analyze.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}
