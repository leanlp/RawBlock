'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../../../components/Header';
import CopyButton from '../../../../components/CopyButton';
import { useTranslation } from '@/lib/i18n';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

interface UTXO {
    txid: string;
    vout: number;
    value: number;
    valueBtc: number;
    blockHeight: number | null;
}

interface WhaleData {
    rank: number;
    address: string;
    balance: number;
    utxoCount: number;
    fetchedAt: string;
    scanHeight?: number;
    scanDurationSeconds?: number;
    utxos: UTXO[];
}

const toFiniteNumber = (value: unknown, fallback = 0): number => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeUtxo = (value: unknown): UTXO => {
    const candidate = (value ?? {}) as Partial<UTXO>;
    return {
        txid: typeof candidate.txid === "string" ? candidate.txid : "",
        vout: Math.max(0, Math.floor(toFiniteNumber(candidate.vout, 0))),
        value: toFiniteNumber(candidate.value, 0),
        valueBtc: toFiniteNumber(candidate.valueBtc, 0),
        blockHeight: candidate.blockHeight == null ? null : Math.max(0, Math.floor(toFiniteNumber(candidate.blockHeight, 0))),
    };
};

const normalizeWhale = (value: unknown): WhaleData => {
    const candidate = (value ?? {}) as Partial<WhaleData>;
    const rawUtxos = Array.isArray(candidate.utxos) ? candidate.utxos : [];
    return {
        rank: Math.max(1, Math.floor(toFiniteNumber(candidate.rank, 1))),
        address: typeof candidate.address === "string" ? candidate.address : "",
        balance: toFiniteNumber(candidate.balance, 0),
        utxoCount: Math.max(0, Math.floor(toFiniteNumber(candidate.utxoCount, 0))),
        fetchedAt: typeof candidate.fetchedAt === "string" ? candidate.fetchedAt : "",
        scanHeight: candidate.scanHeight == null ? undefined : Math.max(0, Math.floor(toFiniteNumber(candidate.scanHeight, 0))),
        scanDurationSeconds: candidate.scanDurationSeconds == null ? undefined : toFiniteNumber(candidate.scanDurationSeconds, 0),
        utxos: rawUtxos.map(normalizeUtxo),
    };
};

