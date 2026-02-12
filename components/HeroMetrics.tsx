"use client";
import Link from "next/link";
import Card, { MetricValue, PanelHeader } from "./Card";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";
import { useBitcoinFeeBands } from "@/hooks/useBitcoinFeeBands";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { formatSatVb } from "@/lib/feeBands";

export default function HeroMetrics() {
  const { status, metrics, error, retry } = useBitcoinLiveMetrics(30_000);
  const { bands: feeBands } = useBitcoinFeeBands(30_000);
  const cardFeeFast = feeBands[0]?.high ?? metrics?.feeFast ?? null;
  const cardFeeHalfHour = feeBands[0]?.median ?? metrics?.feeHalfHour ?? null;
  const cardFeeHour = feeBands[0]?.low ?? metrics?.feeHour ?? null;
  const liveBadge = status === "ready" && metrics ? "Live from public sources" : status === "loading" ? "Loading network data" : "Data temporarily unavailable";

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full ${status === "ready" ? "bg-emerald-500 animate-pulse" : status === "loading" ? "bg-amber-500 animate-pulse" : "bg-rose-500"}`} />
        <span className="text-xs text-slate-500 uppercase tracking-widest">{liveBadge}</span>
        {status === "error" ? (
          <button type="button" onClick={retry} className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">
            Retry
          </button>
        ) : null}
      </div>

      {status === "loading" && !metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 auto-rows-fr">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="h-28 rounded-xl border border-slate-800 bg-slate-900/50 animate-pulse" />
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 auto-rows-fr">
        <Link href="/explorer/blocks">
          <Card variant="metric" accent="cyan" onClick={() => { }}>
            <MetricValue
              icon="📦"
              value={metrics?.blockHeight?.toLocaleString() ?? "Data temporarily unavailable"}
              label="Block Height"
              sublabel={metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleTimeString() : ""}
              accent="cyan"
            />
          </Card>
        </Link>

        <Link href="/explorer/vitals">
          <Card variant="metric" accent="orange" onClick={() => { }}>
            <MetricValue
              icon="⛏️"
              value={metrics?.hashrateEh !== null && metrics?.hashrateEh !== undefined ? `${metrics.hashrateEh} EH/s` : "Data temporarily unavailable"}
              label="Hashrate"
              sublabel="3-day average"
              accent="orange"
            />
          </Card>
        </Link>

        <Link href="/explorer/mempool">
          <Card variant="metric" accent="blue" onClick={() => { }}>
            <MetricValue
              icon="🌊"
              value={metrics?.mempoolTxCount?.toLocaleString() ?? "Data temporarily unavailable"}
              label="Pending TXs"
              sublabel={metrics?.mempoolVsizeMb !== null && metrics?.mempoolVsizeMb !== undefined ? `${metrics.mempoolVsizeMb} MB` : ""}
              accent="blue"
            />
          </Card>
        </Link>

        <Link href="/explorer/vitals">
          <Card variant="metric" accent="violet" onClick={() => { }}>
            <MetricValue
              icon="⏳"
              value={metrics?.daysUntilHalving?.toLocaleString() ?? "Data temporarily unavailable"}
              label="Days to Halving"
              sublabel={metrics?.blocksUntilHalving !== null && metrics?.blocksUntilHalving !== undefined ? `${metrics.blocksUntilHalving.toLocaleString()} blocks` : ""}
              accent="violet"
            />
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/explorer/fees" className="block w-full h-full">
          <Card variant="panel" className="h-full" onClick={() => { }}>
            <PanelHeader>Fee Market (sat/vB)</PanelHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Fast</span>
                <span className="font-mono text-red-400 font-bold">
                  {formatSatVb(cardFeeFast)}{cardFeeFast !== null ? " sat/vB" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">30 min</span>
                <span className="font-mono text-amber-400 font-bold">
                  {formatSatVb(cardFeeHalfHour)}{cardFeeHalfHour !== null ? " sat/vB" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">60 min</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formatSatVb(cardFeeHour)}{cardFeeHour !== null ? " sat/vB" : ""}
                </span>
              </div>
            </div>
            {feeBands.length > 0 ? (
              <div className="mt-3 h-20 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2 py-1">
                <SafeResponsiveContainer width="100%" height="100%" minHeight={64}>
                  <AreaChart data={feeBands}>
                    <XAxis dataKey="bucket" hide />
                    <YAxis hide scale="linear" domain={[0, "auto"]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f1f5f9" }}
                      labelStyle={{ color: "#94a3b8" }}
                      formatter={(value, name) => [
                        `${formatSatVb(Number(value))} sat/vB`,
                        String(name),
                      ]}
                    />
                    <Area type="stepAfter" dataKey="high" stroke="#ef4444" fill="#ef444433" strokeWidth={1.5} name="High" />
                    <Area type="stepAfter" dataKey="median" stroke="#f59e0b" fill="#f59e0b22" strokeWidth={1.5} name="Median" />
                    <Area type="stepAfter" dataKey="low" stroke="#10b981" fill="#10b98122" strokeWidth={1.5} name="Low" />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>
            ) : null}
          </Card>
        </Link>

        <Link href="/explorer/mempool" className="block w-full h-full">
          <Card variant="panel" className="h-full" onClick={() => { }}>
            <PanelHeader>Live Mempool Stream</PanelHeader>
            {metrics?.recentTxIds?.length ? (
              <div className="space-y-1 text-xs text-slate-300">
                {metrics.recentTxIds.map((txid) => (
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
