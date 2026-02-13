"use client";

import Header from "@/components/Header";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";

export default function VitalsPage() {
  const { status, metrics, error, retry } = useBitcoinLiveMetrics(30_000);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header />

        <div className="flex flex-col md:flex-row justify-between items-center md:items-end pb-6 border-b border-slate-800">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              Protocol Vital Signs
            </h1>
            <p className="mt-2 text-slate-400 text-sm">Raw Block live Bitcoin telemetry with graceful fallback states.</p>
          </div>
        </div>

        {status === "loading" && !metrics ? (
          <div>
            <p className="mb-4 text-sm text-slate-500">Connecting to live telemetry...</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`vitals-skeleton-${idx}`} className="h-40 rounded-xl border border-slate-800 bg-slate-900/50 animate-pulse" />
              ))}
            </div>
          </div>
        ) : null}

        {status === "error" && !metrics ? (
          <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
            <h3 className="text-red-400 font-bold mb-2">Data temporarily unavailable</h3>
            <p className="text-red-300 text-sm">{error ?? "Unable to fetch metrics right now."}</p>
            <button
              onClick={retry}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : null}

        {metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Block Height</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">{metrics.blockHeight?.toLocaleString() ?? "Data temporarily unavailable"}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Hashrate</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">
                {metrics.hashrateEh !== null ? `${metrics.hashrateEh} EH/s` : "Data temporarily unavailable"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Fee Recommendations</p>
              <div className="mt-2 space-y-1 text-sm text-slate-200">
                <p>Fast: {metrics.feeFast !== null ? `${metrics.feeFast} sat/vB` : "Data temporarily unavailable"}</p>
                <p>30 min: {metrics.feeHalfHour !== null ? `${metrics.feeHalfHour} sat/vB` : "Data temporarily unavailable"}</p>
                <p>60 min: {metrics.feeHour !== null ? `${metrics.feeHour} sat/vB` : "Data temporarily unavailable"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Halving Countdown</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">
                {metrics.daysUntilHalving !== null ? `${metrics.daysUntilHalving} days` : "Data temporarily unavailable"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {metrics.blocksUntilHalving !== null ? `${metrics.blocksUntilHalving.toLocaleString()} blocks remaining` : ""}
              </p>
            </div>

            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400">
              <p>Source: {metrics.source}</p>
              <p>Last updated: {new Date(metrics.lastUpdated).toLocaleString()}</p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
