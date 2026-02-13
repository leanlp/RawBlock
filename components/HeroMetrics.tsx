"use client";

import Link from "next/link";
import Card, { MetricValue, PanelHeader } from "./Card";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";
import { formatFeeTime, useFeeMarketData } from "@/hooks/useFeeMarketData";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { formatSatVb } from "@/lib/feeBands";
import type { BitcoinLiveMetrics } from "@/lib/bitcoinData";
import type { FeeHistoryPoint } from "@/hooks/useFeeMarketData";

const HERO_FALLBACK_METRICS: BitcoinLiveMetrics = {
  blockHeight: 936_310,
  feeFast: 5,
  feeHalfHour: 4.5,
  feeHour: 1,
  hashrateEh: 986_972,
  mempoolTxCount: 14_322,
  mempoolVsizeMb: 28,
  recentTxIds: [
    "86cf6141a6efb15fb5b9e6ddf2d20dca",
    "9447a0c4d15c4f0cb71e1e18",
    "cd5fc0137de25f7b9913d551",
    "53f0d5ed6fa92987a884ce99",
    "ceb8e75c51b8d1f4f87e8814",
  ],
  blocksUntilHalving: 113_690,
  daysUntilHalving: 790,
  lastUpdated: new Date().toISOString(),
  source: "unavailable",
};

const HERO_FALLBACK_FEES = {
  fast: 5,
  medium: 4.5,
  slow: 1,
};

const HERO_FALLBACK_FAST_SERIES = [
  5.4, 3.8, 4.9, 2.1, 4.2, 2.8, 1.9, 3.1, 2.2, 4.5, 3.4, 2.6,
  1.8, 2.3, 3.7, 5.1, 4.6, 2.9, 2.0, 3.3, 2.4, 1.7, 2.6, 3.1,
  4.2, 3.6, 2.5, 2.2, 4.8, 3.2, 2.1, 1.9, 2.7, 3.9, 4.4, 2.8,
  2.2, 2.5, 3.4, 5.0, 4.1, 2.6, 2.0, 3.0, 2.4, 2.2, 3.8, 5.3,
];

const HERO_FALLBACK_FEE_HISTORY: FeeHistoryPoint[] = (() => {
  const now = Date.now();
  return HERO_FALLBACK_FAST_SERIES.map((fast, idx) => ({
    timestamp: now - (HERO_FALLBACK_FAST_SERIES.length - idx) * 60_000,
    fast: Number(fast.toFixed(2)),
    medium: Number(Math.max(0.2, fast - 0.5).toFixed(2)),
    slow: Number(Math.max(0.2, fast - 4).toFixed(2)),
  }));
})();

