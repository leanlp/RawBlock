"use client";

import Header from "@/components/Header";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";
import { useFeeMarketData, formatFeeTime } from "@/hooks/useFeeMarketData";
import { formatSatVb } from "@/lib/feeBands";
import type { BitcoinMetricProvenance, BitcoinMetricSourceClass, BitcoinMetricUpstream } from "@/lib/bitcoinData";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import InfoTooltip from "@/components/InfoTooltip";
import Link from "next/link";

const SOURCE_CLASS_META: Record<BitcoinMetricSourceClass, { label: string; chipClass: string }> = {
  "local-node": {
    label: "Local Node",
    chipClass: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  },
  electrs: {
    label: "Electrs",
    chipClass: "border-cyan-400/40 bg-cyan-500/10 text-cyan-200",
  },
  fallback: {
    label: "Fallback",
    chipClass: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  },
  mixed: {
    label: "Mixed",
    chipClass: "border-indigo-400/40 bg-indigo-500/10 text-indigo-200",
  },
  unavailable: {
    label: "Unavailable",
    chipClass: "border-red-400/40 bg-red-500/10 text-red-200",
  },
};

const UPSTREAM_LABEL: Record<BitcoinMetricUpstream, string> = {
  rawblock: "rawblock gateway",
  electrs: "electrs",
  mempool: "mempool.space",
  blockstream: "blockstream.info",
  mixed: "mixed providers",
  unavailable: "no upstream",
};

