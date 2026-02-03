"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import { motion } from "framer-motion";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

interface BlockData {
    hash: string;
    height: number;
    time: number;
    size: number;
    weight: number;
    miner: string;
    txCount: number;
    reward: number;
    transactions: any[];
}

export default function BlockPage() {
    const { id } = useParams();
    const router = useRouter();
    const [block, setBlock] = useState<BlockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [latestHeight, setLatestHeight] = useState<number>(Infinity);

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        // const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        // Use relative path to hit Next.js API


        // Fetch the block
        fetch(`/api/block/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Block not found");
                return res.json();
            })
            .then(data => {
                setBlock(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Fetch latest block height to know if Next should be disabled
        fetch(`/api/network-stats`)
            .then(res => res.json())
            .then(data => {
                if (data.blocks) setLatestHeight(data.blocks);
            })
            .catch(() => { });
    }, [id]);

    const formatSize = (bytes: number) => {
        if (bytes > 1000000) return (bytes / 1000000).toFixed(2) + " MB";
        return (bytes / 1000).toFixed(2) + " KB";
    };

    // Check if we're at the latest block
    const isLatestBlock = block ? block.height >= latestHeight : false;

    // Prepare TreeMap Data
    const treeMapData = block ? [
        {
            name: "Transactions",
            children: block.transactions.slice(0, 500).map((tx, i) => ({ // Limit to 500 for perf
                name: tx.txid.substring(0, 6) + "...",
                size: tx.weight, // Rect size = weight
                fee: tx.fee, // For tooltip
                isSegwit: tx.isSegwit
            }))
        }
    ] : [];

    // Custom Content for TreeMap Node
    const CustomizedContent = (props: any) => {
        const { root, depth, x, y, width, height, index, payload, colors, rank, name } = props;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: (payload && payload.isSegwit) ? '#10b981' : '#f59e0b', // Green (Segwit) vs Amber (Legacy)
                        stroke: '#1e293b',
                        strokeWidth: 1,
                        userSelect: 'none',
                        opacity: 0.8
                    }}
                />
                {width > 30 && height > 20 && (
                    <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={10}
                        style={{ pointerEvents: 'none' }}
                    >
                        {name}
                    </text>
                )}
            </g>
        );
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                <Header />

                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse space-y-4">
                        <div className="text-4xl">⏳</div>
                        <div className="text-slate-500">Retrieving Block Data from Time Machine...</div>
                    </div>
                ) : !block ? (
                    <div className="text-center py-20 text-red-400">
                        <h1 className="text-2xl font-bold">Block Not Found</h1>
                        <p className="mt-2 text-slate-500">The requested block could not be located in the local node.</p>
                        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-slate-800 rounded hover:bg-slate-700">Return to Home</button>
                    </div>
                ) : (
                    <>
                        {/* Cinematic Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-10 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 text-[100px] font-bold text-slate-800/20 leading-none select-none -z-10">
                                {block.height}
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded">BLOCK {block.height}</span>
                                        <span className="text-slate-500 text-xs">{new Date(block.time * 1000).toLocaleString()}</span>
                                    </div>
                                    <h1 className="text-2xl md:text-4xl font-mono font-bold text-white break-all">{block.hash}</h1>
                                    <div className="mt-4 flex gap-6 text-sm text-slate-400">
                                        <div><span className="block text-slate-500 text-xs uppercase">Miner</span> <span className="text-slate-200">{block.miner}</span></div>
                                        <div><span className="block text-slate-500 text-xs uppercase">Size</span> <span className="text-slate-200">{formatSize(block.size)}</span></div>
                                        <div><span className="block text-slate-500 text-xs uppercase">Tx Count</span> <span className="text-slate-200">{block.txCount.toLocaleString()}</span></div>
                                        <div><span className="block text-slate-500 text-xs uppercase">Reward</span> <span className="text-slate-200 text-yellow-500">{block.reward.toFixed(8)} BTC</span></div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/explorer/block/${block.height - 1}`)}
                                        disabled={block.height <= 0}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors flex items-center gap-2"
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => !isLatestBlock && router.push(`/explorer/block/${block.height + 1}`)}
                                        disabled={isLatestBlock}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors flex items-center gap-2"
                                        title={isLatestBlock ? "This is the latest block" : ""}
                                    >
                                        {isLatestBlock ? "Latest" : "Next →"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Block DNA Visualization */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 inline-block">
                                        Block DNA (TreeMap)
                                    </h2>
                                    <p className="text-slate-500 text-sm max-w-2xl mt-1">
                                        Visualizing the transactions packed into this block. Size represents weight.
                                    </p>
                                </div>
                            </div>

                            <div className="h-[400px] w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                                <ResponsiveContainer width="100%" height="100%">
                                    <Treemap
                                        data={treeMapData}
                                        dataKey="size"
                                        aspectRatio={4 / 1}
                                        stroke="#1e293b"
                                        content={<CustomizedContent />}
                                    >
                                        <Tooltip
                                            content={({ payload }) => {
                                                if (!payload || !payload.length) return null;
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs z-50">
                                                        <div className="font-mono text-cyan-300 mb-1">TXID: {data.name}</div>
                                                        <div className="text-slate-400">Weight: <span className="text-white">{data.size.toLocaleString()} wu</span></div>
                                                        <div className="text-slate-400">Fee: <span className="text-orange-400">{data.fee?.toLocaleString()} sats</span></div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </Treemap>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Transaction List */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-300 flex items-center gap-2">
                                <span>📑</span> Transactions ({block.transactions.length.toLocaleString()} fetched)
                            </h2>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                                <div className="max-h-[800px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left text-sm text-slate-400">
                                        <thead className="bg-slate-900/80 text-xs uppercase text-slate-500 sticky top-0 z-10 backdrop-blur-md">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">TXID</th>
                                                <th className="px-6 py-3 font-medium text-right">Fee (sats)</th>
                                                <th className="px-6 py-3 font-medium text-right">Weight (wu)</th>
                                                <th className="px-6 py-3 font-medium text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {block.transactions.map((tx) => (
                                                <tr key={tx.txid} className="hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-6 py-3 font-mono text-cyan-300 group-hover:text-cyan-200 truncate max-w-[200px]">
                                                        {tx.txid}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono text-orange-400/80">
                                                        {tx.fee?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono text-slate-500">
                                                        {tx.weight?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <a
                                                            href={`/explorer/decoder?tx=${tx.txid}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-cyan-400 transition-colors"
                                                        >
                                                            Decode 🔍
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
