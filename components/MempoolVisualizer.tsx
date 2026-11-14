"use client";

import { useEffect, useState } from 'react';
import { Treemap, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { useTranslation } from "@/lib/i18n";
import { track } from "@/lib/analytics/track";
import ProvenanceBadge from "./ProvenanceBadge";

interface BlockTransaction {
    [key: string]: unknown;
    txid: string;
    weight: number;
    fee: number;
    feeRate: number;
    value: number;
    isSegwit?: boolean;
}

interface BlockTemplate {
    height: number;
    totalWeight: number;
    totalFees: number;
    transactions: BlockTransaction[];
}

type VisualizationMode = 'treemap' | 'stream';
type CandidateSnapshot = { block: BlockTemplate; observedAt: number | null };
const candidateEndpoint = (process.env.NEXT_PUBLIC_API_URL?.trim() || "https://apigoland.rawblock.net").replace(/\/$/, "") + "/api/candidate-block";
const candidateDeadlineMs = 4500;
const candidatePollMs = 15_000;

function validBlockTransaction(value: unknown): value is BlockTransaction {
    if (value === null || typeof value !== "object") return false;
    const transaction = value as Partial<BlockTransaction>;
    return typeof transaction.txid === "string" && /^[a-f0-9]{64}$/i.test(transaction.txid) &&
        [transaction.weight, transaction.fee, transaction.feeRate, transaction.value].every(
            (number) => typeof number === "number" && Number.isFinite(number) && number >= 0,
        );
}

// Treemap Custom Content
const TreemapContent = (props: { x?: number, y?: number, width?: number, height?: number, payload?: { feeRate?: number } }) => {
    const { x = 0, y = 0, width = 0, height = 0, payload } = props;
    const feeRate = payload?.feeRate || 1;

    let color = "#1e293b";
    if (feeRate > 150) color = "#f472b6";      // Pink-400
    else if (feeRate > 100) color = "#e879f9"; // Fuchsia-400
    else if (feeRate > 50) color = "#c084fc";  // Purple-400
    else if (feeRate > 25) color = "#818cf8";  // Indigo-400
    else if (feeRate > 10) color = "#60a5fa";  // Blue-400
    else if (feeRate > 5) color = "#38bdf8";   // Sky-400
    else color = "#334155";

    if (width < 2 || height < 2) return null;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: color,
                    stroke: "#020617",
                    strokeWidth: 1,
                    strokeOpacity: 0.5,
                }}
            />
        </g>
    );
};

