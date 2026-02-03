"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Block {
    height: number;
    hash: string;
    time: number;
    tx_count: number;
    size: number;
    weight: number;
    fullness: number;
    median_fee: number;
}

export default function BlockTrain() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const res = await fetch('/api/blocks-visual');
                if (res.ok) {
                    const data = await res.json();
                    setBlocks(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchBlocks();
        // Poll every 30s
        const interval = setInterval(fetchBlocks, 30000);
        return () => clearInterval(interval);
    }, []);

    // Helper for color mapping
    const getBlockColor = (fee: number, fullness: number) => {
        // Simple heuristic: Full + High Fee = Purple/Orange
        // Empty = Blue
        if (fullness < 0.2) return 'from-blue-900 to-blue-800 border-blue-500';
        if (fullness < 0.8) return 'from-indigo-900 to-indigo-800 border-indigo-500';
        return 'from-purple-900 to-purple-800 border-purple-500';
    };

    if (loading) return <div className="h-40 flex items-center justify-center text-slate-500 animate-pulse">Loading Chain...</div>;

    return (
        <div className="w-full overflow-x-auto pb-8 pt-4 hide-scrollbar">
            <div className="flex gap-4 min-w-max px-4 items-end h-48">
                {/* Pending Block (Mempool Placeholder) */}
                <div className="relative group">
                    <div className="w-32 h-32 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-900/30">
                        <span className="animate-pulse text-slate-600 text-xs text-center font-mono">
                            PENDING<br />BLOCK
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <div className="text-slate-700">←</div>

                {/* Real Blocks */}
                {blocks.map((block) => (
                    <Link href={`/explorer/block/${block.hash}`} key={block.hash} className="group relative transition-transform hover:-translate-y-2 duration-300">
                        {/* The Cube */}
                        <div
                            className={`
                                w-32 rounded-xl border-2 shadow-2xl relative overflow-hidden backdrop-blur-md
                                bg-gradient-to-br ${getBlockColor(block.median_fee, block.fullness)}
                                hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)] transition-all
                            `}
                            style={{
                                height: `${Math.max(80, block.fullness * 160)}px`, // Dynamic Height based on weight
                                opacity: 0.9
                            }}
                        >
                            {/* Inner Texture */}
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mixed-blend-overlay"></div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                                <span className="text-2xl font-bold text-white/90 drop-shadow-md">
                                    {block.height}
                                </span>
                                <span className="text-[10px] text-white/70 font-mono mt-1">
                                    {block.tx_count} txs
                                </span>
                                <span className="text-[9px] text-white/50">
                                    {(block.size / 1000000).toFixed(2)} MB
                                </span>
                            </div>
                        </div>

                        {/* Connector Line */}
                        <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-slate-800 -z-10 group-last:hidden"></div>

                        {/* Time Label */}
                        <div className="absolute -bottom-8 left-0 w-full text-center text-[10px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(block.time * 1000).toLocaleTimeString()}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
