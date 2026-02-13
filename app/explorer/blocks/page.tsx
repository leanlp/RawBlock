"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Card, { CardRow } from "../../../components/Card";
import EmptyState, { LoadingState, ErrorState } from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";

interface BlockInfo {
    height: number;
    hash: string;
    time: number;
    miner: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.rawblock.net";
const MEMPOOL_BLOCKS_URL = "https://mempool.space/api/v1/blocks";

interface MempoolBlockInfo {
    height: number;
    id: string;
    timestamp: number;
    extras?: {
        pool?: {
            name?: string;
        };
    };
}

export default function BlocksIndexPage() {
    const router = useRouter();
    const [blocks, setBlocks] = useState<BlockInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBlocks = useCallback(() => {
        setLoading(true);
        setError(null);

        const fetchPrimary = async (): Promise<BlockInfo[]> => {
            const res = await fetch(`${API_BASE_URL}/api/miners`);
            if (!res.ok) throw new Error(`Primary source HTTP ${res.status}`);
            const data = await res.json();
            if (!Array.isArray(data?.blocks)) {
                throw new Error("Primary source payload missing blocks");
            }
            return data.blocks as BlockInfo[];
        };

        const fetchFallback = async (): Promise<BlockInfo[]> => {
            const res = await fetch(MEMPOOL_BLOCKS_URL);
            if (!res.ok) throw new Error(`Fallback source HTTP ${res.status}`);
            const data = (await res.json()) as MempoolBlockInfo[];
            if (!Array.isArray(data)) {
                throw new Error("Fallback source payload invalid");
            }
            return data.slice(0, 30).map((block) => ({
                height: block.height,
                hash: block.id,
                time: block.timestamp,
                miner: block.extras?.pool?.name || "Unknown",
            }));
        };

        fetchPrimary()
            .catch((primaryErr) => {
                console.warn("Primary blocks feed failed, trying fallback:", primaryErr);
                return fetchFallback();
            })
            .then((resolvedBlocks) => {
                setBlocks(resolvedBlocks);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Unable to load blocks from primary or fallback sources.");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBlocks();
        }, 0);

        return () => {
            clearTimeout(timer);
        };
    }, [fetchBlocks]);

    const navigateToBlock = (hash: string) => {
        router.push(`/explorer/block/${hash}`);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <PageHeader
                    title="Latest Blocks"
                    subtitle="Recent blocks mined by the network."
                    icon="📦"
                />

                {/* Loading State */}
                {loading && <LoadingState message="Fetching blocks from node..." />}

                {/* Error State */}
                {!loading && error && (
                    <ErrorState
                        message={error}
                        onRetry={fetchBlocks}
                    />
                )}

                {/* Empty State */}
                {!loading && !error && blocks.length === 0 && (
                    <EmptyState
                        icon="📭"
                        title="No Blocks Found"
                        description="The node hasn't returned any blocks yet. Make sure your Bitcoin node is running and synced."
                        action={{ label: "Refresh", onClick: fetchBlocks }}
                    />
                )}

                {/* Data Display */}
                {!loading && !error && blocks.length > 0 && (
                    <>
                        {/* Mobile Card Layout */}
                        <div className="md:hidden space-y-3">
                            {blocks.map((block) => (
                                <Card
                                    key={block.hash}
                                    onClick={() => navigateToBlock(block.hash)}
                                    className="p-4"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-bold text-cyan-400 font-mono">
                                                #{block.height}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-800 rounded-full text-[10px] text-slate-400 border border-slate-700 max-w-24 truncate">
                                                {block.miner}
                                            </span>
                                        </div>
                                        <span className="text-cyan-500">→</span>
                                    </div>
                                    <CardRow
                                        label="Hash"
                                        value={`${block.hash.slice(0, 10)}...${block.hash.slice(-6)}`}
                                        mono
                                    />
                                    <CardRow
                                        label="Time"
                                        value={new Date(block.time * 1000).toLocaleTimeString()}
                                        mono
                                    />
                                </Card>
                            ))}
                        </div>

                        {/* Desktop Table Layout */}
                        <Card variant="panel" className="hidden md:block overflow-hidden p-0">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Height</th>
                                        <th className="px-6 py-3 font-medium">Hash</th>
                                        <th className="px-6 py-3 font-medium">Miner</th>
                                        <th className="px-6 py-3 font-medium text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {blocks.map((block) => (
                                        <tr
                                            key={block.hash}
                                            className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                            onClick={() => navigateToBlock(block.hash)}
                                        >
                                            <td className="px-6 py-4 font-mono text-cyan-300 group-hover:text-cyan-200">
                                                {block.height}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs opacity-70 group-hover:opacity-100">
                                                {block.hash.substring(0, 8)}...{block.hash.substring(56)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block min-w-20 px-3 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400 border border-slate-700 text-center truncate">
                                                    {block.miner}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-500 group-hover:text-slate-400">
                                                {new Date(block.time * 1000).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </>
                )}
            </div>
        </main>
    );
}