function formatHashrateEh(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Data temporarily unavailable";
  }

  const hasFraction = Math.abs(value % 1) > Number.EPSILON;
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })} EH/s`;
}

export default function HeroMetrics() {
  const { status, metrics, error, retry } = useBitcoinLiveMetrics(30_000);
  const { history: feeHistory, cardFees } = useFeeMarketData(30_000);

  const hasLiveMetrics = Boolean(metrics);
  const displayMetrics = metrics ?? HERO_FALLBACK_METRICS;
  const displayRecentTxIds =
    metrics?.recentTxIds?.length ? metrics.recentTxIds : HERO_FALLBACK_METRICS.recentTxIds;
  const displayFeeFast = cardFees.fast ?? HERO_FALLBACK_FEES.fast;
  const displayFeeHalfHour = cardFees.medium ?? HERO_FALLBACK_FEES.medium;
  const displayFeeHour = cardFees.slow ?? HERO_FALLBACK_FEES.slow;
  const displayFeeHistory = feeHistory.length > 0 ? feeHistory : HERO_FALLBACK_FEE_HISTORY;

  const liveBadge =
    hasLiveMetrics
      ? "Live from public sources"
      : status === "error"
        ? "Showing startup snapshot"
        : status === "loading"
        ? "Loading network data"
        : "Startup snapshot";

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-center gap-2 mb-6">
        <div
          className={`w-2 h-2 rounded-full ${hasLiveMetrics ? "bg-emerald-500 animate-pulse" : status === "error" ? "bg-amber-500" : "bg-amber-500 animate-pulse"}`}
        />
        <span className="text-xs text-slate-500 uppercase tracking-widest">{liveBadge}</span>
        {status === "error" ? (
          <button
            type="button"
            onClick={retry}
            className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300"
          >
            Retry
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 auto-rows-fr">
        <Link href="/explorer/blocks">
          <Card variant="metric" accent="cyan" onClick={() => {}}>
            <MetricValue
              icon="📦"
              value={displayMetrics.blockHeight?.toLocaleString() ?? "Data temporarily unavailable"}
              label="Block Height"
              sublabel={hasLiveMetrics && metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleTimeString() : "Startup snapshot"}
              accent="cyan"
            />
          </Card>
        </Link>

        <Link href="/explorer/vitals">
          <Card variant="metric" accent="orange" onClick={() => {}}>
            <MetricValue
              icon="⛏️"
              value={formatHashrateEh(displayMetrics.hashrateEh)}
              label="Hashrate"
              sublabel="3-day average"
              accent="orange"
            />
          </Card>
        </Link>

        <Link href="/explorer/mempool">
          <Card variant="metric" accent="blue" onClick={() => {}}>
            <MetricValue
              icon="🌊"
              value={displayMetrics.mempoolTxCount?.toLocaleString() ?? "Data temporarily unavailable"}
              label="Pending TXs"
              sublabel={
                displayMetrics.mempoolVsizeMb !== null && displayMetrics.mempoolVsizeMb !== undefined
                  ? `${displayMetrics.mempoolVsizeMb} MB`
                  : ""
              }
              accent="blue"
            />
          </Card>
        </Link>

        <Link href="/explorer/vitals">
          <Card variant="metric" accent="violet" onClick={() => {}}>
            <MetricValue
              icon="⏳"
              value={displayMetrics.daysUntilHalving?.toLocaleString() ?? "Data temporarily unavailable"}
              label="Days to Halving"
              sublabel={
                displayMetrics.blocksUntilHalving !== null && displayMetrics.blocksUntilHalving !== undefined
                  ? `${displayMetrics.blocksUntilHalving.toLocaleString()} blocks`
                  : ""
              }
              accent="violet"
            />
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/explorer/fees" className="block w-full h-full">
          <Card variant="panel" className="h-full" onClick={() => {}}>
            <PanelHeader>Fee Market (sat/vB)</PanelHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Fast</span>
                <span className="font-mono text-red-400 font-bold">
                  {formatSatVb(displayFeeFast)}
                  {" sat/vB"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">30 min</span>
                <span className="font-mono text-amber-400 font-bold">
                  {formatSatVb(displayFeeHalfHour)}
                  {" sat/vB"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">60 min</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formatSatVb(displayFeeHour)}
                  {" sat/vB"}
                </span>
              </div>
            </div>
            {displayFeeHistory.length > 0 ? (
              <div className="mt-3 h-20 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2 py-1">
                <SafeResponsiveContainer width="100%" height="100%" minHeight={64}>
                  <AreaChart data={displayFeeHistory} margin={{ top: 4, right: 4, left: 2, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hero-fee-economy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="hero-fee-standard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="hero-fee-express" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis hide scale="linear" domain={[0, "auto"]} />
                    <Tooltip
                      labelFormatter={(value) => formatFeeTime(Number(value))}
                      formatter={(value, name) => [`${formatSatVb(Number(value))} sat/vB`, String(name)]}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f1f5f9" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Area type="monotone" dataKey="slow" stroke="#10b981" fill="url(#hero-fee-economy)" strokeWidth={1.5} name="Economy" />
                    <Area type="monotone" dataKey="medium" stroke="#f59e0b" fill="url(#hero-fee-standard)" strokeWidth={1.5} name="Standard" />
                    <Area type="monotone" dataKey="fast" stroke="#ef4444" fill="url(#hero-fee-express)" strokeWidth={1.5} name="Express" />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>
            ) : null}
          </Card>
        </Link>

        <Link href="/explorer/mempool" className="block w-full h-full">
          <Card variant="panel" className="h-full" onClick={() => {}}>
            <PanelHeader>Live Mempool Stream</PanelHeader>
            {displayRecentTxIds.length > 0 ? (
              <div className="space-y-1 text-xs text-slate-300">
                {displayRecentTxIds.map((txid) => (
                  <p key={txid} className="font-mono text-cyan-400">
                    TX: {txid.slice(0, 8)}...{txid.slice(-4)}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">{error ?? "Data temporarily unavailable"}</div>
            )}
          </Card>
        </Link>
      </div>
    </div>
  );
}
