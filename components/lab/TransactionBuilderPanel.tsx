"use client";

import React, { useState } from 'react';
import { PlusCircle, Search, Coins, AlertOctagon } from 'lucide-react';
import { UTXO, NetworkState, estimateVBytes } from '../../utils/scenarioEngine';

interface Props {
    state: NetworkState;
    onBroadcast: (inputs: UTXO[], outputs: { address: string, amount: number }[]) => void;
    error: string | null;
}

export default function TransactionBuilderPanel({ state, onBroadcast, error }: Props) {
    const [selectedInputs, setSelectedInputs] = useState<UTXO[]>([]);
    const [outputs, setOutputs] = useState<{ address: string, amount: number }[]>([
        { address: 'bc1q_recipient_xyz', amount: 5000 }
    ]);

    const toggleInput = (utxo: UTXO) => {
        if (selectedInputs.some(i => i.txid === utxo.txid && i.vout === utxo.vout)) {
            setSelectedInputs(selectedInputs.filter(i => !(i.txid === utxo.txid && i.vout === utxo.vout)));
        } else {
            setSelectedInputs([...selectedInputs, utxo]);
        }
    };

    const addOutput = () => {
        setOutputs([...outputs, { address: 'bc1q_new_output', amount: 0 }]);
    };

    const updateOutputAmount = (idx: number, amountStr: string) => {
        const val = parseInt(amountStr) || 0;
        const newOutputs = [...outputs];
        newOutputs[idx].amount = val;
        setOutputs(newOutputs);
    };

    // Calculate real-time stats
    const sumInputs = selectedInputs.reduce((acc, curr) => acc + curr.amount, 0);
    const sumOutputs = outputs.reduce((acc, curr) => acc + curr.amount, 0);
    const absoluteFee = sumInputs - sumOutputs;
    const estimatedSize = estimateVBytes(selectedInputs.length, outputs.length);
    const feeRate = (absoluteFee > 0 && estimatedSize > 0) ? (absoluteFee / estimatedSize) : 0;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 select-none font-mono text-sm max-w-xl">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <Search className="text-indigo-400" />
                UTXO Selection (Inputs)
            </h3>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {state.utxoSet.map((utxo) => {
                    const isSelected = selectedInputs.some(i => i.txid === utxo.txid && i.vout === utxo.vout);
                    return (
                        <div
                            key={`${utxo.txid}:${utxo.vout}`}
                            onClick={() => toggleInput(utxo)}
                            className={`p-3 rounded border cursor-pointer transition-colors flex justify-between items-center ${isSelected ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                        >
                            <div>
                                <span className="text-slate-300 font-bold block">{utxo.txid.substring(0, 8)}...:{utxo.vout}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded">{utxo.scriptPubKey}</span>
                            </div>
                            <span className="text-emerald-400 font-bold">{utxo.amount.toLocaleString()} sats</span>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-slate-800 pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Coins className="text-amber-400" />
                        Outputs & Fee Builder
                    </h3>
                    <button onClick={addOutput} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <PlusCircle size={14} /> Add Output
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    {outputs.map((out, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={out.address}
                                readOnly
                                className="bg-slate-950 border border-slate-700 rounded p-2 text-slate-400 text-xs w-full cursor-not-allowed"
                            />
                            <div className="relative w-32">
                                <input
                                    type="number"
                                    value={out.amount || ''}
                                    onChange={(e) => updateOutputAmount(idx, e.target.value)}
                                    placeholder="0"
                                    className="bg-slate-950 border border-slate-700 focus:border-indigo-500 outline-none rounded p-2 text-slate-200 text-xs w-full text-right pr-12"
                                />
                                <span className="absolute right-2 top-2 text-[10px] text-slate-500">sats</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live Math Visualizer */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6">
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500">Total Inputs:</span>
                        <span className="text-emerald-400 font-bold">{sumInputs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500">Total Outputs:</span>
                        <span className="text-amber-400 font-bold">-{sumOutputs.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-800 my-2"></div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-300 font-bold">Absolute Fee:</span>
                        <span className={`font-bold ${absoluteFee < 0 ? 'text-red-500' : 'text-slate-200'}`}>
                            {absoluteFee >= 0 ? '+' : ''}{absoluteFee.toLocaleString()} sats
                        </span>
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                        <span className="text-slate-500">Calculated Feerate ({estimatedSize} vB):</span>
                        <span className={`font-bold ${feeRate < state.minRelayFee ? 'text-red-400' : feeRate > 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                            {feeRate.toFixed(2)} sat/vB
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-950/40 border border-red-900/50 text-red-400 p-3 rounded text-xs flex items-start gap-2">
                        <AlertOctagon size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={() => onBroadcast(selectedInputs, outputs)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                    Sign & Broadcast Transaction
                </button>
            </div>
        </div>
    );
}
