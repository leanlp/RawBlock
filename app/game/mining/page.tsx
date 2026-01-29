"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Block {
    height: number;
    time: number; // Simulated timestamp
    interval: number; // Time since last block (seconds)
    difficulty: number;
}

export default function MiningSimPage() {
    const [hashrate, setHashrate] = useState(100); // Percentage (100 = baseline)
    const [difficulty, setDifficulty] = useState(100); // Percentage
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [epochProgress, setEpochProgress] = useState(0); // 0 to 2016
    const [simSpeed, setSimSpeed] = useState(100); // 1s real = 100s sim
    const [isPaused, setIsPaused] = useState(false);

    // Stratum V2 State
    const [v2Enabled, setV2Enabled] = useState(false);

    const lastBlockTimeRef = useRef(Date.now());
    const heightRef = useRef(800000);

    // Simulation Loop
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            // Expected time for 1 block at baseline = 600s
            // Actual time = 600 * (Difficulty / Hashrate)
            const expectedInterval = 600 * (difficulty / hashrate);

            // Random variance (Exponential distribution for mining)
            // -ln(U) * expectedInterval
            const randomFactor = -Math.log(Math.random());
            const nextBlockInterval = expectedInterval * randomFactor;

            // In our fast-forward sim, we tick by 'simSpeed' seconds every 100ms
            // Actually, let's just "find" a block periodically for visual effect?
            // No, accurate sim:
            // We accumulate "work" every tick.

            // Simpler approach for UI:
            // Just spawn a block every X seconds based on hashrate relative to baseline.
            // Baseline (100% HR, 100% Diff) = 1 block every 2 seconds (accelerated 300x).

        }, 100);

        return () => clearInterval(interval);
    }, [hashrate, difficulty, isPaused]);

    // Better Sim Logic: 
    // We just run a timer. Every tick (e.g. 100ms) represents (simSpeed / 10) seconds passing.
    // We check if a block is found in that time window.
    // Prob of finding block in time T = 1 - e^(-T / expectedInterval)

    useEffect(() => {
        if (isPaused) return;

        const tickRate = 100; // ms
        const timer = setInterval(() => {
            const timePassed = (tickRate / 1000) * simSpeed;
            const expectedMeanTime = 600 * (difficulty / hashrate);

            // Poisson process probability
            const probability = 1 - Math.exp(-timePassed / expectedMeanTime);

            if (Math.random() < probability) {
                // BLOCK FOUND!
                heightRef.current += 1;

                const newBlock: Block = {
                    height: heightRef.current,
                    time: Date.now(), // Real time for sorting
                    interval: Math.round(expectedMeanTime * (-Math.log(Math.random()))), // Simulated interval variance
                    difficulty: difficulty
                };

                setBlocks(prev => {
                    const next = [...prev, newBlock].slice(-50); // Keep last 50
                    return next;
                });

                setEpochProgress(prev => {
                    const next = prev + 1;
                    if (next >= 20) { // Mini-epoch of 20 blocks for demo (instead of 2016)
                        // RE-TARGET
                        // Ideal time for 20 blocks = 20 * 600 = 12,000s
                        // Actual time... we need to track sum of intervals.
                        // For this demo, simply set Difficulty = Hashrate to stabilize.
                        // Or calculate adjustment factor.
                        // let's assume we perfectly adjust to current hashrate.
                        setDifficulty(hashrate);
                        return 0;
                    }
                    return next;
                });
            }

        }, tickRate);

        return () => clearInterval(timer);
    }, [hashrate, difficulty, simSpeed, isPaused]);


    // Stats
    const currentBlockTime = blocks.length > 0 ? blocks[blocks.length - 1].interval : 600;
    const avgBlockTime = blocks.length > 0
        ? blocks.reduce((acc, b) => acc + b.interval, 0) / blocks.length
        : 600;

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
                            Mining Simulator ⛏️
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">Target: 10 mins (600s). Epoch: 20 blocks (Demo Mode).</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setHashrate(50)} className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 text-xs">China Ban (-50%)</button>
                        <button onClick={() => setHashrate(300)} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/30 text-xs">ASIC Boom (+300%)</button>
                        <button onClick={() => { setHashrate(100); setDifficulty(100); }} className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded hover:bg-slate-700 text-xs">Reset</button>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-4">Network Hashrate</h3>
                        <div className="text-4xl font-black text-amber-500 mb-2">{hashrate}%</div>
                        <input
                            type="range" min="10" max="500" value={hashrate}
                            onChange={(e) => setHashrate(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <p className="text-xs text-slate-500 mt-2">Adjust to simulate shocks.</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-4">Difficulty Target</h3>
                        <div className="text-4xl font-black text-blue-500 mb-2">{difficulty.toFixed(0)}%</div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (epochProgress / 20) * 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>Epoch Progress</span>
                            <span>{epochProgress} / 20 Blocks</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-4">Avg Block Time</h3>
                        <div className={`text-4xl font-black mb-2 ${Math.abs(avgBlockTime - 600) < 60 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(avgBlockTime / 60).toFixed(1)}m
                        </div>
                        <p className="text-xs text-slate-500">Target: 10.0m</p>
                    </div>
                </div>

                {/* GRAPH */}
                <div className="h-64 bg-slate-900/30 border border-slate-800 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={blocks}>
                            <XAxis dataKey="height" hide />
                            <YAxis domain={[0, 'auto']} hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                                labelFormatter={(label) => `Block ${label}`}
                            />
                            <ReferenceLine y={600} stroke="#10b981" strokeDasharray="3 3" label="Target (10m)" />
                            <Line type="monotone" dataKey="interval" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* STRATUM V2 DEMO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-6">Stratum Protocol Efficiency</h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-red-400">Stratum V1 (JSON-RPC)</span>
                                    <span className="text-slate-400">~100 Bytes/msg</span>
                                </div>
                                <div className="h-8 bg-slate-800 rounded w-full overflow-hidden flex items-center px-2">
                                    <div className="w-full bg-red-500/20 h-4 rounded animate-pulse"></div>
                                    <span className="absolute left-8 text-[10px] bg-slate-950 px-1 text-red-500 font-mono">{"{\"method\": \"mining.submit\", ...}"}</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-emerald-400">Stratum V2 (Binary)</span>
                                    <span className="text-slate-400">~50 Bytes/msg (-50%)</span>
                                </div>
                                <div className="h-8 bg-slate-800 rounded w-full overflow-hidden flex items-center px-2">
                                    <div className="w-[50%] bg-emerald-500/20 h-4 rounded"></div>
                                    <span className="absolute left-8 text-[10px] bg-slate-950 px-1 text-emerald-500 font-mono">0x0F2A...</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-slate-950/50 rounded border border-slate-800 text-xs text-slate-400">
                            <strong>Note:</strong> V2 also adds encryption (NOISE protocol) and prevents hashrate hijacking (Man-in-the-Middle attacks).
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                        <div className="text-6xl mb-4">🏭</div>
                        <h3 className="text-xl font-bold text-slate-200">Start Your Farm</h3>
                        <p className="text-slate-400 text-sm mt-2 max-w-sm">
                            Real mining involves managing heat, power, and hardware. This simulator focuses on the <strong>Protocol Economics</strong>.
                        </p>
                    </div>
                </div>

            </div>
        </main>
    );
}
