"use client";

import React, { useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import { Microscope, RefreshCw } from 'lucide-react';
import {
    NetworkState,
    createInitialNetworkState,
    broadcastTransaction,
    UTXO
} from '../../../utils/scenarioEngine';
import TransactionBuilderPanel from '../../../components/lab/TransactionBuilderPanel';
import MempoolVisualizer from '../../../components/lab/MempoolVisualizer';
import { useLearningPath } from '../../../stores/learningPathStore';
import { useRouter } from 'next/navigation';

export default function ScenarioLabsPage() {
    const router = useRouter();
    const { completeModule, isLoaded, isModuleUnlocked } = useLearningPath();

    // Prerequisite Check
    React.useEffect(() => {
        if (isLoaded && !isModuleUnlocked('mempool_rbf')) {
            router.push('/academy/paths');
        }
    }, [isLoaded, isModuleUnlocked, router]);
    const [networkState, setNetworkState] = useState<NetworkState>(createInitialNetworkState());
    const [lastError, setLastError] = useState<string | null>(null);

    // Watch for Win Condition (successful RBF Eviction)
    React.useEffect(() => {
        if (networkState.mempool.some(tx => tx.status === 'evicted')) {
            completeModule('mempool_rbf');
        }
    }, [networkState.mempool, completeModule]);

    const handleBroadcast = (inputs: UTXO[], outputs: { address: string, amount: number }[]) => {
        setLastError(null);

        const { newState, success, error } = broadcastTransaction(networkState, inputs, outputs);

        if (!success && error) {
            setLastError(error);
        } else {
            setNetworkState(newState);
        }
    };

    const handleMineBlock = () => {
        // Simple simulation: All 'pending' txs become 'mined', utxos are marked spent.

        const nextUtxos = [...networkState.utxoSet];
        const nextMempool = networkState.mempool.map(tx => {
            if (tx.status === 'pending') {

                // Mark inputs as spent
                for (const inn of tx.inputs) {
                    const idx = nextUtxos.findIndex(u => u.txid === inn.utxoTxid && u.vout === inn.vout);
                    if (idx !== -1) nextUtxos[idx].isSpent = true;
                }

                // Add new outputs to UTXO set
                for (let i = 0; i < tx.outputs.length; i++) {
                    nextUtxos.push({
                        txid: tx.txid,
                        vout: i,
                        amount: tx.outputs[i].amount,
                        scriptPubKey: 'P2WPKH', // default for mock
                        isSpent: false
                    });
                }

                return { ...tx, status: 'mined' as const };
            }
            return tx;
        });

        const activeUtxos = nextUtxos.filter(u => !u.isSpent);

        setNetworkState({
            ...networkState,
            utxoSet: activeUtxos,
            mempool: nextMempool
        });
    };

    const resetLab = () => {
        setNetworkState(createInitialNetworkState());
        setLastError(null);
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <PageHeader
                title="Transaction Scenario Labs"
                subtitle="Diagnose failed transactions, optimize fees, and wage Replace-By-Fee (RBF) double-spend wars against the local mempool rules engine."
                icon={<Microscope className="text-emerald-400" size={32} />}
            />

            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-sm rounded cursor-pointer">
                        Mempool & RBF Sandbox
                    </div>
                </div>
                <button
                    onClick={resetLab}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors uppercase font-bold tracking-wider flex items-center gap-1"
                >
                    <RefreshCw size={14} /> Reset Lab
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Left Column: Transaction Builder */}
                <div className="space-y-6">
                    <TransactionBuilderPanel
                        state={networkState}
                        onBroadcast={handleBroadcast}
                        error={lastError}
                    />

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-300 leading-relaxed">
                        <h4 className="text-white font-bold mb-2">Scenario: RBF Double-Spend Race</h4>
                        <ol className="list-decimal pl-4 space-y-2 marker:text-emerald-400">
                            <li>Select a 50,000 sat UTXO.</li>
                            <li>Send 45,000 sats to `bc1q_car_dealership`. (Fee: 5,000)</li>
                            <li>Broadcast it. Watch it enqueue in the Mempool as &apos;pending&apos;.</li>
                            <li><strong>Oh no! It&apos;s a scam!</strong> Before the block mines, you must RBF it.</li>
                            <li>Keep the SAME input selected. Change output to `bc1q_my_safe_wallet`.</li>
                            <li>Drop the output amount to 40,000 sats (increasing the Fee to 10,000).</li>
                            <li>Broadcast. If the fee is high enough, the node will <strong>Evict</strong> the first transaction and replace it with your new one.</li>
                        </ol>
                    </div>
                </div>

                {/* Right Column: Mempool Visualizer */}
                <div className="h-[800px]">
                    <MempoolVisualizer
                        state={networkState}
                        onMineBlock={handleMineBlock}
                    />
                </div>

            </div>
        </div>
    );
}
