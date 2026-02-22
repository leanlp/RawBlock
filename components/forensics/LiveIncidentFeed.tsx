import React from 'react';
import { ShieldAlert, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface IncidentEvent {
    id: string;
    timestamp: string; // ISO string 
    description: string;
    txid?: string;
    status: 'detected' | 'investigating' | 'resolved';
}

interface LiveIncidentFeedProps {
    events: IncidentEvent[];
    incidentName: string;
    onEventClick?: (txid: string) => void;
}

export default function LiveIncidentFeed({ events, incidentName, onEventClick }: LiveIncidentFeedProps) {
    if (!events || events.length === 0) {
        return (
            <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl text-center text-slate-500 text-sm">
                No active events in feed for {incidentName}.
            </div>
        );
    }

    return (
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full backdrop-blur-md">
            <div className="p-3 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    Live "War Room" Feed
                </h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Live</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                {/* Timeline Line */}
                <div className="absolute left-[27px] top-6 bottom-4 w-px bg-slate-800 pointer-events-none"></div>

                {events.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4 animate-in slide-in-from-right-4 fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>

                        {/* Status Icon */}
                        <div className="relative z-10 flex-shrink-0 mt-1">
                            {event.status === 'detected' && (
                                <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                    <ShieldAlert size={12} />
                                </div>
                            )}
                            {event.status === 'investigating' && (
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
                                    <Clock size={12} />
                                </div>
                            )}
                            {event.status === 'resolved' && (
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                                    <CheckCircle2 size={12} />
                                </div>
                            )}
                        </div>

                        {/* Content Card */}
                        <div className={`
                            flex-1 p-3 rounded-lg border text-sm transition-all
                            ${event.status === 'detected' ? 'bg-red-950/20 border-red-900/50 hover:bg-red-950/40' :
                                event.status === 'investigating' ? 'bg-amber-950/20 border-amber-900/50 hover:bg-amber-950/40' :
                                    'bg-emerald-950/20 border-emerald-900/50 hover:bg-emerald-950/40'}
                        `}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] uppercase font-bold tracking-wider 
                                    ${event.status === 'detected' ? 'text-red-400' :
                                        event.status === 'investigating' ? 'text-amber-400' : 'text-emerald-400'}
                                `}>
                                    {event.status}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-xs">
                                {event.description}
                            </p>

                            {event.txid && (
                                <button
                                    onClick={() => onEventClick && onEventClick(event.txid!)}
                                    className="mt-3 flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-cyan-900/30 text-cyan-400 border border-slate-700/50 hover:border-cyan-500/50 px-2 py-1 rounded transition-colors group w-full"
                                >
                                    <span className="font-mono truncate">{event.txid}</span>
                                    <ArrowRight size={10} className="ml-auto group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