// Stream Graph View
const StreamView = ({ transactions }: { transactions: BlockTransaction[] }) => {
    // Group by fee tiers
    const tiers = [
        { min: 150, max: 999999, color: '#f472b6', label: 'Ultra Priority (>150 sat/vB)' },
        { min: 50, max: 150, color: '#c084fc', label: 'High Priority (50-150)' },
        { min: 10, max: 50, color: '#60a5fa', label: 'Medium (10-50)' },
        { min: 0, max: 10, color: '#334155', label: 'Low (<10)' },
    ];

    const tierCounts = tiers.map(tier => ({
        ...tier,
        count: transactions.filter(tx => tx.feeRate >= tier.min && tx.feeRate < tier.max).length
    }));

    const total = tierCounts.reduce((sum, t) => sum + t.count, 0);

    return (
        <div className="w-full h-96 bg-slate-950 rounded-xl border border-slate-800 p-6">
            <div className="h-full flex flex-col justify-end gap-2">
                {tierCounts.map((tier, i) => {
                    const height = total > 0 ? (tier.count / total) * 100 : 0;
                    return (
                        <motion.div
                            key={i}
                            className="rounded-lg flex items-center justify-between px-4 text-white text-sm font-mono"
                            style={{ backgroundColor: tier.color, height: `${Math.max(height, 10)}%`, minHeight: '50px' }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <span>{tier.label}</span>
                            <span className="font-bold">{tier.count} txs</span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default function MempoolVisualizer() {
    const { t } = useTranslation();
    const [snapshot, setSnapshot] = useState<CandidateSnapshot | null>(null);
    const [phase, setPhase] = useState<"loading" | "ready" | "failed">("loading");
    const [retry, setRetry] = useState(0);
    const [mode, setMode] = useState<VisualizationMode>('treemap');

    useEffect(() => {
        let disposed = false;
        let request: AbortController | undefined;
        let poll: ReturnType<typeof setTimeout> | undefined;
        let recordedReady = false;
        let recordedFailure = false;
        const startedAt = performance.now();

        async function fetchBlock() {
            const active = new AbortController();
            request = active;
            const deadline = setTimeout(() => active.abort(), candidateDeadlineMs);
            try {
                const response = await fetch(candidateEndpoint, { signal: active.signal, cache: "no-store" });
                if (!response.ok) throw new Error("Candidate block request failed");
                const block: BlockTemplate | null = await response.json();
                if (!block || !Number.isSafeInteger(block.height) || block.height < 0 ||
                    !Number.isFinite(block.totalFees) || block.totalFees < 0 ||
                    !Array.isArray(block.transactions) || !block.transactions.every(validBlockTransaction)) {
                    throw new Error("Invalid candidate block");
                }
                if (disposed) return;
                const time = Date.parse(response.headers.get("X-RawBlock-Updated-At") ?? "");
                const observedAt = response.headers.get("X-RawBlock-Data-Source") === "local_node" &&
                    Number.isFinite(time) && time <= Date.now() + 5000 ? time : null;
                setSnapshot({ block, observedAt });
                setPhase("ready");
                if (!recordedReady) {
                    track({
                        name: "explorer_data_timing",
                        properties: {
                            tool: "candidate-block",
                            phase: "candidate_ready",
                            source: "api",
                            duration_ms: Math.round(performance.now() - startedAt),
                            ...(observedAt !== null ? { age_ms: Math.max(0, Date.now() - observedAt) } : {}),
                        },
                    });
                    recordedReady = true;
                }
            } catch {
                if (disposed) return;
                setPhase("failed");
                if (!recordedFailure) {
                    track({
                        name: "explorer_data_failed",
                        properties: {
                            tool: "candidate-block",
                            error_type: active.signal.aborted ? "timeout" : "request_failed",
                            duration_ms: Math.round(performance.now() - startedAt),
                        },
                    });
                    recordedFailure = true;
                }
            } finally {
                clearTimeout(deadline);
                if (!disposed) poll = setTimeout(fetchBlock, candidatePollMs);
            }
        }

        void fetchBlock();
        return () => {
            disposed = true;
            clearTimeout(poll);
            request?.abort();
        };
    }, [retry]);

    if (!snapshot && phase === "loading") {
        return (
            <div data-testid="candidate-block-panel" role="status" className="h-96 animate-pulse bg-slate-900/30 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-sm">
                {t.mempool.candidateLoading}
            </div>
        );
    }

    if (!snapshot) {
        return (
            <div data-testid="candidate-block-panel" className="h-96 rounded-xl border border-red-500/20 bg-slate-900/30 p-6 flex flex-col items-center justify-center gap-3 text-center">
                <p role="status" className="text-sm font-mono text-red-300">{t.mempool.candidateUnavailable}</p>
                <button
                    type="button"
                    onClick={() => {
                        setPhase("loading");
                        setRetry((attempt) => attempt + 1);
                    }}
                    className="min-h-11 rounded border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs text-red-100 hover:bg-red-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                >
                    {t.mempool.retry}
                </button>
            </div>
        );
    }

    const { block: data, observedAt } = snapshot;
    const vizData = data.transactions.slice(0, 500).map((tx, index) => ({
        ...tx,
        // Recharts treemap internally derives node keys from coordinates + name.
        // Ensure name is always present and unique to avoid duplicate-key render errors.
        name: tx.txid ? `${tx.txid}-${index}` : `tx-${index}`,
    }));

    const modes = [
        { id: 'treemap' as VisualizationMode, icon: '🧱', label: 'TreeMap' },
        { id: 'stream' as VisualizationMode, icon: '🌊', label: 'Stream' },
    ];

    return (
        <div data-testid="candidate-block-panel" className="space-y-4">
            {phase === "failed" ? (
                <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {t.mempool.candidateLastKnown}
                </div>
            ) : null}

            {/* Header with Mode Switcher */}
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2 text-lg">
                        {t.mempool.visualization}
                    </h3>
                    <ProvenanceBadge
                        source={observedAt === null ? "Unverified Source" : "Cached Snapshot"}
                        timestamp={observedAt === null ? undefined : new Date(observedAt).toLocaleTimeString()}
                    />
                </div>

                {/* Mode Switcher */}
                <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    {modes.map(m => (
                        <button
                            key={m.id}
                            type="button"
                            aria-label={m.label}
                            aria-pressed={mode === m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex items-center justify-center gap-2 px-3 py-2 min-h-11 min-w-11 rounded-md text-xs font-bold transition-all ${mode === m.id
                                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/50'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                        >
                            <span>{m.icon}</span>
                            <span className="hidden sm:inline">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 text-xs font-mono bg-slate-900/50 px-4 py-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">{t.mempool.height}</span>
                    <span className="text-cyan-400 font-bold">{data.height.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">{t.mempool.txs}</span>
                    <span className="text-purple-400 font-bold">{vizData.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">{t.mempool.totalFees}</span>
                    <span className="text-emerald-400 font-bold">{(data.totalFees / 100000000).toFixed(4)} BTC</span>
                </div>
            </div>

            {/* Visualization Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {mode === 'treemap' && (
                        <div className="w-full h-96 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                            <SafeResponsiveContainer width="100%" height="100%" minHeight={300}>
                                <Treemap
                                    data={vizData}
                                    dataKey="value"
                                    stroke="#020617"
                                    fill="#1e293b"
                                    content={<TreemapContent />}
                                >
                                    <Tooltip content={({ active, payload }) => {
                                        if (active && payload && payload[0]) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono shadow-xl">
                                                    <p className="text-cyan-400 mb-1 truncate max-w-xs">{data.txid}</p>
                                                    <p className="text-slate-300">Fee Rate: <span className="text-purple-400 font-bold">{(data.feeRate || 0).toFixed(2)} sat/vB</span></p>
                                                    <p className="text-slate-300">Weight: <span className="text-blue-400 font-bold">{data.weight.toLocaleString()}</span></p>
                                                    <p className="text-slate-300">Fee: <span className="text-emerald-400 font-bold">{(data.fee / 100000000).toFixed(8)} BTC</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                </Treemap>
                            </SafeResponsiveContainer>
                        </div>
                    )}
                    {mode === 'stream' && <StreamView transactions={vizData} />}
                </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="flex justify-center gap-4 text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-pink-400"></div> &gt;150 sat/vB</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-400"></div> 50-150</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-400"></div> 10-50</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-600"></div> &lt;10</div>
            </div>
        </div>
    );
}
