"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";
import BlockTrain from "../../../components/BlockTrain";

interface BlockInfo {
    height: number;
    hash: string;
    time: number;
    miner: string;
}

export default function BlocksIndexPage() {
    // Keep the table for historical list, but maybe fetch deeper history here?
    // For now, let's just show the same recent blocks + visualizer
    const [blocks, setBlocks] = useState<BlockInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We can reuse the miners API for the table list
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/miners`)
            .then(res => res.json())
            .then(data => {
                setBlocks(data.blocks);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-12">
                <Header />

                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500">
                                The Blockchain 🔗
                            </h1>
                            <p className="mt-2 text-slate-400">
                                Visualizing the immutable ledger in real-time.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-500 font-mono">
                            Sanctuary Mode: <span className="text-emerald-400">ACTIVE</span>
                        </div>
                    </div>

                    {/* Component: Visual Block Train */}
                    <div className="py-8 bg-slate-900/20 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                        <h2 className="px-6 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Live Block Stream</h2>
                        <BlockTrain />
                    </div>
                </div>

                {/* Legacy Table View */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h2 className="text-xl font-bold text-slate-300 flex items-center gap-2">
                        <span>📜</span> History
                    </h2>

                    {loading ? (
                        <div className="text-center py-20 text-slate-500 animate-pulse">Fetching block history...</div>
                    ) : (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-900/80 text-xs uppercase text-slate-500 border-b border-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Height</th>
                                        <th className="px-6 py-4 font-medium">Hash</th>
                                        <th className="px-6 py-4 font-medium">Miner</th>
                                        <th className="px-6 py-4 font-medium text-right">Time</th>
                                        <th className="px-6 py-4 font-medium text-right">Size</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {blocks.map((block) => (
                                        <tr key={block.hash} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-cyan-300 group-hover:text-cyan-200">
                                                <Link href={`/explorer/block/${block.hash}`} className="hover:underline flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400"></span>
                                                    {block.height}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                                                {block.hash.substring(0, 12)}...{block.hash.substring(52)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                                    {block.miner}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-500">
                                                {new Date(block.time * 1000).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-500">
                                                {/* Mock size if missing in miners API, or use blocks info */}
                                                {(Math.random() * 1 + 0.5).toFixed(2)} MB
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