export default function WhaleDetailPage() {
    const { t } = useTranslation();
    const params = useParams();
    const rank = parseInt((params.rank as string) || "", 10);
    const [showAllUtxos, setShowAllUtxos] = useState(false);
    const [whale, setWhale] = useState<WhaleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!Number.isFinite(rank) || rank <= 0) {
            setError(t.richListDetail.invalidRank);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const fetchWhale = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`${API_URL}/api/rich-list/${rank}`, { cache: "no-store", signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const data = (await res.json()) as unknown;
                setWhale(normalizeWhale(data));
            } catch (err) {
                if ((err as Error).name === "AbortError") return;
                console.error("Failed to load whale detail:", err);
                setError(t.richListDetail.loadError);
            } finally {
                setLoading(false);
            }
        };

        fetchWhale();
        return () => controller.abort();
    }, [rank, t.richListDetail.invalidRank, t.richListDetail.loadError]);

    // UTXO Distribution by Value
    const utxoDistribution = useMemo(() => {
        if (!whale?.utxos) return [];

        const ranges = [
            { label: '< 0.001', min: 0, max: 0.001, count: 0, total: 0, color: 'from-red-500 to-red-400' },
            { label: '0.001 - 0.1', min: 0.001, max: 0.1, count: 0, total: 0, color: 'from-orange-500 to-orange-400' },
            { label: '0.1 - 1', min: 0.1, max: 1, count: 0, total: 0, color: 'from-yellow-500 to-yellow-400' },
            { label: '1 - 10', min: 1, max: 10, count: 0, total: 0, color: 'from-green-500 to-green-400' },
            { label: '10 - 100', min: 10, max: 100, count: 0, total: 0, color: 'from-teal-500 to-teal-400' },
            { label: '100 - 1K', min: 100, max: 1000, count: 0, total: 0, color: 'from-cyan-500 to-cyan-400' },
            { label: '1K - 10K', min: 1000, max: 10000, count: 0, total: 0, color: 'from-blue-500 to-blue-400' },
            { label: '> 10K', min: 10000, max: Infinity, count: 0, total: 0, color: 'from-purple-500 to-purple-400' },
        ];

        (whale.utxos as UTXO[]).forEach((utxo) => {
            for (const range of ranges) {
                if (utxo.valueBtc >= range.min && utxo.valueBtc < range.max) {
                    range.count++;
                    range.total += utxo.valueBtc;
                    break;
                }
            }
        });

        return ranges.filter(r => r.count > 0);
    }, [whale]);

    // Timeline Chart - UTXOs by Block Height (Dynamic Binning)
    const timelineData = useMemo(() => {
        if (!whale?.utxos) return [];

        const utxosWithHeight = (whale.utxos as UTXO[])
            .filter(u => u.blockHeight !== null)
            .sort((a, b) => (a.blockHeight || 0) - (b.blockHeight || 0));

        if (utxosWithHeight.length === 0) return [];

        const minHeight = utxosWithHeight[0].blockHeight || 0;
        const maxHeight = utxosWithHeight[utxosWithHeight.length - 1].blockHeight || 0;

        // Dynamic binning: Aim for ~30 bins, but ensure bin size is at least 1
        const range = Math.max(maxHeight - minHeight, 1);
        const binCount = Math.min(30, range);
        const binSize = Math.max(1, Math.ceil(range / binCount));

        // Pre-fill bins to ensure smooth X-axis including gaps
        const bins: { [key: number]: { count: number; totalBtc: number; minBlock: number; maxBlock: number } } = {};

        // Initialize bins
        for (let i = 0; i < binCount; i++) {
            const start = minHeight + (i * binSize);
            const end = Math.min(start + binSize - 1, maxHeight);
            // Use range start as key for sorting
            bins[start] = { count: 0, totalBtc: 0, minBlock: start, maxBlock: end };
        }

        // Fill data
        utxosWithHeight.forEach(utxo => {
            const blockHeight = utxo.blockHeight || 0;
            // Find appropriate bin
            const binStart = minHeight + (Math.floor((blockHeight - minHeight) / binSize) * binSize);
            // Handle edge case where max values might spill over due to math rounding
            if (bins[binStart]) {
                bins[binStart].count++;
                bins[binStart].totalBtc += utxo.valueBtc;
            } else {
                // Fallback to closest bin if exact match fails
                const closest = Object.keys(bins).reduce((prev, curr) =>
                    Math.abs(parseInt(curr) - blockHeight) < Math.abs(parseInt(prev) - blockHeight) ? curr : prev
                );
                if (bins[parseInt(closest)]) {
                    bins[parseInt(closest)].count++;
                    bins[parseInt(closest)].totalBtc += utxo.valueBtc;
                }
            }
        });

        return Object.values(bins).sort((a, b) => a.minBlock - b.minBlock);
    }, [whale]);

    const displayedUtxos = showAllUtxos ? whale?.utxos : (whale?.utxos as UTXO[])?.slice(0, 20);
    const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 1);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
                <div className="max-w-4xl mx-auto">
                    <div className="md:hidden">
                        <Header />
                    </div>
                    <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
                        {t.richListDetail.loading}
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
                <div className="max-w-4xl mx-auto">
                    <div className="md:hidden">
                        <Header />
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8 text-center">
                        <div className="text-red-400 text-lg mb-4">{error}</div>
                        <Link href="/explorer/rich-list" className="text-cyan-400 hover:underline inline-flex items-center min-h-11">
                            {t.richListDetail.backToWhaleWatch}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (!whale) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
                <div className="max-w-4xl mx-auto">
                    <div className="md:hidden">
                        <Header />
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8 text-center">
                        <div className="text-red-400 text-lg mb-4">{t.richListDetail.notFound.replace("{0}", String(rank))}</div>
                        <Link href="/explorer/rich-list" className="text-cyan-400 hover:underline inline-flex items-center min-h-11">
                            {t.richListDetail.backToWhaleWatch}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="md:hidden">
                    <Header />
                </div>
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="page-header">
                        <h1 className="page-title bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                            {t.richListDetail.title.replace("{0}", String(whale.rank))}
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm font-mono break-all">
                            {whale.address}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <CopyButton text={whale.address} label={t.richListDetail.copyAddress} className="bg-slate-900/60" />
                            <Link
                                href={`/explorer/decoder?query=${encodeURIComponent(whale.address)}`}
                                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-bold text-cyan-300 hover:border-cyan-500/50 hover:text-cyan-200"
                            >
                                {t.richList.openInDecoder}
                            </Link>
                        </div>
                    </div>
                    <Link href="/explorer/rich-list" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors whitespace-nowrap inline-flex items-center min-h-11">
                        {t.richListDetail.backToWhaleWatch}
                    </Link>
                </div>

                {/* Stats Cards - Fixed Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 md:p-5">
                        <div className="text-2xl md:text-3xl font-bold text-amber-400 truncate">
                            {whale.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase mt-1">{t.richListDetail.balanceBtc}</div>
                    </div>
                    <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-4 md:p-5">
                        <div className="text-2xl md:text-3xl font-bold text-cyan-400">
                            {whale.utxoCount.toLocaleString()}
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase mt-1">{t.richList.utxos}</div>
                    </div>
                    <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 md:p-5">
                        <div className="text-2xl md:text-3xl font-bold text-purple-400">
                            {whale.scanHeight?.toLocaleString() || '—'}
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase mt-1">{t.richListDetail.scanHeight}</div>
                    </div>
                    <div className="bg-slate-900 border border-green-500/40 rounded-xl p-4 md:p-5">
                        <div className="text-2xl md:text-3xl font-bold text-green-400">
                            {whale.scanDurationSeconds?.toFixed(1) || '—'}s
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase mt-1">{t.richListDetail.scanTime}</div>
                    </div>
                </div>

                {/* Timeline Chart - UTXOs by Block Height */}
                {timelineData.length > 0 && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-300">📈 {t.richListDetail.timelineTitle}</h2>
                            <div className="text-xs text-slate-500">
                                {t.richListDetail.range}: {timelineData[0].minBlock} - {timelineData[timelineData.length - 1].maxBlock}
                            </div>
                        </div>

                        <div className="flex items-end gap-1 h-40 md:h-48 w-full">
                            {timelineData.map((data, idx) => {
                                // Enhanced logic: ensuring even small counts are visible (min height 4%)
                                const heightPercent = Math.max((data.count / maxTimelineCount) * 100, 4);
                                // Opacity logic: if count is 0, make it very faint just as a placeholder
                                const isEmpty = data.count === 0;

                                return (
                                    <div
                                        key={idx}
                                        className="flex-1 flex flex-col items-center group relative h-full justify-end"
                                    >
                                        {!isEmpty ? (
                                            <div
                                                className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all hover:from-cyan-500 hover:to-cyan-300 relative"
                                                style={{ height: `${heightPercent}%` }}
                                            />
                                        ) : (
                                            <div className="w-full h-1 bg-slate-800/50 rounded-full" />
                                        )}

                                        {/* Tooltip */}
                                        {!isEmpty && (
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 border border-slate-600 rounded px-3 py-2 text-xs whitespace-nowrap z-20 shadow-xl pointer-events-none">
                                                <div className="font-bold text-cyan-400 text-sm mb-1">{data.count} {t.richList.utxos}</div>
                                                <div className="text-slate-300 mb-1">{data.totalBtc.toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC</div>
                                                <div className="text-slate-500 border-t border-slate-700 pt-1 mt-1">
                                                    {t.richListDetail.blockRange}: <br />{data.minBlock.toLocaleString()} - {data.maxBlock.toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* X-axis labels */}
                        <div className="flex justify-between mt-3 text-[10px] text-slate-500 border-t border-slate-800 pt-2">
                            <span>{t.richListDetail.blockLabel} {timelineData[0]?.minBlock.toLocaleString()}</span>
                            <span className="hidden sm:inline text-slate-600">{t.richListDetail.distributionOver.replace("{0}", String(timelineData.length))}</span>
                            <span>{t.richListDetail.blockLabel} {timelineData[timelineData.length - 1]?.maxBlock.toLocaleString()}</span>
                        </div>
                    </div>
                )}

                {/* UTXO Distribution by Value */}
                {utxoDistribution.length > 0 && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-bold text-slate-300 mb-4">📊 {t.richListDetail.distributionTitle}</h2>
                        <div className="space-y-2">
                            {utxoDistribution.map((range, idx) => {
                                const maxCount = Math.max(...utxoDistribution.map(r => r.count));
                                const barWidth = (range.count / maxCount) * 100;
                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-24 text-xs text-slate-400 text-right shrink-0">{range.label} BTC</div>
                                        <div className="flex-1 h-5 bg-slate-800 rounded overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${range.color} rounded`}
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                        <div className="w-20 text-xs text-slate-400 shrink-0">
                                            {range.count.toLocaleString()}
                                        </div>
                                        <div className="w-28 text-xs text-slate-500 text-right shrink-0 hidden md:block">
                                            {range.total.toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* UTXOs Table - Simplified */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-300">
                            {t.richListDetail.unspentOutputs} ({whale.utxoCount.toLocaleString()})
                        </h2>
                        {whale.utxoCount > 20 && (
                            <button
                                onClick={() => setShowAllUtxos(!showAllUtxos)}
                                className="min-h-11 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded border border-slate-600"
                            >
                                {showAllUtxos ? t.richListDetail.showLess : t.richListDetail.showAll.replace("{0}", whale.utxoCount.toLocaleString())}
                            </button>
                        )}
                    </div>

                    <div className="p-4">
                        <div className="space-y-2">
                            {(displayedUtxos as UTXO[])?.map((utxo, idx) => (
                                <div
                                    key={`${utxo.txid}-${utxo.vout}`}
                                    className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <span className="text-slate-600 text-sm w-8">{idx + 1}</span>
                                    <Link
                                        href={`/explorer/decoder?query=${utxo.txid}`}
                                        className="font-mono text-xs text-cyan-400/80 hover:text-cyan-300 truncate flex-1"
                                    >
                                        {utxo.txid.slice(0, 20)}...{utxo.txid.slice(-8)}
                                    </Link>
                                    <span className="text-slate-500 text-xs">:{utxo.vout}</span>
                                    <span className="font-bold text-slate-200 text-sm w-32 text-right">
                                        {utxo.valueBtc < 0.001
                                            ? utxo.valueBtc.toFixed(8)
                                            : utxo.valueBtc.toLocaleString(undefined, { maximumFractionDigits: 4 })} BTC
                                    </span>
                                    <span className="text-slate-500 text-xs w-24 text-right hidden md:block">
                                        #{utxo.blockHeight?.toLocaleString() || '—'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {!showAllUtxos && whale.utxoCount > 20 && (
                            <div className="mt-4 text-center text-slate-500 text-sm">
                                {t.richListDetail.showingNofTotal.replace("{0}", "20").replace("{1}", whale.utxoCount.toLocaleString()).replace("{2}", t.richList.utxos)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
