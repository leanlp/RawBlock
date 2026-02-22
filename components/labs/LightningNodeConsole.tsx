"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Zap, Network, RefreshCw } from 'lucide-react';

interface LogEntry {
    id: string;
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
}

export default function LightningNodeConsole({ onAction }: { onAction: (action: string) => void }) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        setLogs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            type,
            message
        }]);
    };

    useEffect(() => {
        // Initial boot sequence
        setTimeout(() => addLog('LND Node v0.17.0-beta starting...', 'info'), 100);
        setTimeout(() => addLog('Synchronizing channel graph...', 'info'), 800);
        setTimeout(() => addLog('Loaded 14023 channels from database', 'success'), 1600);
        setTimeout(() => addLog('Awaiting routing requests via gossip protocol', 'info'), 2200);
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c] rounded-xl border border-slate-700/50 overflow-hidden font-mono text-sm relative shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-2 flex items-center justify-between z-10">
                <div className="flex items-center gap-2 px-2 text-slate-400">
                    <Terminal size={14} />
                    <span className="text-[10px] tracking-widest uppercase font-bold">Node Operator Console</span>
                </div>
                <div className="flex gap-1.5 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                </div>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-4">
                        <span className="text-slate-600 shrink-0 select-none">
                            {log.timestamp.toISOString().split('T')[1].substring(0, 11)}
                        </span>
                        <span className={`
                            ${log.type === 'error' ? 'text-red-400 font-bold' :
                                log.type === 'success' ? 'text-emerald-400' :
                                    log.type === 'warning' ? 'text-amber-400' :
                                        'text-cyan-100'}
                        `}>
                            {log.type === 'error' && '[ERR] '}
                            {log.type === 'warning' && '[WARN] '}
                            {log.message}
                        </span>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>

            {/* Terminal Input / Action Bar */}
            <div className="bg-slate-900/50 border-t border-slate-800 p-3 flex gap-2">
                <button
                    onClick={() => {
                        addLog('Executing forced rebalance (circular route)...', 'info');
                        onAction('rebalance');
                        setTimeout(() => addLog('Rebalance failed: no path found with sufficient capacity', 'error'), 1200);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors rounded py-1.5 text-xs flex items-center justify-center gap-2 border border-slate-700/50"
                >
                    <RefreshCw size={14} /> Rebalance
                </button>
                <button
                    onClick={() => {
                        onAction('open_channel');
                        addLog('Simulating incoming channel request...', 'info');
                    }}
                    className="flex-1 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 transition-colors rounded py-1.5 text-xs flex items-center justify-center gap-2 border border-indigo-500/30"
                >
                    <Network size={14} /> Open Channel
                </button>
                <button
                    onClick={() => {
                        onAction('start_routing');
                        addLog('Polling gossip network for HTLC routing requests...', 'info');
                    }}
                    className="flex-1 bg-pink-950/30 hover:bg-pink-900/40 text-pink-400 font-bold transition-colors rounded py-1.5 text-xs flex items-center justify-center gap-2 border border-pink-500/30 shadow-[0_0_10px_rgba(244,114,182,0.1)]"
                >
                    <Zap size={14} /> Accept Routes
                </button>
            </div>

            <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)' }}></div>
        </div>
    );
}