export default function VitalsPage() {
  const { status, metrics, error, retry } = useBitcoinLiveMetrics(30_000);
  const { history, cardFees, longHorizon, loading: feeLoading, hasData: hasFeeData, retry: retryFees } = useFeeMarketData(30_000);

  const renderFee = (value: number | null) => {
    const formatted = formatSatVb(value);
    return formatted === "Data temporarily unavailable" ? formatted : `${formatted} sat/vB`;
  };

  const describeSource = (source: string) => {
    switch (source) {
      case "rawblock":
        return { label: "rawblock node gateway", detail: "Bitcoin Core + electrs stack" };
      case "mempool":
        return { label: "mempool.space", detail: "Public API" };
      case "blockstream":
        return { label: "blockstream.info", detail: "Public API" };
      case "mixed":
        return { label: "mempool.space + blockstream.info", detail: "Public APIs (fallback)" };
      case "unavailable":
        return { label: "Unavailable", detail: "No upstream provider reached" };
      default:
        return { label: source, detail: "Unknown source" };
    }
  };

  const fallbackProvenance = (timestamp: string): BitcoinMetricProvenance => ({
    sourceClass: "unavailable",
    upstream: "unavailable",
    timestamp,
  });

  const renderProvenance = (provenance: BitcoinMetricProvenance) => {
    const sourceMeta = SOURCE_CLASS_META[provenance.sourceClass];
    const upstream = UPSTREAM_LABEL[provenance.upstream] ?? provenance.upstream;
    const parsedTime = new Date(provenance.timestamp);
    const timeLabel = Number.isNaN(parsedTime.getTime()) ? "unknown time" : parsedTime.toLocaleTimeString();

    return (
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${sourceMeta.chipClass}`}>
          {sourceMeta.label}
        </span>
        <span className="text-[11px] text-slate-500">
          {upstream} <span className="font-mono text-slate-400">{timeLabel}</span>
        </span>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header />

        <div className="flex flex-col md:flex-row justify-between items-center md:items-end pb-6 border-b border-slate-800">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              Protocol Vital Signs
            </h1>
            <p className="mt-2 text-slate-400 text-sm">Raw Block live Bitcoin telemetry with unified fee intelligence and trend context.</p>
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
              {renderProvenance(metrics.provenance?.blockHeight ?? fallbackProvenance(metrics.lastUpdated))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Hashrate</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">
                {metrics.hashrateEh !== null ? `${metrics.hashrateEh} EH/s` : "Data temporarily unavailable"}
              </p>
              {renderProvenance(metrics.provenance?.hashrate ?? fallbackProvenance(metrics.lastUpdated))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Fee Recommendations</p>
              <div className="mt-2 space-y-1 text-sm text-slate-200">
                <p>Fast: {renderFee(cardFees.fast)}</p>
                <p>30 min: {renderFee(cardFees.medium)}</p>
                <p>60 min: {renderFee(cardFees.slow)}</p>
                <p>
                  24h+ ({longHorizon?.targetBlocks ?? 144} blk):{" "}
                  {longHorizon ? `${formatSatVb(longHorizon.satVB)} sat/vB` : "Data temporarily unavailable"}
                </p>
              </div>
              {renderProvenance(metrics.provenance?.fees ?? fallbackProvenance(metrics.lastUpdated))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Halving Countdown</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">
                {metrics.daysUntilHalving !== null ? `${metrics.daysUntilHalving} days` : "Data temporarily unavailable"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {metrics.blocksUntilHalving !== null ? `${metrics.blocksUntilHalving.toLocaleString()} blocks remaining` : ""}
              </p>
              {renderProvenance(metrics.provenance?.halving ?? fallbackProvenance(metrics.lastUpdated))}
            </div>

            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <InfoTooltip
                    content="Each metric card includes provenance (Local Node / Electrs / Fallback), upstream provider, and timestamp so you can validate freshness and trust level at a glance."
                    label="Vitals data sources"
                  />
                  <div className="space-y-1">
                    <p>
                      Aggregate source: <span className="text-slate-200">{describeSource(metrics.source).label}</span>{" "}
                      <span className="text-slate-500">({describeSource(metrics.source).detail})</span>
                    </p>
                    <p>Last updated: {new Date(metrics.lastUpdated).toLocaleString()}</p>
                  </div>
                </div>
                <Link
                  href="/about"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 text-[11px] font-bold text-slate-200 hover:border-cyan-500/40 hover:text-cyan-200"
                >
                  About & Trust
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Vital Trend Panel</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-100">Fee Pressure Over Time</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-300">
                Fast {renderFee(cardFees.fast)}
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">
                30m {renderFee(cardFees.medium)}
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                60m {renderFee(cardFees.slow)}
              </span>
              {longHorizon ? (
                <span
                  className={`rounded-full border px-2 py-1 ${
                    longHorizon.satVB < 1
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                      : "border-slate-700 bg-slate-900/80 text-slate-300"
                  }`}
                >
                  24h+ {formatSatVb(longHorizon.satVB)} sat/vB
                </span>
              ) : null}
            </div>
          </div>

          {feeLoading && !hasFeeData ? (
            <div className="h-[320px] animate-pulse rounded-lg border border-slate-800 bg-slate-950/40" />
          ) : history.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">Fee history is temporarily unavailable.</p>
              <button
                type="button"
                onClick={retryFees}
                className="mt-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-cyan-400/60 hover:text-cyan-300"
              >
                Retry trend feed
              </button>
            </div>
          ) : (
            <div className="h-[320px] w-full min-w-0 rounded-lg border border-slate-800 bg-slate-950/40 p-2">
              <SafeResponsiveContainer width="100%" height="100%" minHeight={280}>
                <AreaChart data={history} margin={{ top: 8, right: 12, left: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vitals-fee-fast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="vitals-fee-medium" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="vitals-fee-slow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatFeeTime}
                    stroke="#475569"
                    tick={{ fontSize: 12 }}
                    minTickGap={48}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fontSize: 12 }}
                    domain={[0, "auto"]}
                    label={{ value: "sat/vB", angle: -90, position: "insideLeft", fill: "#475569" }}
                  />
                  <Tooltip
                    labelFormatter={(value) => formatFeeTime(Number(value))}
                    formatter={(value, name) => [`${formatSatVb(Number(value))} sat/vB`, String(name)]}
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#334155",
                      color: "#f1f5f9",
                      borderRadius: "12px",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
                    }}
                  />
                  <Area type="monotone" dataKey="slow" stroke="#10b981" fill="url(#vitals-fee-slow)" strokeWidth={2} name="60 min" />
                  <Area type="monotone" dataKey="medium" stroke="#f59e0b" fill="url(#vitals-fee-medium)" strokeWidth={2} name="30 min" />
                  <Area type="monotone" dataKey="fast" stroke="#ef4444" fill="url(#vitals-fee-fast)" strokeWidth={2} name="Fast" />
                </AreaChart>
              </SafeResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
