"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../../components/Header";

interface BlockInfo {
    height: number;
    hash: string;
    time: number;
    miner: string;
}

export default function BlocksIndexPage() {
    const [blocks, setBlocks] = useState<BlockInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Reuse the miners API which returns recent blocks
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/miners`)
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
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="pb-6 border-b border-slate-800">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Latest Blocks 📦
                    </h1>
                    <p className="mt-2 text-slate-400 text-sm">
                        Recent blocks mined by the network.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500 animate-pulse">Fetching blocks...</div>
                ) : (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left text-sm text-slate-400">
                            <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Height</th>
                                    <th className="px-6 py-3 font-medium">Hash</th>
                                    <th className="px-6 py-3 font-medium">Miner</th>
                                    <th className="px-6 py-3 font-medium text-right">Time</th>
                                    <th className="px-6 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {blocks.map((block) => (
                                    <tr key={block.hash} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-cyan-300">
                                            <Link href={`/explorer/block/${block.hash}`} className="hover:underline">
                                                {block.height}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs opacity-70">
                                            {block.hash.substring(0, 8)}...{block.hash.substring(56)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block min-w-20 px-3 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400 border border-slate-700 text-center truncate">
                                                {block.miner}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-500">
                                            {new Date(block.time * 1000).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/explorer/block/${block.hash}`}
                                                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider"
                                            >
                                                View &rarr;
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
