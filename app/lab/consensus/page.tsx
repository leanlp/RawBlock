"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "../../../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import {
    validateBlock,
    getStageInfo,
    getBlockSubsidy,
    calculateDifficulty,
    type BlockData,
    type ValidationStep
} from "../../../utils/consensus-rules";

// Demo block data for when API is unavailable
const DEMO_BLOCK: BlockData = {
    header: {
        version: 536870912,
        previousblockhash: "0000000000000000000234567890abcdef1234567890abcdef1234567890abcd",
        merkleroot: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        time: Math.floor(Date.now() / 1000) - 600,
        bits: "17034219",
        nonce: 2083236893,
        hash: "0000000000000000000156789abcdef0123456789abcdef0123456789abcdef0",
        height: 934250
    },
    transactions: [
        {
            txid: "coinbase123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            hash: "coinbase123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            size: 250,
            vsize: 170,
            weight: 680,
            vin: [{ coinbase: "03fa4d0e2f466f756e6472792f", sequence: 4294967295 }],
            vout: [{ value: 3.125, n: 0, scriptPubKey: { hex: "76a914...", type: "pubkeyhash" } }]
        },
        {
            txid: "tx2_abcdef123456789abcdef0123456789abcdef0123456789abcdef012345678",
            hash: "tx2_abcdef123456789abcdef0123456789abcdef0123456789abcdef012345678",
            size: 225,
            vsize: 141,
            weight: 564,
            vin: [{ txid: "prev_tx", vout: 0, sequence: 4294967293 }],
            vout: [{ value: 0.5, n: 0, scriptPubKey: { hex: "0014...", type: "witness_v0_keyhash" } }]
        }
    ],
    txCount: 2500,
    size: 1234567,
    weight: 3998765,
    strippedsize: 999876
};

