"use client";

import MempoolVisualizer from "@/components/MempoolVisualizer";
import NetworkHud from "@/components/NetworkHud";
import Header from "@/components/Header";
import ProvenanceBadge from "@/components/ProvenanceBadge";
import ScreenshotExport from "@/components/ScreenshotExport";
import { useMempoolFeed } from "@/hooks/useMempoolFeed";
import { useTranslation } from "@/lib/i18n";

const statusPill = "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider";

export default function MempoolPage() {
    const { t, locale } = useTranslation();
    const { rows, snapshot, snapshotLoading, snapshotFailed, streamStatus, streamObservedAt, mempoolCount, replacement, retry } = useMempoolFeed();
    const streamLabel = {
        connecting: t.mempool.connecting,
        awaiting: t.mempool.awaitingStream,
        retrying: t.mempool.reconnecting,
        offline: t.mempool.offline,
    };
    const streamInterrupted = streamStatus === "retrying" || streamStatus === "offline";

    return (
        <>
            <Header />

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        {t.mempool.title}
                    </h1>
                    <p className="mt-2 text-slate-400 text-sm">{t.mempool.subtitle}</p>
                </div>
                <div className="text-xs md:text-right space-y-1">
                    <div className="flex items-center gap-2 md:justify-end">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider">{t.mempool.stream}</span>
                        <div data-testid="mempool-stream-status" role="status">
                            {streamStatus === "live" ? (
                                <ProvenanceBadge source="Live Node" />
                            ) : (
                                <span className={`${statusPill} ${streamInterrupted ? "bg-amber-500/10 text-amber-300" : "bg-cyan-500/10 text-cyan-300"}`}>
                                    {streamLabel[streamStatus]}
                                </span>
                            )}
                        </div>
                    </div>
                    {streamObservedAt !== null && (
                        <div className="text-slate-500">
                            {t.mempool.lastStreamEvent}{" "}
                            <time className="font-mono text-slate-300" dateTime={new Date(streamObservedAt).toISOString()}>
                                {new Date(streamObservedAt).toLocaleTimeString(locale)}
                            </time>
                        </div>
                    )}
                    {mempoolCount !== null && (
                        <div className="text-slate-500">
                            <span className="font-mono text-slate-300">{mempoolCount.toLocaleString(locale)}</span> {t.mempool.txsInMempool}
                        </div>
                    )}
                </div>
            </div>

            {replacement && (
                <div className="fixed inset-x-4 bottom-8 z-50 animate-in slide-in-from-right duration-500 sm:inset-x-auto sm:right-8">
                    <div className="flex items-start gap-4 rounded-xl border border-amber-500/50 bg-slate-950/95 p-4 shadow-2xl" role="status">
                        <div className="rounded-full bg-amber-500/10 p-2 text-amber-400">
                            <svg className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">{t.mempool.rbfConflict}</h4>
                            <div className="mt-1 space-y-1 font-mono text-xs text-slate-400">
                                <p>{t.mempool.target} <span className="text-slate-200">{replacement.txid.substring(0, 8)}...</span></p>
                                <p>{t.mempool.replaced} <span className="text-red-400 line-through">{replacement.replacedTxid.substring(0, 8)}...</span></p>
                                {replacement.feeBumpSats !== null && (
                                    <p className="mt-1 text-emerald-400">+ {(replacement.feeBumpSats / 100_000_000).toFixed(8)} BTC {t.mempool.feeBump}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8 relative" id="mempool-visualizer-container">
                <div className="absolute top-2 right-2 z-10 opacity-50 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <ScreenshotExport targetId="mempool-visualizer-container" filename="mempool-snapshot" buttonText="" />
                </div>
                <MempoolVisualizer />
            </div>

            <section aria-labelledby="mempool-recent-heading" data-testid="mempool-recent-transactions" className="relative mb-20 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
                    <h2 className="text-sm font-semibold text-slate-200" id="mempool-recent-heading">
                        {t.mempool.recentTransactions}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400" data-testid="mempool-snapshot-status">
                        {snapshot && (
                            <>
                                {snapshot.source === "unknown" ? (
                                    <span className={`${statusPill} bg-slate-800 text-slate-300`}>{t.mempool.unverifiedSnapshot}</span>
                                ) : (
                                    <ProvenanceBadge source={snapshot.source === "public" ? "Public API Fallback" : "Cached Snapshot"} />
                                )}
                                {snapshot.observedAt === null ? (
                                    <span>{t.mempool.snapshotTimeUnknown}</span>
                                ) : (
                                    <span>
                                        {t.mempool.snapshotObservedAt}{" "}
                                        <time dateTime={new Date(snapshot.observedAt).toISOString()}>
                                            {new Date(snapshot.observedAt).toLocaleString(locale)}
                                        </time>
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    {streamStatus !== "offline" && (snapshotFailed || streamStatus === "retrying") && (
                        <button type="button" onClick={retry} className="min-h-11 min-w-11 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400">
                            {t.mempool.retry}
                        </button>
                    )}
                </div>

                {snapshotFailed && (
                    <p className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-200" role="status">
                        {snapshot ? t.mempool.showingLastKnown : t.mempool.snapshotUnavailable}
                    </p>
                )}

                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-7">{t.mempool.transactionId}</div>
                    <div className="col-span-2 text-right">{t.mempool.feeBtc}</div>
                    <div className="col-span-3 text-right">{t.mempool.sizeVb}</div>
                </div>

                <div className="divide-y divide-slate-800/50">
                    {rows.map((tx) => {
                        const fee = tx.feeSats === null ? "—" : (tx.feeSats / 100_000_000).toFixed(8);
                        const size = tx.size?.toLocaleString(locale) ?? "—";
                        return (
                            <div key={tx.txid} className="grid grid-cols-1 gap-2 p-4 font-mono text-xs hover:bg-slate-800/30 md:grid-cols-12 md:gap-4">
                                <div className="truncate text-cyan-300 md:col-span-7" title={tx.txid}>{tx.txid}</div>
                                <div className="flex justify-between gap-1 text-slate-300 md:col-span-2 md:justify-end">
                                    <span className="text-slate-500 md:hidden">{t.mempool.feeBtc}</span>
                                    <span>{fee}</span>
                                </div>
                                <div className="flex justify-between gap-1 text-slate-400 md:col-span-3 md:justify-end">
                                    <span className="text-slate-500 md:hidden">{t.mempool.sizeVb}</span>
                                    <span>{size}</span>
                                </div>
                            </div>
                        );
                    })}

                    {rows.length === 0 && (snapshotLoading ? (
                        <div className="motion-safe:animate-pulse p-4 space-y-4" aria-busy="true" aria-label={t.mempool.waitingForTxs}>
                            {Array.from({ length: 5 }, (_, i) => (
                                <div key={i} className="h-4 w-3/4 rounded bg-slate-800" />
                            ))}
                        </div>
                    ) : (
                        <p className="p-12 text-center text-slate-400">
                            {snapshot ? t.mempool.noRecentTxs : t.mempool.waitingForTxs}
                        </p>
                    ))}
                </div>
            </section>

            <NetworkHud />
        </>
    );
}
