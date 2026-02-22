"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Card, { CardRow, MetricValue } from "../../../components/Card";
import EmptyState, { LoadingState, ErrorState } from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import { useTranslation } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface BlockInfo {
    height: number;
    hash: string;
    time: number;
    miner: string;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
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

const MINER_TONE_CLASSES = [
    "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
    "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
    "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/25",
    "bg-amber-500/10 text-amber-300 border-amber-500/25",
];
const TARGET_BLOCK_INTERVAL_SECONDS = 10 * 60;

const formatHashCompact = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-8)}`;

const formatAge = (seconds: number, t?: { justNow: string; agoSeconds: string; agoMinutes: string; agoHours: string; agoDays: string }) => {
    if (seconds < 10) return t?.justNow ?? "just now";
    if (seconds < 60) return (t?.agoSeconds ?? "{0}s ago").replace("{0}", String(seconds));
    if (seconds < 3600) return (t?.agoMinutes ?? "{0}m ago").replace("{0}", String(Math.floor(seconds / 60)));
    if (seconds < 86400) return (t?.agoHours ?? "{0}h ago").replace("{0}", String(Math.floor(seconds / 3600)));
    return (t?.agoDays ?? "{0}d ago").replace("{0}", String(Math.floor(seconds / 86400)));
};

const pickMinerTone = (miner: string) => {
    if (!miner) return MINER_TONE_CLASSES[0];
    let hash = 0;
    for (let i = 0; i < miner.length; i += 1) {
        hash = (hash << 5) - hash + miner.charCodeAt(i);
        hash |= 0;
    }
    return MINER_TONE_CLASSES[Math.abs(hash) % MINER_TONE_CLASSES.length];
};

export default function BlocksIndexPage() {
    const router = useRouter();
    const [blocks, setBlocks] = useState<BlockInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nowMs, setNowMs] = useState(() => Date.now());
    const { t } = useTranslation();

    const orderedBlocks = useMemo(() => {
        const dedupByHeight = new Map<number, BlockInfo>();
        for (const block of blocks) {
            if (!dedupByHeight.has(block.height)) {
                dedupByHeight.set(block.height, block);
            }
        }
        return Array.from(dedupByHeight.values()).sort((a, b) => b.height - a.height);
    }, [blocks]);

    const timelineSecondsByHash = useMemo(() => {
        const timeline: Record<string, number> = {};
        const tip = orderedBlocks[0];
        if (!tip) return timeline;
        const nowSec = Math.floor(nowMs / 1000);
        const tipAnchorSec = Math.min(nowSec, tip.time);

        orderedBlocks.forEach((block) => {
            const blocksBehind = Math.max(0, tip.height - block.height);
            timeline[block.hash] = tipAnchorSec - blocksBehind * TARGET_BLOCK_INTERVAL_SECONDS;
        });

        return timeline;
    }, [orderedBlocks, nowMs]);

    const displayAgeSecondsByHash = useMemo(() => {
        const ages: Record<string, number> = {};
        const nowSec = Math.floor(nowMs / 1000);

        orderedBlocks.forEach((block) => {
            const timelineSec = timelineSecondsByHash[block.hash] ?? block.time;
            ages[block.hash] = Math.max(0, nowSec - timelineSec);
        });

        return ages;
    }, [orderedBlocks, timelineSecondsByHash, nowMs]);

    const fetchBlocks = useCallback((silent = false) => {
        if (!silent) {
            setLoading(true);
            setError(null);
        }

        const fetchPrimary = async (): Promise<BlockInfo[]> => {
            const res = await fetch(`${API_BASE_URL}/api/miners`, { cache: "no-store" });
            if (!res.ok) throw new Error(`Primary source HTTP ${res.status}`);
            const data = await res.json();
            if (!Array.isArray(data?.blocks)) {
                throw new Error("Primary source payload missing blocks");
            }
            return data.blocks as BlockInfo[];
        };

        const fetchFallback = async (): Promise<BlockInfo[]> => {
            const res = await fetch(MEMPOOL_BLOCKS_URL, { cache: "no-store" });
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
            fetchBlocks(false);
        }, 0);
        const interval = setInterval(() => {
            fetchBlocks(true);
        }, 15000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [fetchBlocks]);

    useEffect(() => {
        const ageTicker = setInterval(() => setNowMs(Date.now()), 30000);
        return () => clearInterval(ageTicker);
    }, []);

    const navigateToBlock = (hash: string) => {
        router.push(`/explorer/block/${hash}`);
    };

    const insights = useMemo(() => {
        if (orderedBlocks.length === 0) return null;

        const latest = orderedBlocks[0];
        const nowSec = Math.floor(nowMs / 1000);
        const tipTimelineSec = timelineSecondsByHash[latest.hash] ?? latest.time;
        const uniqueMiners = new Set(orderedBlocks.map((block) => block.miner || "Unknown")).size;
        const oldest = orderedBlocks[orderedBlocks.length - 1];
        const sampleSpanMin = Math.max(1, Math.round((latest.time - oldest.time) / 60));
        const latestAgeSec = Math.max(0, nowSec - tipTimelineSec);

        return {
            latestHeight: latest.height,
            latestAgeSec,
            uniqueMiners,
            sampleSpanMin,
        };
    }, [orderedBlocks, timelineSecondsByHash, nowMs]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <PageHeader
                    title={t.blocks.title}
                    subtitle={t.blocks.subtitle}
                    icon="📦"
                    gradient="from-cyan-300 via-blue-400 to-indigo-500"
                    actions={(
                        <button
                            onClick={() => fetchBlocks(false)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
                        >
                            <span className="text-base">↻</span>
                            {t.blocks.refreshFeed}
                        </button>
                    )}
                />

                {/* Loading State */}
                {loading && <LoadingState message={t.blocks.connectingToBlockFeed} />}

                {/* Error State */}
                {!loading && error && (
                    <ErrorState
                        message={error}
                        onRetry={fetchBlocks}
                    />
                )}

                {/* Empty State */}
                {!loading && !error && orderedBlocks.length === 0 && (
                    <EmptyState
                        icon="📭"
                        title={t.blocks.noBlocksFound}
                        description={t.blocks.noBlocksDescription}
                        action={{ label: t.blocks.refresh, onClick: fetchBlocks }}
                    />
                )}

                {/* Data Display */}
                {!loading && !error && orderedBlocks.length > 0 && (
                    <>
                        <Card
                            variant="panel"
                            hoverable={false}
                            className="border-cyan-500/20 bg-gradient-to-r from-cyan-950/35 via-slate-900 to-indigo-950/25"
                        >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">{t.blocks.feedStatus}</p>
                                    <p className="mt-1 text-sm text-slate-300">
                                        {t.blocks.realTimeStream}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                                        {t.blocks.localBackend}
                                    </span>
                                    <span className="rounded-full border border-slate-600 bg-slate-800/70 px-3 py-1 text-[11px] font-semibold text-slate-300">
                                        {t.blocks.blockWindow}
                                    </span>
                                    {insights && (
                                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                                            {t.blocks.lastBlock} {formatAge(insights.latestAgeSec, t.common)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {insights && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <Card variant="metric" accent="cyan">
                                    <MetricValue
                                        icon="🧱"
                                        value={`#${insights.latestHeight.toLocaleString()}`}
                                        label={t.blocks.latestHeight}
                                        sublabel={t.blocks.freshChainTip}
                                        accent="cyan"
                                    />
                                </Card>
                                <Card variant="metric" accent="violet">
                                    <MetricValue
                                        icon="⏱"
                                        value="10m"
                                        label={t.blocks.protocolCadence}
                                        sublabel={t.blocks.targetInterval}
                                        accent="violet"
                                    />
                                </Card>
                                <Card variant="metric" accent="emerald">
                                    <MetricValue
                                        icon="⛏️"
                                        value={insights.uniqueMiners}
                                        label={t.blocks.activeMiners}
                                        sublabel={t.blocks.minObservationSpan.replace("{0}", String(insights.sampleSpanMin))}
                                        accent="emerald"
                                    />
                                </Card>
                                <Card variant="metric" accent="blue">
                                    <MetricValue
                                        icon="🛰️"
                                        value={formatAge(insights.latestAgeSec, t.common)}
                                        label={t.blocks.tipFreshness}
                                        sublabel={t.blocks.updatesEvery15s}
                                        accent="blue"
                                    />
                                </Card>
                            </div>
                        )}

                        {/* Mobile Card Layout */}
                        <div className="md:hidden space-y-3">
                            {orderedBlocks.map((block) => (
                                <Card
                                    key={block.hash}
                                    onClick={() => navigateToBlock(block.hash)}
                                    className="p-4 border-slate-700/70 hover:border-cyan-500/40"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xl font-extrabold text-cyan-300">
                                                #{block.height.toLocaleString()}
                                            </span>
                                            <span className={`max-w-28 truncate rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${pickMinerTone(block.miner)}`}>
                                                {block.miner}
                                            </span>
                                        </div>
                                        <span className="text-sm text-cyan-500">{formatAge(displayAgeSecondsByHash[block.hash] ?? Math.max(0, Math.floor(nowMs / 1000 - block.time)), t.common)}</span>
                                    </div>
                                    <CardRow
                                        label={t.blocks.hash}
                                        value={formatHashCompact(block.hash)}
                                        mono
                                    />
                                    <CardRow
                                        label={t.blocks.timeline}
                                        value={new Date((timelineSecondsByHash[block.hash] ?? block.time) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                        mono
                                    />
                                </Card>
                            ))}
                        </div>

                        {/* Desktop Table Layout */}
                        <Card variant="panel" className="hidden overflow-hidden border-slate-700/80 p-0 md:block">
                            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-4">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">{t.blocks.recentBlocksLedger}</h3>
                                    <p className="mt-1 text-xs text-slate-500">{t.blocks.recentBlocksDescription}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-mono text-slate-300">
                                    {orderedBlocks.length} {t.blocks.entries}
                                </span>
                            </div>

                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">{t.blocks.height}</th>
                                        <th className="px-6 py-3 font-medium">{t.blocks.hash}</th>
                                        <th className="px-6 py-3 font-medium">{t.blocks.miner}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t.blocks.headerAge}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t.blocks.timeline}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/70">
                                    {orderedBlocks.map((block) => (
                                        <tr
                                            key={block.hash}
                                            className="group cursor-pointer transition-colors hover:bg-cyan-500/5"
                                            onClick={() => navigateToBlock(block.hash)}
                                            tabIndex={0}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    navigateToBlock(block.hash);
                                                }
                                            }}
                                        >
                                            <td className="px-6 py-4 font-mono font-semibold text-cyan-300 group-hover:text-cyan-200">
                                                #{block.height.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-slate-200">
                                                {formatHashCompact(block.hash)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block min-w-24 max-w-44 truncate rounded-full border px-3 py-1 text-[11px] font-semibold ${pickMinerTone(block.miner)}`}>
                                                    {block.miner}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-cyan-400/90">
                                                {formatAge(displayAgeSecondsByHash[block.hash] ?? Math.max(0, Math.floor(nowMs / 1000 - block.time)), t.common)}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right font-mono text-slate-500 group-hover:text-slate-300"
                                                title={`Node header time: ${new Date(block.time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
                                            >
                                                {new Date((timelineSecondsByHash[block.hash] ?? block.time) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="border-t border-slate-800 bg-slate-900/40 px-6 py-2 text-right text-[11px] text-slate-500">
                                {t.blocks.timelineFooter}
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </main>
    );
}
