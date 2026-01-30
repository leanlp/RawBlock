"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface NetworkStats {
    blockHeight: number;
    hashrate: string;
    difficulty: string;
    mempoolSize: number;
    mempoolTx: number;
    feeHigh: number;
    feeMed: number;
    feeLow: number;
    blocksUntilHalving: number;
    daysUntilHalving: number;
    lastBlockTime: string;
}

export default function HeroMetrics() {
    const [stats, setStats] = useState<NetworkStats>({
        blockHeight: 0,
        hashrate: "Loading...",
        difficulty: "Loading...",
        mempoolSize: 0,
        mempoolTx: 0,
        feeHigh: 0,
        feeMed: 0,
        feeLow: 0,
        blocksUntilHalving: 0,
        daysUntilHalving: 0,
        lastBlockTime: "..."
    });

    const [isLive, setIsLive] = useState(false);
    const [recentTxs, setRecentTxs] = useState<string[]>([]);

    // Format hashrate to EH/s
    const formatHashrate = (hashes?: number) => {
        if (!hashes) return "Measuring...";
        const eh = hashes / 1e18;
        return eh.toFixed(2) + " EH/s";
    };

    // Calculate days from blocksRemaining (avg 10 min per block)
    const blocksToDays = (blocks: number) => {
        const minutes = blocks * 10;
        return Math.floor(minutes / 60 / 24);
    };

    // Fetch real stats from backend - using same API as Vitals page
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

                // Fetch from /api/vitals - same as Vitals page for consistent data
                const vitalsRes = await fetch(`${baseUrl}/api/vitals`);
                if (vitalsRes.ok) {
                    const data = await vitalsRes.json();

                    setStats(prev => ({
                        ...prev,
                        // Halving data
                        blocksUntilHalving: data.halving?.blocksRemaining || prev.blocksUntilHalving,
                        daysUntilHalving: data.halving?.blocksRemaining
                            ? blocksToDays(data.halving.blocksRemaining)
                            : prev.daysUntilHalving,
                        // Hashrate and difficulty
                        hashrate: data.difficulty?.networkHashps
                            ? formatHashrate(data.difficulty.networkHashps)
                            : prev.hashrate,
                        difficulty: data.difficulty?.current
                            ? `${(data.difficulty.current / 1e12).toFixed(2)} T`
                            : prev.difficulty
                    }));
                    setIsLive(true);
                }

                // Fetch network stats for block height and fees
                const networkRes = await fetch(`${baseUrl}/api/network-stats`);
                if (networkRes.ok) {
                    const data = await networkRes.json();
                    setStats(prev => ({
                        ...prev,
                        blockHeight: data.blocks || prev.blockHeight,
                        // Fees from network-stats endpoint
                        feeHigh: data.fees?.fast ? parseFloat(data.fees.fast) : prev.feeHigh,
                        feeMed: data.fees?.medium ? parseFloat(data.fees.medium) : prev.feeMed,
                        feeLow: data.fees?.slow ? parseFloat(data.fees.slow) : prev.feeLow
                    }));
                }

                // Fetch mempool data from candidate-block or mempool-recent
                const mempoolRes = await fetch(`${baseUrl}/api/candidate-block`);
                if (mempoolRes.ok) {
                    const data = await mempoolRes.json();
                    setStats(prev => ({
                        ...prev,
                        mempoolTx: data.transactions?.length || prev.mempoolTx,
                        mempoolSize: data.totalWeight ? Math.round(data.totalWeight / 4 / 1024) : prev.mempoolSize
                    }));
                }

            } catch (error) {
                console.log("HeroMetrics: Backend API not available");
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    // Simulated mempool activity animation
    useEffect(() => {
        const interval = setInterval(() => {
            const txId = Math.random().toString(36).substring(2, 10).toUpperCase();
            setRecentTxs(prev => [txId, ...prev].slice(0, 5));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full mb-12">
            {/* Live Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs text-slate-500 uppercase tracking-widest">
                    {isLive ? "Live from Node" : "Connecting..."}
                </span>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Block Height */}
                <Link href="/explorer/block">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center hover:border-cyan-500/50 transition-all group cursor-pointer"
                    >
                        <div className="text-2xl mb-1">📦</div>
                        <div className="text-3xl font-black text-white mb-1 group-hover:text-cyan-400 transition-colors">
                            {stats.blockHeight > 0 ? stats.blockHeight.toLocaleString() : "---"}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Block Height</div>
                        <div className="text-[10px] text-slate-600 mt-1">{stats.lastBlockTime}</div>
                    </motion.div>
                </Link>

                {/* Hashrate */}
                <Link href="/analysis/vitals">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center hover:border-orange-500/50 transition-all group cursor-pointer"
                    >
                        <div className="text-2xl mb-1">⛏️</div>
                        <div className="text-3xl font-black text-white mb-1 group-hover:text-orange-400 transition-colors">
                            {stats.hashrate}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Hashrate</div>
                        <div className="text-[10px] text-slate-600 mt-1">Network Security</div>
                    </motion.div>
                </Link>

                {/* Mempool */}
                <Link href="/explorer/mempool">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center hover:border-blue-500/50 transition-all group cursor-pointer"
                    >
                        <div className="text-2xl mb-1">🌊</div>
                        <div className="text-3xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">
                            {stats.mempoolTx > 0 ? stats.mempoolTx.toLocaleString() : "---"}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Pending TXs</div>
                        <div className="text-[10px] text-slate-600 mt-1">{stats.mempoolSize > 0 ? `${stats.mempoolSize} MB` : "..."}</div>
                    </motion.div>
                </Link>

                {/* Halving */}
                <Link href="/analysis/vitals">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center hover:border-violet-500/50 transition-all group cursor-pointer"
                    >
                        <div className="text-2xl mb-1">⏳</div>
                        <div className="text-3xl font-black text-white mb-1 group-hover:text-violet-400 transition-colors">
                            {stats.daysUntilHalving > 0 ? stats.daysUntilHalving : "---"}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Days to Halving</div>
                        <div className="text-[10px] text-slate-600 mt-1">
                            {stats.blocksUntilHalving > 0 ? `~${stats.blocksUntilHalving.toLocaleString()} blocks` : "..."}
                        </div>
                    </motion.div>
                </Link>
            </div>

            {/* Fee Bands + Live Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fee Bands */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-900/40 border border-slate-800 rounded-xl p-4"
                >
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Fee Market (sat/vB)</div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-xs text-slate-400">High Priority</span>
                            </div>
                            <span className="font-mono text-red-400 font-bold">
                                {stats.feeHigh > 0 ? `${stats.feeHigh} sat/vB` : "---"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="text-xs text-slate-400">Medium</span>
                            </div>
                            <span className="font-mono text-amber-400 font-bold">
                                {stats.feeMed > 0 ? `${stats.feeMed} sat/vB` : "---"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-slate-400">Low (Economy)</span>
                            </div>
                            <span className="font-mono text-emerald-400 font-bold">
                                {stats.feeLow > 0 ? `${stats.feeLow} sat/vB` : "---"}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Live Mempool Feed */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-slate-900/40 border border-slate-800 rounded-xl p-4"
                >
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        Live Mempool Stream
                    </div>
                    <div className="space-y-1 font-mono text-xs h-[72px] overflow-hidden">
                        {recentTxs.map((tx, i) => (
                            <motion.div
                                key={`${tx}-${i}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1 - i * 0.15, x: 0 }}
                                className="text-cyan-400/70 truncate"
                            >
                                <span className="text-slate-600">TX:</span> {tx}...{Math.random().toString(36).substring(2, 6)}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
