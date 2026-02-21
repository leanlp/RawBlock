"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../components/Header';
import Card from '../../../../components/Card';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// Minimal type representing the summary of a block for comparison
interface BlockSummary {
    id: string;
    height: number;
    timestamp: number;
    tx_count: number;
    size: number;
    weight: number;
    mediantime?: number;
    nonce?: number;
    bits?: string;
    difficulty?: number;
    extras?: {
        reward?: number;
        pool?: {
            id?: number;
            name: string;
            slug?: string;
        };
        avgFee?: number;
        avgFeeRate?: number;
    };
}

export const dynamic = "force-dynamic";

function BlockCompareContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // b1 and b2 can be heights or hashes
    const initialB1 = searchParams.get('b1') || '';
    const initialB2 = searchParams.get('b2') || '';

    const [b1Input, setB1Input] = useState(initialB1);
    const [b2Input, setB2Input] = useState(initialB2);

    const [block1, setBlock1] = useState<BlockSummary | null>(null);
    const [block2, setBlock2] = useState<BlockSummary | null>(null);
    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);
    const [error1, setError1] = useState('');
    const [error2, setError2] = useState('');

    const fetchBlock = async (query: string, slot: 1 | 2) => {
        if (!query.trim()) return;

        const setLoading = slot === 1 ? setLoading1 : setLoading2;
        const setError = slot === 1 ? setError1 : setError2;
        const setBlock = slot === 1 ? setBlock1 : setBlock2;

        setLoading(true);
        setError('');

        try {
            // First try mempool.space API as a reliable fallback for comparing basic metrics
            // We use the public API here broadly to ensure we get comparable stats quickly
            let hash = query.trim();

            // If it's a short number, assume it's a height
            if (/^\d{1,7}$/.test(hash)) {
                const hRes = await fetch(`https://mempool.space/api/block-height/${hash}`);
                if (!hRes.ok) throw new Error("Block height not found");
                hash = await hRes.text();
            }

            const res = await fetch(`https://mempool.space/api/block/${hash}`);
            if (!res.ok) throw new Error("Block not found");
            const data = await res.json();

            setBlock(data as BlockSummary);
        } catch (err) {
            console.error(`Error fetching block ${slot}:`, err);
            setError((err as Error).message || "Failed to load block");
            setBlock(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialB1) fetchBlock(initialB1, 1);
        if (initialB2) fetchBlock(initialB2, 2);
    }, [initialB1, initialB2]);

    const handleCompare = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (b1Input) params.set('b1', b1Input);
        if (b2Input) params.set('b2', b2Input);
        router.push(`/explorer/blocks/compare?${params.toString()}`);
    };

    const renderMetricRow = (label: string, val1: React.ReactNode, val2: React.ReactNode, highlight: 'higher' | 'lower' | 'none' = 'none') => {
        // Very basic numeric comparison for highlighting
        let w1 = false;
        let w2 = false;

        if (highlight !== 'none' && typeof val1 === 'number' && typeof val2 === 'number') {
            if (val1 > val2) {
                w1 = highlight === 'higher';
                w2 = highlight === 'lower';
            } else if (val2 > val1) {
                w2 = highlight === 'higher';
                w1 = highlight === 'lower';
            }
        }

        return (
            <div className="grid grid-cols-[120px_1fr_1fr] md:grid-cols-[200px_1fr_1fr] gap-4 py-3 border-b border-slate-800/50 items-center">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</div>
                <div className={`font-mono text-sm break-all ${w1 ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                    {val1 !== undefined && val1 !== null ? val1 : '-'}
                </div>
                <div className={`font-mono text-sm break-all ${w2 ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                    {val2 !== undefined && val2 !== null ? val2 : '-'}
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono selection:bg-cyan-500/30">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="md:hidden">
                    <Header />
                </div>

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="page-header">
                        <h1 className="page-title bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            Block Compare
                        </h1>
                        <p className="page-subtitle uppercase tracking-widest">
                            Side-by-side metric analysis
                        </p>
                    </div>
                    <Link href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors self-start md:self-auto inline-flex items-center min-h-11">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Input Form */}
                <Card variant="panel" className="p-4 md:p-6">
                    <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 space-y-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold">Block A (Height or Hash)</label>
                            <input
                                value={b1Input}
                                onChange={e => setB1Input(e.target.value)}
                                placeholder="e.g. 840000"
                                className="w-full min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-slate-200 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                            />
                        </div>
                        <div className="hidden md:flex md:col-span-2 justify-center items-center pb-3 text-slate-600 font-bold text-xl">
                            VS
                        </div>
                        <div className="md:hidden text-center text-slate-600 font-bold py-2">VS</div>
                        <div className="md:col-span-5 space-y-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold">Block B (Height or Hash)</label>
                            <div className="flex gap-2">
                                <input
                                    value={b2Input}
                                    onChange={e => setB2Input(e.target.value)}
                                    placeholder="e.g. 840001"
                                    className="w-full min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-slate-200 focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all font-mono"
                                />
                                <button
                                    type="submit"
                                    className="min-h-11 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                                >
                                    Compare
                                </button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Loading / Error States across columns */}
                <div className="grid grid-cols-[120px_1fr_1fr] md:grid-cols-[200px_1fr_1fr] gap-4">
                    <div className="col-start-2">
                        {loading1 && <div className="text-xs text-purple-400 animate-pulse">Loading Block A...</div>}
                        {error1 && <div className="text-xs text-rose-400">{error1}</div>}
                    </div>
                    <div className="col-start-3">
                        {loading2 && <div className="text-xs text-pink-400 animate-pulse">Loading Block B...</div>}
                        {error2 && <div className="text-xs text-rose-400">{error2}</div>}
                    </div>
                </div>

                {/* Comparison Details */}
                {(block1 || block2) && (
                    <Card variant="panel" className="p-0 overflow-hidden">

                        {/* Headers */}
                        <div className="grid grid-cols-[120px_1fr_1fr] md:grid-cols-[200px_1fr_1fr] gap-4 p-4 md:p-6 bg-slate-900/80 border-b border-slate-800 items-end">
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Metric</div>
                            <div>
                                <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Block A</div>
                                <div className="text-2xl font-bold text-slate-200">
                                    {block1 ? `#${block1.height}` : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">Block B</div>
                                <div className="text-2xl font-bold text-slate-200">
                                    {block2 ? `#${block2.height}` : '—'}
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 md:p-6 flex flex-col">
                            {renderMetricRow("Hash",
                                block1 ? <Link href={`/explorer/block/${block1.id}`} className="text-cyan-400 hover:underline">{block1.id.slice(0, 8)}...{block1.id.slice(-8)}</Link> : null,
                                block2 ? <Link href={`/explorer/block/${block2.id}`} className="text-cyan-400 hover:underline">{block2.id.slice(0, 8)}...{block2.id.slice(-8)}</Link> : null
                            )}

                            {renderMetricRow("Mined At",
                                block1 ? new Date(block1.timestamp * 1000).toLocaleString() : null,
                                block2 ? new Date(block2.timestamp * 1000).toLocaleString() : null
                            )}

                            {renderMetricRow("Tx Count",
                                block1?.tx_count,
                                block2?.tx_count,
                                'higher'
                            )}

                            {renderMetricRow("Size (MB)",
                                block1 ? (block1.size / 1_000_000).toFixed(2) : null,
                                block2 ? (block2.size / 1_000_000).toFixed(2) : null,
                                'higher'
                            )}

                            {renderMetricRow("Weight (MWU)",
                                block1 ? (block1.weight / 1_000_000).toFixed(2) : null,
                                block2 ? (block2.weight / 1_000_000).toFixed(2) : null,
                                'higher'
                            )}

                            {renderMetricRow("Miner / Pool",
                                block1?.extras?.pool?.name || "Unknown",
                                block2?.extras?.pool?.name || "Unknown"
                            )}

                            {renderMetricRow("Total Reward (BTC)",
                                block1?.extras?.reward ? (block1.extras.reward / 100_000_000).toFixed(4) : null,
                                block2?.extras?.reward ? (block2.extras.reward / 100_000_000).toFixed(4) : null,
                                'higher'
                            )}

                            {renderMetricRow("Avg Fee (sats)",
                                block1?.extras?.avgFee,
                                block2?.extras?.avgFee,
                                'none'
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </main>
    );
}

import { Suspense } from 'react';

export default function BlockComparePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono">Loading Block Compare...</div>}>
            <BlockCompareContent />
        </Suspense>
    );
}