export default function ConsensusDebuggerPage() {
    const [blockInput, setBlockInput] = useState("");
    const [block, setBlock] = useState<BlockData | null>(null);
    const [steps, setSteps] = useState<ValidationStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [useDemo, setUseDemo] = useState(false);

    // Load block data
    const loadBlock = useCallback(async (query?: string) => {
        setLoading(true);
        setError(null);
        setBlock(null);
        setSteps([]);  // Use setSteps here instead of setValidationSteps to match state
        setUseDemo(false);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.41:4000';

            // Helper for RPC calls to bypass limited API
            const rpcCall = async (method: string, params: any[] = []) => {
                const res = await fetch(`${baseUrl}/api/rpc-playground`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ method, params })
                });
                if (!res.ok) throw new Error(`RPC ${method} failed`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                return data.result;
            };

            let blockHash = '';

            // 1. Determine Block Hash
            if (query) {
                if (/^[0-9]+$/.test(query)) {
                    // It's a height, get hash
                    blockHash = await rpcCall('getblockhash', [parseInt(query)]);
                } else {
                    // It's already a hash
                    blockHash = query;
                }
            } else {
                // Fetch latest block hash
                blockHash = await rpcCall('getbestblockhash');
            }

            // 2. Fetch Full Block (Verbosity 2 for TX details)
            const blockData = await rpcCall('getblock', [blockHash, 2]);

            // 3. Map raw RPC data to Consensus Rules BlockData format
            const mappedBlock: BlockData = {
                header: {
                    version: blockData.version,
                    previousblockhash: blockData.previousblockhash || '',
                    merkleroot: blockData.merkleroot,
                    time: blockData.time,
                    bits: blockData.bits,
                    nonce: blockData.nonce,
                    hash: blockData.hash,
                    height: blockData.height
                },
                transactions: blockData.tx.map((tx: any) => ({
                    txid: tx.txid,
                    hash: tx.hash,
                    size: tx.size,
                    vsize: tx.vsize,
                    weight: tx.weight,
                    vin: tx.vin.map((v: any) => ({
                        txid: v.txid,
                        vout: v.vout,
                        coinbase: v.coinbase,
                        sequence: v.sequence,
                        scriptSig: v.scriptSig
                    })),
                    vout: tx.vout.map((v: any) => ({
                        value: v.value,
                        n: v.n,
                        scriptPubKey: v.scriptPubKey
                    }))
                })),
                txCount: blockData.nTx,
                size: blockData.size,
                weight: blockData.weight,
                strippedsize: blockData.strippedsize
            };

            setBlock(mappedBlock);

            // Run Validation Rules
            const validationSteps = validateBlock(mappedBlock);
            setSteps(validationSteps);
            setCurrentStepIndex(0);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to load block data');
            setUseDemo(true);
            setBlock(DEMO_BLOCK);
            setSteps(validateBlock(DEMO_BLOCK));
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-play through steps
    useEffect(() => {
        if (!isAutoPlaying || currentStepIndex >= steps.length - 1) {
            setIsAutoPlaying(false);
            return;
        }

        const timer = setTimeout(() => {
            setCurrentStepIndex(prev => prev + 1);
        }, 1500);

        return () => clearTimeout(timer);
    }, [isAutoPlaying, currentStepIndex, steps.length]);

    const currentStep = steps[currentStepIndex];
    const stageInfo = currentStep ? getStageInfo(currentStep.stage) : null;

    // Group steps by stage for progress bar
    const stageProgress = [1, 2, 3, 4, 5].map(stage => {
        const stageSteps = steps.filter(s => s.stage === stage);
        const completedSteps = stageSteps.filter((_, idx) => {
            const globalIdx = steps.findIndex(s => s.id === stageSteps[idx].id);
            return globalIdx <= currentStepIndex;
        });
        return {
            stage,
            info: getStageInfo(stage),
            total: stageSteps.length,
            completed: completedSteps.length,
            allPass: completedSteps.every(s => s.status === 'pass' || s.status === 'info')
        };
    });

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                <Header />

                {/* Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            ⚙️ Consensus Rules Debugger
                        </h1>
                        <p className="mt-1 text-slate-400 text-sm">
                            Step through block validation like a Bitcoin Core developer
                        </p>
                    </div>
                    {useDemo && (
                        <div className="mt-2 md:mt-0 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded">
                            ⚠️ Using demo block
                        </div>
                    )}
                </div>

                {/* Block Input */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={blockInput}
                            onChange={(e) => setBlockInput(e.target.value)}
                            placeholder="Enter block height or hash..."
                            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                        <button
                            onClick={() => loadBlock(blockInput)}
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Load Block'}
                        </button>
                        <button
                            onClick={() => loadBlock()}
                            disabled={loading}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                            Latest
                        </button>
                    </div>
                    {error && !useDemo && (
                        <p className="mt-2 text-xs text-rose-400">{error}</p>
                    )}
                </div>

                {block && steps.length > 0 && (
                    <>
                        {/* Block Info Banner */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase">Height</div>
                                    <div className="text-lg font-bold text-cyan-400">{block.header.height.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase">Hash</div>
                                    <div className="text-sm font-mono text-slate-300 truncate">{block.header.hash.substring(0, 16)}...</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase">Time</div>
                                    <div className="text-sm text-slate-300">{new Date(block.header.time * 1000).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase">Transactions</div>
                                    <div className="text-lg font-bold text-emerald-400">{block.txCount.toLocaleString()}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Progress Bar */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Validation Progress</span>
                                <span className="text-xs text-slate-400">
                                    Step {currentStepIndex + 1} of {steps.length}
                                </span>
                            </div>

                            {/* Stage Pills */}
                            <div className="flex gap-2 flex-wrap">
                                {stageProgress.map((sp) => (
                                    <div
                                        key={sp.stage}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sp.completed === sp.total && sp.allPass
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : sp.completed > 0
                                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                : 'bg-slate-800/50 text-slate-500 border border-slate-700'
                                            }`}
                                    >
                                        <span>{sp.info.icon}</span>
                                        <span>{sp.info.name}</span>
                                        {sp.completed === sp.total && sp.allPass && (
                                            <span className="text-emerald-400">✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar Line */}
                            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        {/* Current Step Card */}
                        <AnimatePresence mode="wait">
                            {currentStep && (
                                <motion.div
                                    key={currentStep.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className={`bg-slate-900/70 border rounded-2xl overflow-hidden ${currentStep.status === 'pass' ? 'border-emerald-500/30' :
                                        currentStep.status === 'fail' ? 'border-rose-500/30' :
                                            currentStep.status === 'info' ? 'border-blue-500/30' :
                                                'border-slate-700'
                                        }`}
                                >
                                    {/* Step Header */}
                                    <div className={`px-6 py-4 border-b ${currentStep.status === 'pass' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                        currentStep.status === 'fail' ? 'bg-rose-500/10 border-rose-500/20' :
                                            currentStep.status === 'info' ? 'bg-blue-500/10 border-blue-500/20' :
                                                'bg-slate-800/50 border-slate-700'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${currentStep.status === 'pass' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    currentStep.status === 'fail' ? 'bg-rose-500/20 text-rose-400' :
                                                        currentStep.status === 'info' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {stageInfo?.icon}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 uppercase tracking-wider">
                                                        Stage {currentStep.stage} • Step {currentStep.id}
                                                    </div>
                                                    <h2 className="text-xl font-bold text-white">{currentStep.name}</h2>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm ${currentStep.status === 'pass' ? 'bg-emerald-500/20 text-emerald-400' :
                                                currentStep.status === 'fail' ? 'bg-rose-500/20 text-rose-400' :
                                                    currentStep.status === 'info' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-slate-700 text-slate-400'
                                                }`}>
                                                {currentStep.status === 'pass' && '✅ PASS'}
                                                {currentStep.status === 'fail' && '❌ FAIL'}
                                                {currentStep.status === 'info' && 'ℹ️ INFO'}
                                                {currentStep.status === 'pending' && '⏳ PENDING'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step Content */}
                                    <div className="p-6 space-y-5">
                                        {/* Description */}
                                        <p className="text-slate-400">{currentStep.description}</p>

                                        {/* The Rule */}
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                            <div className="text-xs text-cyan-400 uppercase tracking-widest mb-2 font-bold">
                                                📜 The Rule
                                            </div>
                                            <p className="text-sm text-slate-200 font-mono">{currentStep.rule}</p>
                                        </div>

                                        {/* The Check */}
                                        <div className={`rounded-xl p-4 ${currentStep.status === 'pass' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                                            currentStep.status === 'fail' ? 'bg-rose-500/10 border border-rose-500/20' :
                                                'bg-slate-800/50 border border-slate-700'
                                            }`}>
                                            <div className={`text-xs uppercase tracking-widest mb-2 font-bold ${currentStep.status === 'pass' ? 'text-emerald-400' :
                                                currentStep.status === 'fail' ? 'text-rose-400' :
                                                    'text-slate-400'
                                                }`}>
                                                🔍 The Check
                                            </div>
                                            <p className="text-sm font-mono text-white break-all">{currentStep.check}</p>
                                        </div>

                                        {/* Details Grid */}
                                        {currentStep.details && Object.keys(currentStep.details).length > 0 && (
                                            <div className="bg-slate-800/30 rounded-xl p-4">
                                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">
                                                    📊 Technical Details
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                    {Object.entries(currentStep.details).map(([key, value]) => (
                                                        <div key={key} className="bg-slate-900/50 rounded-lg p-2">
                                                            <div className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                                                            <div className="font-mono text-slate-200 text-xs truncate">
                                                                {typeof value === 'boolean' ? (value ? '✅ Yes' : '❌ No') : String(value)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Why It Matters */}
                                        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-4">
                                            <div className="text-xs text-violet-400 uppercase tracking-widest mb-2 font-bold">
                                                🎓 Why This Matters
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed">{currentStep.explanation}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentStepIndex === 0}
                                className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 rounded-xl font-medium transition-all"
                            >
                                ← Previous Step
                            </button>

                            <button
                                onClick={() => {
                                    if (isAutoPlaying) {
                                        setIsAutoPlaying(false);
                                    } else {
                                        setCurrentStepIndex(0);
                                        setIsAutoPlaying(true);
                                    }
                                }}
                                className={`py-3 px-6 rounded-xl font-medium transition-all ${isAutoPlaying
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30'
                                    }`}
                            >
                                {isAutoPlaying ? '⏸ Stop' : '▶ Auto-Run'}
                            </button>

                            <button
                                onClick={() => setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
                                disabled={currentStepIndex === steps.length - 1}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-medium transition-all"
                            >
                                Next Step →
                            </button>
                        </div>

                        {/* Mini Step Navigator */}
                        <div className="flex flex-wrap gap-1 justify-center">
                            {steps.map((step, idx) => (
                                <button
                                    key={step.id}
                                    onClick={() => setCurrentStepIndex(idx)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${idx === currentStepIndex
                                        ? 'bg-cyan-500 text-white scale-110'
                                        : idx < currentStepIndex
                                            ? step.status === 'pass'
                                                ? 'bg-emerald-500/30 text-emerald-400'
                                                : step.status === 'fail'
                                                    ? 'bg-rose-500/30 text-rose-400'
                                                    : 'bg-blue-500/30 text-blue-400'
                                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                        }`}
                                    title={step.name}
                                >
                                    {step.id}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!block && !loading && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">⚙️</div>
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Load a Block to Begin</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                            Enter a block height or hash above, or click &quot;Latest&quot; to load the most recent block
                            and step through its validation.
                        </p>
                        <button
                            onClick={() => loadBlock()}
                            className="mt-6 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all"
                        >
                            Load Latest Block
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-16 animate-pulse">
                        <div className="text-6xl mb-4">🔄</div>
                        <div className="text-slate-500">Loading block data...</div>
                    </div>
                )}
            </div>
        </main>
    );
}
