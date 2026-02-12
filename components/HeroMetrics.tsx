"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card, { MetricValue, PanelHeader } from "./Card";
import { BITCOIN_BLOCK_TIME_MINUTES } from "../lib/constants/bitcoinProtocol";

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
        const minutes = blocks * BITCOIN_BLOCK_TIME_MINUTES;
        return Math.floor(minutes / 60 / 24);
    };

    // Fetch real stats from backend
    useEffect(() => {
        const fetchStats = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

            try {
                const results = await Promise.allSettled([
                    fetch(`${baseUrl}/api/vitals`),
                    fetch(`${baseUrl}/api/network-stats`),
                    fetch(`${baseUrl}/api/candidate-block`)
                ]);

                const [vitalsRes, networkRes, mempoolRes] = results;

                // Handle Vitals
                if (vitalsRes.status === 'fulfilled' && vitalsRes.value.ok) {
                    try {
                        const data = await vitalsRes.value.json();
                        setStats(prev => ({
                            ...prev,
                            blocksUntilHalving: data.halving?.blocksRemaining ?? prev.blocksUntilHalving,
                            daysUntilHalving: data.halving?.blocksRemaining
                                ? blocksToDays(data.halving.blocksRemaining)
                                : prev.daysUntilHalving,
                            hashrate: data.difficulty?.networkHashps
                                ? formatHashrate(data.difficulty.networkHashps)
                                : prev.hashrate,
                            difficulty: data.difficulty?.current
                                ? `${(data.difficulty.current / 1e12).toFixed(2)} T`
                                : prev.difficulty
                        }));
                        setIsLive(true);
                    } catch (e) { console.error("Vitals parse error", e); }
                }

                // Handle Network Stats
                if (networkRes.status === 'fulfilled' && networkRes.value.ok) {
                    try {
                        const data = await networkRes.value.json();
                        setStats(prev => ({
                            ...prev,
                            blockHeight: data.blocks ?? prev.blockHeight,
                            feeHigh: data.fees?.fast ? parseFloat(data.fees.fast) : prev.feeHigh,
                            feeMed: data.fees?.medium ? parseFloat(data.fees.medium) : prev.feeMed,
                            feeLow: data.fees?.slow ? parseFloat(data.fees.slow) : prev.feeLow
                        }));
                        setIsLive(true); // At least one successful
                    } catch (e) { console.error("Network parse error", e); }
                }

                // Handle Mempool
                if (mempoolRes.status === 'fulfilled' && mempoolRes.value.ok) {
                    try {
                        const data = await mempoolRes.value.json();
                        setStats(prev => ({
                            ...prev,
                            mempoolTx: data.transactions?.length ?? prev.mempoolTx,
                            mempoolSize: data.totalWeight ? Math.round(data.totalWeight / 4 / 1024) : prev.mempoolSize
                        }));
                    } catch (e) { console.error("Mempool parse error", e); }
                }

            } catch (error) {
                console.log("HeroMetrics: Backend API error", error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 auto-rows-fr">
                {/* Block Height */}
                <Link href="/explorer/blocks">
                    <Card variant="metric" accent="cyan" onClick={() => { }}>
                        <MetricValue
                            icon="📦"
                            value={stats.blockHeight > 0 ? stats.blockHeight.toLocaleString() : "---"}
                            label="Block Height"
                            sublabel={stats.lastBlockTime}
                            accent="cyan"
                        />
                    </Card>
                </Link>

                {/* Hashrate */}
                <Link href="/explorer/vitals">
                    <Card variant="metric" accent="orange" onClick={() => { }}>
                        <MetricValue
                            icon="⛏️"
                            value={stats.hashrate}
                            label="Hashrate"
                            sublabel="Network Security"
                            accent="orange"
                        />
                    </Card>
                </Link>

                {/* Mempool */}
                <Link href="/explorer/mempool">
                    <Card variant="metric" accent="blue" onClick={() => { }}>
                        <MetricValue
                            icon="🌊"
                            value={stats.mempoolTx > 0 ? stats.mempoolTx.toLocaleString() : "---"}
                            label="Pending TXs"
                            sublabel={stats.mempoolSize > 0 ? `${stats.mempoolSize} MB` : "..."}
                            accent="blue"
                        />
                    </Card>
                </Link>

                {/* Halving */}
                <Link href="/explorer/vitals">
                    <Card variant="metric" accent="violet" onClick={() => { }}>
                        <MetricValue
                            icon="⏳"
                            value={stats.daysUntilHalving > 0 ? stats.daysUntilHalving : "---"}
                            label="Days to Halving"
                            sublabel={stats.blocksUntilHalving > 0 ? `~${stats.blocksUntilHalving.toLocaleString()} blocks` : "..."}
                            accent="violet"
                        />
                    </Card>
                </Link>
            </div>

            {/* Fee Bands + Live Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fee Bands */}
                <Link href="/explorer/fees" className="block w-full h-full">
                    <Card variant="panel" className="h-full" onClick={() => { }}>
                        <PanelHeader>Fee Market (sat/vB)</PanelHeader>
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
                    </Card>
                </Link>

                {/* Live Mempool Feed */}
                <Link href="/explorer/mempool" className="block w-full h-full">
                    <Card variant="panel" className="h-full" onClick={() => { }}>
                        <PanelHeader icon={<div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}>
                            Live Mempool Stream
                        </PanelHeader>
                        <div className="space-y-1 font-mono text-xs h-[72px] overflow-hidden">
                            {recentTxs.map((tx, i) => (
                                <div
                                    key={`${tx}-${i}`}
                                    className="text-cyan-400/70 truncate"
                                    style={{ opacity: 1 - i * 0.15 }}
                                >
                                    <span className="text-slate-600">TX:</span> {tx}...{Math.random().toString(36).substring(2, 6)}
                                </div>
                            ))}
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
