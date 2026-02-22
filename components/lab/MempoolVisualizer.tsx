"use client";

import React from 'react';
import { PackageOpen, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NetworkState } from '../../utils/scenarioEngine';

interface Props {
    state: NetworkState;
    onMineBlock: () => void;
}

export default function MempoolVisualizer({ state, onMineBlock }: Props) {

    // Sort mempool by feeRate descending (highest fee first)
    const sortedMempool = [...state.mempool].sort((a, b) => b.feeRate - a.feeRate);

    const pendingTxs = sortedMempool.filter(t => t.status === 'pending');

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full select-none font-mono">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-xl">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <PackageOpen className="text-emerald-400" />
                    Local Mempool Queue
                </h3>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Pending: <span className="text-white">{pendingTxs.length}</span></span>
                    <span>Min Relay: <span className="text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 rounded">{state.minRelayFee.toFixed(1)} sat/vB</span></span>
                </div>
            </div>

            {/* Mempool Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                {sortedMempool.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Clock size={48} className="mb-4 opacity-50" />
                        <p>Mempool is empty.</p>
                        <p className="text-xs mt-2">Sign and Broadcast a transaction.</p>
                    </div>
                ) : (
                    sortedMempool.map(tx => (
                        <div
                            key={tx.id}
                            className={`p-4 rounded-lg border shadow-lg transition-all ${tx.status === 'pending' ? 'bg-slate-800/80 border-slate-600' :
                                tx.status === 'evicted' ? 'bg-red-950/20 border-red-900/50 opacity-60 grayscale' :
                                    'bg-emerald-950/20 border-emerald-900/50'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${tx.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                        tx.status === 'evicted' ? 'bg-red-500/20 text-red-500' :
                                            'bg-emerald-500/20 text-emerald-500'
                                        }`}>
                                        {tx.status}
                                    </span>
                                    <span className="text-slate-300 font-bold">{tx.txid}</span>
                                </div>
                                <span className={`font-bold text-lg ${tx.status === 'evicted' ? 'text-red-400' : 'text-indigo-400'}`}>
                                    {tx.feeRate.toFixed(1)} <span className="text-xs text-slate-500">sat/vB</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                                <div>
                                    <span className="text-slate-500 block">Inputs</span>
                                    <span className="text-slate-300">{tx.inputs.length}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Outputs</span>
                                    <span className="text-slate-300">{tx.outputs.length}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Absolute Fee</span>
                                    <span className="text-slate-300">{tx.fee.toLocaleString()} sats</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Size</span>
                                    <span className="text-slate-300">{tx.vbytes} vB</span>
                                </div>
                            </div>

                            {tx.isRBF && tx.status === 'pending' && (
                                <div className="mt-3 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900 px-2 py-1 rounded inline-block">
                                    BIP125 Replace-By-Fee Success
                                </div>
                            )}

                            {tx.status === 'evicted' && (
                                <div className="mt-3 text-xs text-red-400 flex items-center gap-1">
                                    <AlertTriangle size={14} />
                                    {tx.rejectionReason || "Evicted"}
                                </div>
                            )}

                            {tx.status === 'mined' && (
                                <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={14} />
                                    Included in Block
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Mining Action */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 rounded-b-xl flex justify-between items-center">
                <span className="text-xs text-slate-500 w-1/2 leading-relaxed">
                    Miners prioritize transactions strictly by feerate (sat/vB) to maximize their block reward.
                </span>
                <button
                    onClick={onMineBlock}
                    disabled={pendingTxs.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
                >
                    Mine Block (Clear Mempool)
                </button>
            </div>
        </div>
    );
}
