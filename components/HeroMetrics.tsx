"use client";

import Link from "next/link";
import Card, { MetricValue, PanelHeader } from "./Card";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";
import { formatFeeTime, useFeeMarketData } from "@/hooks/useFeeMarketData";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { formatSatVb } from "@/lib/feeBands";
import type { BitcoinLiveMetrics, RecentMempoolTx } from "@/lib/bitcoinData";
import type { FeeHistoryPoint } from "@/hooks/useFeeMarketData";

const HERO_FALLBACK_RECENT_TXS: RecentMempoolTx[] = [
  {
    txid: "25fa769a3a30e6a7d2b5de87b715e6d3bf41b9c0e76f2d6d37b7aee3561d",
    feeSat: 1542,
    vsize: 168,
    feeRate: 9.18,
    time: Math.floor(Date.now() / 1000) - 12,
  },
  {
    txid: "fa8306ca14f12af5cb87b8dd2ca9c2d58cb1e6f497f5b3648810f445ce053",
    feeSat: 2710,
    vsize: 134,
    feeRate: 20.22,
    time: Math.floor(Date.now() / 1000) - 33,
  },
  {
    txid: "bb9a969c4bf880f0f1cd12a6328cf2c9d390c0d318d6c2de9ba58f636034",
    feeSat: 704,
    vsize: 226,
    feeRate: 3.12,
    time: Math.floor(Date.now() / 1000) - 51,
  },
  {
    txid: "eeb4d3ec0274a96a7f6dc662905f4a2e3f8e6b47e5757297d1b169b5bc5dd",
    feeSat: 1185,
    vsize: 173,
    feeRate: 6.85,
    time: Math.floor(Date.now() / 1000) - 74,
  },
  {
    txid: "4097da839f1a95e0d8c0a3d0e99995a19da9e73fbf0cc8d95d2fe3a97ff1",
    feeSat: 2978,
    vsize: 141,
    feeRate: 21.12,
    time: Math.floor(Date.now() / 1000) - 98,
  },
];

const HERO_FALLBACK_METRICS: BitcoinLiveMetrics = {
  blockHeight: 936_310,
  feeFast: 5,
  feeHalfHour: 4.5,
  feeHour: 1,
  hashrateEh: 986.97,
  mempoolTxCount: 14_322,
  mempoolVsizeMb: 28,
  recentTxIds: HERO_FALLBACK_RECENT_TXS.map((tx) => tx.txid),
  recentTxs: HERO_FALLBACK_RECENT_TXS,
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

function getShortTxid(txid: string): string {
  return `${txid.slice(0, 8)}...${txid.slice(-4)}`;
}

function formatTxAge(time: number | null, fallbackTime: number | null): string {
  const sourceTime = time ?? fallbackTime;
  if (sourceTime === null || !Number.isFinite(sourceTime)) return "Age n/a";

  const sourceSeconds =
    sourceTime > 1_000_000_000_000 ? Math.floor(sourceTime / 1000) : Math.floor(sourceTime);
  const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000) - sourceSeconds);

  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}m ago`;
  if (ageSeconds < 86_400) return `${Math.floor(ageSeconds / 3600)}h ago`;
  return `${Math.floor(ageSeconds / 86_400)}d ago`;
}

function formatVsize(vsize: number | null): string {
  if (vsize === null || !Number.isFinite(vsize)) return "vsize n/a";
  if (vsize >= 1000) return `${(vsize / 1000).toFixed(1)}k vB`;
  return `${Math.round(vsize)} vB`;
}

function getFeeRateTone(feeRate: number | null): string {
  if (feeRate === null || !Number.isFinite(feeRate)) return "border-slate-700/80 text-slate-400";
  if (feeRate >= 20) return "border-rose-500/50 text-rose-300";
  if (feeRate >= 8) return "border-amber-500/50 text-amber-300";
  return "border-emerald-500/50 text-emerald-300";
}

export default function HeroMetrics() {
  const { status, metrics, error, retry } = useBitcoinLiveMetrics(30_000);
  const { history: feeHistory, cardFees } = useFeeMarketData(30_000);

  const hasLiveMetrics = Boolean(metrics);
  const displayMetrics = metrics ?? HERO_FALLBACK_METRICS;
  const displayRecentTxs =
    metrics?.recentTxs?.length ? metrics.recentTxs : HERO_FALLBACK_METRICS.recentTxs;
  const visibleRecentTxs = displayRecentTxs.slice(0, 3);
  const displayFeeFast = cardFees.fast ?? HERO_FALLBACK_FEES.fast;
  const displayFeeHalfHour = cardFees.medium ?? HERO_FALLBACK_FEES.medium;
  const displayFeeHour = cardFees.slow ?? HERO_FALLBACK_FEES.slow;
  const displayFeeHistory = feeHistory.length > 0 ? feeHistory : HERO_FALLBACK_FEE_HISTORY;
  const connectingMode = status === "loading" && !hasLiveMetrics;
  const snapshotMode = status !== "loading" && !hasLiveMetrics;
  const liveMode = hasLiveMetrics && !error;
  const staleMode = hasLiveMetrics && Boolean(error);
  const streamFallbackTime = Math.floor(new Date(displayMetrics.lastUpdated).getTime() / 1000);

  return (
    <div className="w-full mb-12">
      {(snapshotMode || connectingMode || liveMode || staleMode) && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {snapshotMode && (
            <span className="rounded border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-400">
              Startup Snapshot
            </span>
          )}
          {connectingMode && (
            <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-widest text-cyan-300">
              Connecting to live node...
            </span>
          )}
          {liveMode && (
            <>
              {metrics?.source === "rawblock" ? (
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-widest text-emerald-300">
                  Live Node Data
                </span>
              ) : metrics?.source === "mixed" ? (
                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-widest text-amber-300">
                  Mixed Sources
                </span>
              ) : (
                <span className="rounded border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-300">
                  Public Telemetry
                </span>
              )}
            </>
          )}
          {staleMode && (
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-widest text-amber-300">
              Live Feed Delayed (Showing Last Known)
            </span>
          )}
        </div>
      )}

      {status === "error" && !hasLiveMetrics ? (
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-xs uppercase tracking-widest text-slate-500">
            Showing startup snapshot
          </span>
          <button
            type="button"
            onClick={retry}
            className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300"
          >
            Retry
          </button>
        </div>
      ) : null}

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
            {visibleRecentTxs.length > 0 ? (
              <div className="space-y-1.5">
                {visibleRecentTxs.map((tx) => (
                  <div
                    key={tx.txid}
                    className="rounded-lg border border-cyan-500/20 bg-slate-950/50 px-3 py-1.5 transition-colors group-hover:border-cyan-400/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs text-cyan-300">TX: {getShortTxid(tx.txid)}</p>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${getFeeRateTone(tx.feeRate)}`}
                      >
                        {tx.feeRate !== null && Number.isFinite(tx.feeRate)
                          ? `${formatSatVb(tx.feeRate)} sat/vB`
                          : "n/a"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-slate-400">
                      <span>{formatVsize(tx.vsize)}</span>
                      <span className="text-slate-600">•</span>
                      <span>{formatTxAge(tx.time, streamFallbackTime)}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-1 text-[10px] uppercase tracking-wider text-cyan-400/90">
                  View full mempool →
                </div>
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
