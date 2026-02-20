"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import PageHeader from "../../../../components/PageHeader";
import Card from "../../../../components/Card";
import { Treemap, Tooltip } from "recharts";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import BlockHeaderInspector from "@/components/block/BlockHeaderInspector";
import MerkleProofPanel from "@/components/block/MerkleProofPanel";
import { computeMerkleRoot } from "@/utils/merkle";

interface BlockData {
    hash: string;
    height: number;
    time: number;
    mediantime?: number;
    version?: number;
    bits?: string;
    nonce?: number;
    merkleroot?: string;
    previousblockhash?: string;
    size: number;
    weight: number;
    miner: string;
    txCount: number;
    reward: number;
    transactions: Array<{
        txid: string;
        wtxid?: string;
        weight: number;
        vsize: number;
        size: number;
        fee: number;
        isSegwit: boolean;
    }>;
}

interface BlockTreemapContentProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    payload?: {
        isSegwit?: boolean;
    };
}

function BlockTreemapContent(props: BlockTreemapContentProps) {
    const { x = 0, y = 0, width = 0, height = 0, payload } = props;
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: payload?.isSegwit ? "#10b981" : "#f59e0b",
                    stroke: "#1e293b",
                    strokeWidth: 1,
                    userSelect: "none",
                    opacity: 0.9,
                }}
            />
        </g>
    );
}

export default function BlockPage() {
    const { id } = useParams();
    const router = useRouter();
    const [block, setBlock] = useState<BlockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [latestHeight, setLatestHeight] = useState<number>(Infinity);
    const [computedMerkleRoot, setComputedMerkleRoot] = useState<string | null>(null);
    const [merkleError, setMerkleError] = useState<string | null>(null);
    const [isMerklePanelOpen, setMerklePanelOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        queueMicrotask(() => setLoading(true));

        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
        const rawId = Array.isArray(id) ? id[0] : id;
        const normalizedId = String(rawId ?? "").trim();
        const isHeightLookup = /^[0-9]+$/.test(normalizedId);
        const blockEndpoint = isHeightLookup
            ? `${baseUrl}/api/block/height/${normalizedId}`
            : `${baseUrl}/api/block/${normalizedId}`;

        // Fetch the block
        fetch(blockEndpoint)
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

    useEffect(() => {
        if (!block || !Array.isArray(block.transactions) || block.transactions.length === 0) {
            queueMicrotask(() => {
                setComputedMerkleRoot(null);
                setMerkleError(null);
            });
            return;
        }

        const txids = block.transactions
            .map((tx) => String(tx.txid ?? "").trim())
            .filter((txid) => txid.length === 64);

        if (txids.length === 0) {
            queueMicrotask(() => {
                setComputedMerkleRoot(null);
                setMerkleError("No valid txids available to build merkle tree.");
            });
            return;
        }

        let cancelled = false;
        computeMerkleRoot(txids)
            .then((root) => {
                if (cancelled) return;
                setComputedMerkleRoot(root);
                setMerkleError(null);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setComputedMerkleRoot(null);
                setMerkleError(err instanceof Error ? err.message : "Failed to compute merkle root.");
            });

        return () => {
            cancelled = true;
        };
    }, [block]);

    const formatSize = (bytes: number) => {
        if (bytes > 1000000) return (bytes / 1000000).toFixed(2) + " MB";
        return (bytes / 1000).toFixed(2) + " KB";
    };

    // Check if we're at the latest block
    const isLatestBlock = block ? block.height >= latestHeight : false;

    // Prepare TreeMap Data
    const treeMapData = useMemo(() => {
        if (!block) return [];
        return [
            {
                name: "Transactions",
                children: (block.transactions || []).slice(0, 500).map((tx, i) => ({
                    // Keep Recharts node names unique to avoid duplicate-key collisions.
                    name: `${tx.txid}-${i}`,
                    txid: tx.txid,
                    size: tx.weight, // Rect size = weight
                    fee: tx.fee, // For tooltip
                    isSegwit: tx.isSegwit,
                })),
            },
        ];
    }, [block]);

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
                            copyText={block.hash}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-2">
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
                                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Coinbase Payout (Subsidy + Fees)</div>
                                    <div className="text-emerald-400 font-mono font-bold text-sm">{(block.reward ?? 0).toFixed(8)} BTC</div>
                                </div>
                            </div>
                        </Card>

                        <BlockHeaderInspector
                            header={{
                                hash: block.hash,
                                height: block.height,
                                txCount: block.txCount ?? block.transactions?.length ?? 0,
                                time: block.time,
                                mediantime: block.mediantime,
                                version: block.version,
                                bits: block.bits,
                                nonce: block.nonce,
                                merkleroot: block.merkleroot,
                                previousblockhash: block.previousblockhash,
                            }}
                            computedMerkleRoot={computedMerkleRoot}
                            onOpenMerklePanel={() => setMerklePanelOpen(true)}
                        />

                        {merkleError ? (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                Merkle proof precompute warning: {merkleError}
                            </div>
                        ) : null}

                        <MerkleProofPanel
                            txids={block.transactions.map((tx) => tx.txid)}
                            headerMerkleRoot={block.merkleroot}
                            isOpen={isMerklePanelOpen}
                            onClose={() => setMerklePanelOpen(false)}
                        />

                        {/* Block DNA Visualization */}
                        {block.transactions && block.transactions.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 inline-block">
                                    Block DNA (TreeMap)
                                </h2>
                                <p className="text-slate-500 text-sm max-w-2xl">
                                    Visualizing the Top 500 transactions packed into this block. Size represents weight (vBytes).
                                    Green = SegWit, Amber = Legacy. Hover a tile to inspect transaction details.
                                </p>

                                <div className="h-[500px] w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                                    <SafeResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={treeMapData}
                                            dataKey="size"
                                            aspectRatio={4 / 3}
                                            stroke="#1e293b"
                                            content={<BlockTreemapContent />}
                                        >
                                            <Tooltip
                                                cursor={{
                                                    stroke: "#22d3ee",
                                                    strokeWidth: 2,
                                                    fillOpacity: 0.96,
                                                }}
                                                content={({ payload }) => {
                                                    if (!payload || !payload.length) return null;
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                                                            <div className="font-mono text-slate-300 mb-1">TXID: {data.txid ?? data.name}</div>
                                                            <div className="text-slate-400">Weight: <span className="text-white">{data.size} wu</span></div>
                                                            <div className="text-slate-400">Type: <span className={data.isSegwit ? "text-emerald-400" : "text-amber-400"}>{data.isSegwit ? "SegWit (Efficient)" : "Legacy (Heavy)"}</span></div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </Treemap>
                                    </SafeResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
