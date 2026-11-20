"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import PageHeader from "../../../../components/PageHeader";
import Card from "../../../../components/Card";
import { Treemap, Tooltip } from "recharts";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import BlockHeaderInspector from "@/components/block/BlockHeaderInspector";
import MerkleProofPanel from "@/components/block/MerkleProofPanel";
import CoinbaseDecoder from "@/components/block/CoinbaseDecoder";
import { computeMerkleRoot } from "@/utils/merkle";
import { blockDisplayName, isHeightId, normalizeBlock, type BlockData } from "@/lib/block";

interface BlockExplorerClientProps {
    /** Block id from the route (height or hash). */
    id: string;
    /**
     * Server-fetched block. When present and matching `id`, the UI renders
     * immediately (SSR); when absent, the classic fetch-on-mount fallback
     * keeps the page working if the server could not reach the node gateway.
     */
    initialBlock: BlockData | null;
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

function blockMatchesId(block: BlockData, id: string): boolean {
    return isHeightId(id) ? String(block.height) === id : block.hash === id.toLowerCase();
}

/**
 * A block copy is "complete" when it carries every transaction the header
 * commits to. The SSR snapshot is a 10-tx sample on large blocks, so this is
 * false on first paint until the background full-list fetch lands.
 */
function isCompleteBlock(block: BlockData | null): boolean {
    return block !== null && block.transactions.length >= (block.txCount ?? 0);
}

export default function BlockExplorerClient({ id, initialBlock }: BlockExplorerClientProps) {
    const router = useRouter();
    const normalizedId = (id ?? "").trim();
    const providedMatches = initialBlock !== null && blockMatchesId(initialBlock, normalizedId);

    const [block, setBlock] = useState<BlockData | null>(providedMatches ? initialBlock : null);
    const [loading, setLoading] = useState(!providedMatches);
    const [latestHeight, setLatestHeight] = useState<number>(Infinity);
    const [computedMerkleRoot, setComputedMerkleRoot] = useState<string | null>(null);
    const [merkleError, setMerkleError] = useState<string | null>(null);
    const [isMerklePanelOpen, setMerklePanelOpen] = useState(false);
    // True once the background "full list" fetch fails (public gateway down):
    // the UI then keeps the partial copy and shows the sample-based math as-is
    // instead of pretending a complete list is still coming.
    const [fullFetchFailed, setFullFetchFailed] = useState(false);
    // Bumped by the retry button to re-run the mount fetch when the first
    // attempt could not reach the gateway at all.
    const [reloadTick, setReloadTick] = useState(0);

    // Sync the server snapshot in whenever the route (and its SSR result)
    // changes — e.g. after prev/next navigation delivers a fresh RSC render.
    // Block data is immutable per id, so an already-matching local copy wins.
    useEffect(() => {
        if (!initialBlock || !blockMatchesId(initialBlock, normalizedId)) return;
        setBlock((prev) => (prev && blockMatchesId(prev, normalizedId) ? prev : initialBlock));
        setLoading(false);
    }, [initialBlock, normalizedId]);

    const fullListPending = block !== null && !isCompleteBlock(block) && !fullFetchFailed;
    // The loaded copy is shorter than the header commits to, and we know the
    // full list will never arrive (fetch failed). Sample-based rendering stays
    // on screen, but every "needs the full list" surface says so.
    const listIncomplete = block !== null && !isCompleteBlock(block);
    const listFailed = listIncomplete && fullFetchFailed;

    useEffect(() => {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

        const fetchLatestHeight = () => {
            fetch(`${baseUrl}/api/network-stats`)
                .then(res => res.json())
                .then(data => {
                    if (data.blocks) setLatestHeight(data.blocks);
                })
                .catch(() => { });
        };

        // Fetches the complete block from the public gateway. Only replaces
        // local state when the copy is both valid and for the same block.
        const fetchFullBlock = () => {
            const isHeightLookup = isHeightId(normalizedId);
            const blockEndpoint = isHeightLookup
                ? `${baseUrl}/api/block/height/${normalizedId}`
                : `${baseUrl}/api/block/${normalizedId}`;

            return fetch(blockEndpoint)
                .then(res => {
                    if (!res.ok) throw new Error("Block not found");
                    return res.json();
                })
                .then(data => {
                    const parsed = normalizeBlock(data);
                    if (!parsed) throw new Error("Invalid block payload");
                    if (!blockMatchesId(parsed, normalizedId)) return;
                    setBlock(parsed);
                })
                .catch(err => {
                    console.error(err);
                    setFullFetchFailed(true);
                });
        };

        if (providedMatches) {
            // The server already delivered this exact block: skip the redundant
            // fetch, only refresh the "latest height" navigation signal — unless
            // the SSR copy is a partial sample, in which case quietly upgrade it
            // to the full transaction list (Merkle math + treemap need all txs).
            // A fresh SSR snapshot invalidates any earlier fetch failure.
            setFullFetchFailed(false);
            fetchLatestHeight();
            if (initialBlock && !isCompleteBlock(initialBlock)) fetchFullBlock();
            return;
        }

        setFullFetchFailed(false);
        queueMicrotask(() => setLoading(true));

        // Fetch the block
        fetchFullBlock()
            .finally(() => setLoading(false));

        // Fetch latest block height to know if Next should be disabled
        fetchLatestHeight();
    }, [normalizedId, providedMatches, initialBlock, reloadTick]);

    useEffect(() => {
        if (!block || !Array.isArray(block.transactions) || block.transactions.length === 0
            // A partial SSR sample would produce a root that cannot match the
            // header merkle commitment — wait for the full list instead of
            // computing (and displaying) a guaranteed mismatch.
            || !isCompleteBlock(block)) {
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
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                <Header />

                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse space-y-4">
                        <div className="text-4xl">⏳</div>
                        <div className="text-slate-500">Retrieving Block Data from Time Machine...</div>
                    </div>
                ) : !block ? (
                    <div className="text-center py-20 text-red-400">
                        <h1 className="text-2xl font-bold">
                            {fullFetchFailed ? "Block Unavailable" : "Block Not Found"}
                        </h1>
                        <p className="mt-2 text-slate-500">
                            {fullFetchFailed
                                ? "The node gateway could not be reached, so this block could not be loaded. Check the connection and try again."
                                : "The requested block could not be located in the local node."}
                        </p>
                        <button
                            onClick={() => {
                                setLoading(true);
                                setReloadTick((tick) => tick + 1);
                            }}
                            className="mt-4 px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
                        >
                            Retry
                        </button>
                        <button onClick={() => router.push('/')} className="mt-4 ml-2 px-4 py-2 bg-slate-800 rounded hover:bg-slate-700">Return to Home</button>
                    </div>
                ) : (
                    <>
                        {/* Standardized Header */}
                        <PageHeader
                            title={blockDisplayName(block.height)}
                            subtitle={block.hash}
                            copyText={block.hash}
                            icon="📦"
                            gradient="from-blue-400 to-indigo-500"
                            actions={
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => router.push(`/explorer/block/${block.height - 1}`)}
                                        disabled={block.height <= 0}
                                        className="px-4 py-2 min-h-11 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm transition-colors flex items-center gap-2 border border-slate-700"
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => !isLatestBlock && router.push(`/explorer/block/${block.height + 1}`)}
                                        disabled={isLatestBlock}
                                        className="px-4 py-2 min-h-11 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm transition-colors flex items-center gap-2 border border-slate-700"
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
                                loadedTxCount: block.transactions?.length ?? 0,
                                time: block.time,
                                mediantime: block.mediantime,
                                version: block.version,
                                bits: block.bits,
                                nonce: block.nonce,
                                merkleroot: block.merkleroot,
                                previousblockhash: block.previousblockhash,
                            }}
                            computedMerkleRoot={computedMerkleRoot}
                            merklePending={fullListPending}
                            merkleFailed={listFailed}
                            onOpenMerklePanel={() => setMerklePanelOpen(true)}
                        />

                        {merkleError ? (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                Merkle proof precompute warning: {merkleError}
                            </div>
                        ) : null}

                        <MerkleProofPanel
                            txids={isCompleteBlock(block)
                                ? block.transactions.map((tx) => tx.txid)
                                : []}
                            headerMerkleRoot={block.merkleroot}
                            incompleteReason={fullListPending ? "pending" : listFailed ? "failed" : undefined}
                            incompleteNote={fullListPending
                                ? `Waiting for the full transaction list (${block.txCount.toLocaleString()} tx) before building proofs.`
                                : listFailed
                                    ? `Only ${(block.transactions?.length ?? 0).toLocaleString()} of ${block.txCount.toLocaleString()} transactions are loaded, so merkle proofs cannot be verified from a partial list.`
                                    : undefined}
                            isOpen={isMerklePanelOpen}
                            onClose={() => setMerklePanelOpen(false)}
                        />

                        {block.transactions && block.transactions.length > 0 && (
                            <CoinbaseDecoder coinbaseTxid={block.coinbaseTxid ?? block.transactions[0].txid} />
                        )}

                        {/* Block DNA Visualization — needs the full list to be
                            honest, so hold the map while the upgrade is in
                            flight, and annotate it clearly when the full
                            list never arrived. */}
                        {block.transactions && block.transactions.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 inline-block">
                                    Block DNA (TreeMap)
                                </h2>

                                {fullListPending ? (
                                    <>
                                        <p className="text-slate-500 text-sm max-w-2xl">
                                            Visualizing the transaction weight distribution. Holding the map until the full list arrives — a {block.transactions.length}-tx sample would misrepresent the block.
                                        </p>
                                        <div className="h-[500px] w-full bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-2xl">
                                            <span className="text-slate-500 text-sm animate-pulse">
                                                Loading full transaction list ({(block.txCount ?? 0).toLocaleString()} tx)…
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-slate-500 text-sm max-w-2xl">
                                            {listFailed
                                                ? `Showing the first ${block.transactions.length} of ${(block.txCount ?? 0).toLocaleString()} transactions — the full list could not be loaded, so this map is a sample, not the complete block.`
                                                : "Visualizing the Top 500 transactions packed into this block. Size represents weight (vBytes). Green = SegWit, Amber = Legacy. Hover a tile to inspect transaction details."}
                                        </p>
                                        {listFailed ? (
                                            <div className="inline-block rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                                                Merkle verification and tile coverage are limited until the full transaction list is reachable.
                                            </div>
                                        ) : null}

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
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
