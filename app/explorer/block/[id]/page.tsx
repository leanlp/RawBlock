"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import PageHeader from "../../../../components/PageHeader";
import Card from "../../../../components/Card";
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

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        // Fetch the block
        fetch(`${baseUrl}/api/block/${id}`)
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
        fetch(`${baseUrl}/api/network-stats`)
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
            children: (block.transactions || []).slice(0, 500).map((tx, i) => ({ // Limit to 500 for perf
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
                        {/* Standardized Header */}
                        <PageHeader
                            title={`Block #${block.height}`}
                            subtitle={block.hash}
                            icon="📦"
                            gradient="from-blue-400 to-indigo-500"
                            actions={
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/explorer/block/${block.height - 1}`)}
                                        disabled={block.height <= 0}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm transition-colors flex items-center gap-2 border border-slate-700"
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => !isLatestBlock && router.push(`/explorer/block/${block.height + 1}`)}
                                        disabled={isLatestBlock}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm transition-colors flex items-center gap-2 border border-slate-700"
                                        title={isLatestBlock ? "This is the latest block" : ""}
                                    >
                                        {isLatestBlock ? "Latest" : "Next →"}
                                    </button>
                                </div>
                            }
                        />

                        {/* Block Details Card */}
                        <Card variant="panel" className="mb-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-2">
                                <div>
                                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Mined By</div>
                                    <div className="text-slate-200 font-mono text-sm truncate" title={block.miner}>{block.miner}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Time</div>
                                    <div className="text-slate-200 font-mono text-sm">{new Date(block.time * 1000).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Stats</div>
                                    <div className="text-slate-200 font-mono text-sm">
                                        <span className="text-slate-400">Size:</span> {formatSize(block.size)} <span className="text-slate-600">|</span> <span className="text-slate-400">Tx:</span> {(block.txCount ?? 0).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Reward</div>
                                    <div className="text-emerald-400 font-mono font-bold text-sm">{(block.reward ?? 0).toFixed(8)} BTC</div>
                                </div>
                            </div>
                        </Card>

                        {/* Block DNA Visualization */}
                        {block.transactions && block.transactions.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 inline-block">
                                    Block DNA (TreeMap)
                                </h2>
                                <p className="text-slate-500 text-sm max-w-2xl">
                                    Visualizing the Top 500 transactions packed into this block. Size represents weight (vBytes).
                                    Green = SegWit, Amber = Legacy.
                                </p>

                                <div className="h-[500px] w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={treeMapData}
                                            dataKey="size"
                                            aspectRatio={4 / 3}
                                            stroke="#1e293b"
                                            content={<CustomizedContent />}
                                        >
                                            <Tooltip
                                                content={({ payload }) => {
                                                    if (!payload || !payload.length) return null;
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                                                            <div className="font-mono text-slate-300 mb-1">TXID: {data.name}</div>
                                                            <div className="text-slate-400">Weight: <span className="text-white">{data.size} wu</span></div>
                                                            <div className="text-slate-400">Type: <span className={data.isSegwit ? "text-emerald-400" : "text-amber-400"}>{data.isSegwit ? "SegWit (Efficient)" : "Legacy (Heavy)"}</span></div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </Treemap>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
