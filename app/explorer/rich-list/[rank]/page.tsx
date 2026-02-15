'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../../../components/Header';
import CopyButton from '../../../../components/CopyButton';

// Static imports - all whale data embedded
import whale01 from '../../../../data/whales/whale_01.json';
import whale02 from '../../../../data/whales/whale_02.json';
import whale03 from '../../../../data/whales/whale_03.json';
import whale04 from '../../../../data/whales/whale_04.json';
import whale05 from '../../../../data/whales/whale_05.json';
import whale06 from '../../../../data/whales/whale_06.json';
import whale07 from '../../../../data/whales/whale_07.json';
import whale08 from '../../../../data/whales/whale_08.json';
import whale09 from '../../../../data/whales/whale_09.json';
import whale10 from '../../../../data/whales/whale_10.json';
import whale11 from '../../../../data/whales/whale_11.json';
import whale12 from '../../../../data/whales/whale_12.json';
import whale13 from '../../../../data/whales/whale_13.json';
import whale14 from '../../../../data/whales/whale_14.json';
import whale15 from '../../../../data/whales/whale_15.json';
import whale16 from '../../../../data/whales/whale_16.json';
import whale17 from '../../../../data/whales/whale_17.json';
import whale18 from '../../../../data/whales/whale_18.json';
import whale19 from '../../../../data/whales/whale_19.json';
import whale20 from '../../../../data/whales/whale_20.json';

const whalesMap: { [key: number]: typeof whale01 } = {
    1: whale01, 2: whale02, 3: whale03, 4: whale04, 5: whale05,
    6: whale06, 7: whale07, 8: whale08, 9: whale09, 10: whale10,
    11: whale11, 12: whale12, 13: whale13, 14: whale14, 15: whale15,
    16: whale16, 17: whale17, 18: whale18, 19: whale19, 20: whale20
};

interface UTXO {
    txid: string;
    vout: number;
    value: number;
    valueBtc: number;
    blockHeight: number | null;
}

export default function WhaleDetailPage() {
    const params = useParams();
    const rank = parseInt(params.rank as string);
    const [showAllUtxos, setShowAllUtxos] = useState(false);

    const whale = whalesMap[rank];

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString();
    };

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

    if (!whale) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
                <div className="max-w-4xl mx-auto">
                    <div className="md:hidden">
                        <Header />
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8 text-center">
                        <div className="text-red-400 text-lg mb-4">❌ Whale #{rank} not found</div>
                        <Link href="/explorer/rich-list" className="text-cyan-400 hover:underline inline-flex items-center min-h-11">
                            ← Back to Whale Watch
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
                            Whale #{whale.rank}
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm font-mono break-all">
                            {whale.address}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <CopyButton text={whale.address} label="Copy address" className="bg-slate-900/60" />
                            <Link
                                href={`/explorer/decoder?query=${encodeURIComponent(whale.address)}`}
                                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-bold text-cyan-300 hover:border-cyan-500/50 hover:text-cyan-200"
                            >
                                Open in Decoder
                            </Link>
                        </div>
                    </div>
                    <Link href="/explorer/rich-list" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors whitespace-nowrap inline-flex items-center min-h-11">
                        ← Back to Whale Watch
                    </Link>
                </div>

                {/* Stats Cards - Fixed Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 md:p-5">
                        <div className="text-2xl md:text-3xl font-bold text-amber-400 truncate">
                            {whale.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase mt-1">Balance (BTC)</div>
                    </div>
                    <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-4 md:p-5">
                        <div className="text-2xl md:text-3xl font-bold text-cyan-400">
                            {whale.utxoCount.toLocaleString()}
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase mt-1">UTXOs</div>
                    </div>
                    <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 md:p-5">
                        <div className="text-2xl md:text-3xl font-bold text-purple-400">
                            {whale.scanHeight?.toLocaleString() || '—'}
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase mt-1">Scan Height</div>
                    </div>
                    <div className="bg-slate-900 border border-green-500/40 rounded-xl p-4 md:p-5">
                        <div className="text-2xl md:text-3xl font-bold text-green-400">
                            {whale.scanDurationSeconds?.toFixed(1) || '—'}s
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 uppercase mt-1">Scan Time</div>
                    </div>
                </div>

                {/* Timeline Chart - UTXOs by Block Height */}
                {timelineData.length > 0 && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-300">📈 UTXO Timeline (by Block Height)</h2>
                            <div className="text-xs text-slate-500">
                                Range: {timelineData[0].minBlock} - {timelineData[timelineData.length - 1].maxBlock}
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
                                                <div className="font-bold text-cyan-400 text-sm mb-1">{data.count} UTXOs</div>
                                                <div className="text-slate-300 mb-1">{data.totalBtc.toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC</div>
                                                <div className="text-slate-500 border-t border-slate-700 pt-1 mt-1">
                                                    Block Range: <br />{data.minBlock.toLocaleString()} - {data.maxBlock.toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* X-axis labels */}
                        <div className="flex justify-between mt-3 text-[10px] text-slate-500 border-t border-slate-800 pt-2">
                            <span>Block {timelineData[0]?.minBlock.toLocaleString()}</span>
                            <span className="hidden sm:inline text-slate-600">Distribution over {timelineData.length} segments</span>
                            <span>Block {timelineData[timelineData.length - 1]?.maxBlock.toLocaleString()}</span>
                        </div>
                    </div>
                )}

                {/* UTXO Distribution by Value */}
                {utxoDistribution.length > 0 && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6">
                        <h2 className="text-lg font-bold text-slate-300 mb-4">📊 UTXO Distribution by Value</h2>
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

                {/* Data Source */}
                <div className="bg-sky-900/20 border border-sky-500/30 rounded-lg px-4 py-3 text-xs text-sky-200/90">
                    ℹ️ <span className="font-bold">Static address snapshot</span> — This record reflects an address view, not a confirmed entity.
                    Updated: {formatDate(whale.fetchedAt)}
                </div>

                {/* UTXOs Table - Simplified */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-300">
                            Unspent Outputs ({whale.utxoCount.toLocaleString()})
                        </h2>
                        {whale.utxoCount > 20 && (
                            <button
                                onClick={() => setShowAllUtxos(!showAllUtxos)}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded border border-slate-600"
                            >
                                {showAllUtxos ? 'Show Less' : `Show All ${whale.utxoCount.toLocaleString()}`}
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
                                Showing 20 of {whale.utxoCount.toLocaleString()} UTXOs
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
