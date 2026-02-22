"use client";

import React, { useState } from 'react';
import { ShieldAlert, Activity, GitCommit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import { INCIDENT_STUDIES } from '../../../utils/incidents';
import LiveIncidentFeed from '../../../components/forensics/LiveIncidentFeed';
import ForensicsPage from '../forensics/page'; // We will conditionally render the graph

export default function IncidentWarRoomPage() {
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

    const activeIncident = selectedIncidentId ? INCIDENT_STUDIES[selectedIncidentId] : null;

    if (activeIncident) {
        return (
            <main className="h-screen w-full bg-slate-950 flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="bg-slate-950 px-4 md:px-8 pt-4 z-50 shadow-sm flex items-center gap-4">
                    <button
                        onClick={() => setSelectedIncidentId(null)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors mb-2"
                        title="Back to Incidents Directory"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <PageHeader
                            title={`War Room: ${activeIncident.name}`}
                            subtitle={activeIncident.description}
                            icon={<ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />}
                            gradient="from-red-500 to-orange-500"
                        />
                    </div>
                </div>

                {/* Main Content Area (Graph + Feed) */}
                <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative mt-0 border-t border-slate-900">
                    {/* Left: Live Graph (Reusing Forensics Page logic but we'd ideal pass a prop to auto-load. For now, we render it alongside) */}
                    <div className="flex-1 h-full relative border-r border-slate-800">
                        {/* 
                            In a full production build, we'd refactor ForensicsPage to accept an `initialSearchQuery` 
                            or `incidentId` prop to tightly couple them. 
                            For this architectural demo, we render the graph component and user can search the rootNodeId.
                        */}
                        <div className="absolute top-4 left-4 z-50 bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-2xl max-w-sm pointer-events-auto">
                            <h4 className="text-white text-sm font-bold flex items-center gap-2 mb-1">
                                <Activity size={14} className="text-cyan-400" />
                                Investigation Root
                            </h4>
                            <p className="text-xs text-slate-400 mb-2">To begin tracking this incident, search for the root attacker address in the graph:</p>
                            <code className="text-[10px] bg-slate-950 p-1.5 rounded text-red-400 font-mono block select-all border border-red-900/30">
                                {activeIncident.rootNodeId}
                            </code>
                        </div>

                        <div className="w-full h-full relative child-header-hidden">
                            {/* We use CSS to hide the nested PageHeader inside ForensicsPage to keep it clean */}
                            <style jsx global>{`
                                .child-header-hidden > main > div:first-child { display: none !important; }
                             `}</style>
                            <ForensicsPage />
                        </div>
                    </div>

                    {/* Right: The Live Feed */}
                    <div className="w-full md:w-96 h-full bg-slate-950 p-4 shrink-0 z-40">
                        <LiveIncidentFeed
                            incidentName={activeIncident.name}
                            events={activeIncident.events}
                            onEventClick={(txid) => {
                                // In a fully integrated version, clicking this would trigger a graph update in the left panel
                                console.log(`Trigger graph search for ${txid}`);
                            }}
                        />
                    </div>
                </div>
            </main>
        );
    }

    // Directory View 
    return (
        <main className="min-h-screen bg-slate-950 p-4 md:p-8 xl:p-12 font-sans text-slate-300">
            <div className="max-w-6xl mx-auto space-y-8">
                <PageHeader
                    title="Incident Response War Room"
                    subtitle="Real-time tracking of massive network liquidations, exchange hacks, and critical protocol exploits."
                    icon={<ShieldAlert className="w-8 h-8 text-red-400" />}
                    gradient="from-red-400 to-orange-500"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(INCIDENT_STUDIES).map((incident) => (
                        <div
                            key={incident.id}
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-red-500/50 transition-all cursor-pointer group hover:bg-slate-900 shadow-xl"
                            onClick={() => setSelectedIncidentId(incident.id)}
                        >
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ShieldAlert className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                                {incident.name}
                            </h3>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                {incident.description}
                            </p>

                            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-800/50 pt-4 mt-auto">
                                <span className="flex items-center gap-1 font-mono">
                                    <GitCommit size={12} />
                                    {incident.events.length} Events Logged
                                </span>
                                <span className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider 
                                    ${incident.events[incident.events.length - 1].status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}
                                `}>
                                    {incident.events[incident.events.length - 1].status}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Placeholder for "Create New Event" */}
                    <div className="bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-900/40 transition-colors cursor-pointer opacity-50">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                            <span className="text-2xl text-slate-500">+</span>
                        </div>
                        <h3 className="text-white font-bold mb-1">Open Manual Investigation</h3>
                        <p className="text-xs text-slate-500">Track a custom UTXO set</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
