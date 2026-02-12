
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getBlockSubsidy } from "../../lib/constants/bitcoinProtocol";

interface Tx {
    id: string;
    feeRate: number; // sat/vB
    vSize: number;   // vBytes
    totalFee: number; // sats
}

const MAX_BLOCK_SIZE = 10000; // Scaled down for game (represents 1MB)
const TARGET_TIME = 60; // 60 seconds to mine a block
const SIMULATED_BLOCK_HEIGHT = 840_000; // Post-2024 halving era

export default function MempoolGame() {
    console.log("MempoolGame Component v2 - Loaded");
    const [mempool, setMempool] = useState<Tx[]>([]);
    const [block, setBlock] = useState<Tx[]>([]);
    const [timeLeft, setTimeLeft] = useState(TARGET_TIME);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'MINED'>('IDLE');

    // Stats
    const currentSize = block.reduce((acc, tx) => acc + tx.vSize, 0);
    const currentFees = block.reduce((acc, tx) => acc + tx.totalFee, 0);
    const fullness = (currentSize / MAX_BLOCK_SIZE) * 100;
    const blockSubsidy = getBlockSubsidy(SIMULATED_BLOCK_HEIGHT);

    // Transaction ID counter to ensure uniqueness
    let txIdCounter = 0;

    // Generators
    const generateTx = useCallback(() => {
        // Ensure truly unique ID by combining timestamp, counter, and randomness
        const id = `${Date.now().toString(36)}${(txIdCounter++).toString(36)}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

        // Weighted random for fee rate
        // Most are low (10-20), some are med (50-100), few are high (200+)
        const rand = Math.random();
        let feeRate = 10;
        if (rand > 0.95) feeRate = 200 + Math.floor(Math.random() * 300); // Whale
        else if (rand > 0.8) feeRate = 50 + Math.floor(Math.random() * 100);
        else feeRate = 5 + Math.floor(Math.random() * 20);

        // Game Size Units: 100 - 800
        const vSize = 100 + Math.floor(Math.random() * 700);

        return {
            id,
            feeRate,
            vSize,
            totalFee: feeRate * vSize
        };
    }, []);

    // Game Loop
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameState('MINED');
                    return 0;
                }
                return prev - 1;
            });

            // Randomly add txs to mempool
            if (Math.random() > 0.3) {
                const newTxs = Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(generateTx);
                setMempool(prev => [...prev, ...newTxs].slice(-50)); // Keep max 50 in view
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [gameState, generateTx]);

    const startGame = () => {
        setMempool(Array.from({ length: 10 }).map(generateTx));
        setBlock([]);
        setTimeLeft(TARGET_TIME);
        setGameState('PLAYING');
    };

    const addToBlock = (tx: Tx) => {
        if (gameState !== 'PLAYING') return;
        if (currentSize + tx.vSize > MAX_BLOCK_SIZE) return; // Full

        setBlock(prev => [...prev, tx]);
        setMempool(prev => prev.filter(t => t.id !== tx.id));
    };

    const removeFromBlock = (tx: Tx) => {
        if (gameState !== 'PLAYING') return;
        setBlock(prev => prev.filter(t => t.id !== tx.id));
        setMempool(prev => [tx, ...prev]);
    };

    // Auto-Sort mempool by fee? No, let user find them!

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">

            {/* MEMPOOL COLUMN */}
            <div className="md:col-span-5 flex flex-col bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h3 className="font-bold text-slate-400">Mempool Queue</h3>
                    <div className="text-xs text-slate-500">{mempool.length} txs</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    <AnimatePresence>
                        {mempool.map(tx => (
                            <motion.div
                                key={tx.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => addToBlock(tx)}
                                className={`
                                    p-3 rounded cursor-pointer border hover:scale-[1.02] active:scale-95 transition-all
                                    flex justify-between items-center
                                    ${tx.feeRate > 100 ? 'bg-orange-500/20 border-orange-500/50 text-orange-200' :
                                        tx.feeRate > 50 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200' :
                                            'bg-slate-800 border-slate-700 text-slate-400'}
                                `}
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white/50">#{tx.id}</span>
                                    <span className="text-[10px] opacity-70">{tx.vSize} vB</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm">{tx.feeRate} <span className="text-[10px] opacity-70">sat/vB</span></div>
                                    <div className="text-[10px] opacity-70">{(tx.totalFee / 1000).toFixed(2)}k sats</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* BLOCK CANVAS */}
            <div className="md:col-span-7 flex flex-col gap-4">

                {/* HUD */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Time Left</div>
                        <div className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            00:{timeLeft.toString().padStart(2, '0')}
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Block Space</div>
                        <div className="text-2xl font-mono font-bold text-blue-400">
                            {fullness.toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Fees Collected</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400">
                            {(currentFees / 100000000).toFixed(6)} BTC
                        </div>
                    </div>
                </div>

                {/* VISUALIZER */}
                <div className="flex-1 bg-slate-950 rounded-xl border-2 border-dashed border-slate-800 relative overflow-hidden flex flex-col-reverse p-1 content-start flex-wrap gap-1 align-content-start">

                    {gameState === 'IDLE' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
                            <button onClick={startGame} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl shadow-2xl shadow-emerald-500/20 text-xl transform hover:scale-105 transition-all">
                                START MINING ⛏️
                            </button>
                        </div>
                    )}

                    {gameState === 'MINED' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 backdrop-blur-md">
                            <h2 className="text-4xl font-bold text-white mb-2">Block Mined! 📦</h2>
                            <p className="text-slate-400 mb-6">Total Reward: <span className="text-emerald-400 font-bold">{(blockSubsidy + (currentFees / 100000000)).toFixed(6)} BTC</span></p>
                            <button onClick={startGame} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg">
                                Play Again
                            </button>
                        </div>
                    )}

                    {/* Filling Animation */}
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-blue-900/10 pointer-events-none transition-all duration-300"
                        style={{ height: `${fullness}%` }}
                    />

                    {/* Map block txs */}
                    {block.map((tx, i) => (
                        <motion.div
                            key={tx.id}
                            layoutId={tx.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`
                                relative border shadow-sm cursor-pointer
                                ${tx.feeRate > 100 ? 'bg-orange-500 text-orange-950 border-orange-600' :
                                    tx.feeRate > 50 ? 'bg-yellow-500 text-yellow-950 border-yellow-600' :
                                        'bg-slate-600 text-slate-200 border-slate-500'}
                            `}
                            style={{
                                width: '100%',
                                height: `${Math.max(20, (tx.vSize / MAX_BLOCK_SIZE) * 100 * 6)}%`, // Approximate efficient packing
                                flexBasis: `${(tx.vSize / MAX_BLOCK_SIZE) * 100}%`,
                                flexGrow: 0,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold'
                            }}
                            onClick={() => removeFromBlock(tx)}
                        >
                            {tx.feeRate}
                        </motion.div>
                    ))}

                    {block.length === 0 && gameState === 'PLAYING' && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-bold uppercase tracking-widest pointer-events-none">
                            Empty Block
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
