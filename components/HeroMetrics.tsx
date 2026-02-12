"use client";

import Link from "next/link";
import Card, { MetricValue, PanelHeader } from "./Card";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";

function renderMetricValue(value: number | null, suffix = "", fallback = "Data temporarily unavailable") {
  if (value === null) return fallback;
  return `${value.toLocaleString()}${suffix}`;
}

export default function HeroMetrics() {
  const { status, metrics, error, retry } = useBitcoinLiveMetrics(30_000);

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
          <Card variant="metric" accent="cyan" onClick={() => {}}>
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
          <Card variant="metric" accent="orange" onClick={() => {}}>
            <MetricValue
              icon="⛏️"
              value={metrics?.hashrateEh !== null && metrics?.hashrateEh !== undefined ? `${metrics.hashrateEh} EH/s` : "Data temporarily unavailable"}
              label="Hashrate"
              sublabel="3-day average"
              accent="orange"
            />
          </Card>
        </Link>

        <Link href="/explorer/fees">
          <Card variant="metric" accent="blue" onClick={() => {}}>
            <MetricValue
              icon="💸"
              value={renderMetricValue(metrics?.feeFast ?? null, " sat/vB")}
              label="Fast Fee"
              sublabel={metrics?.feeHalfHour !== null && metrics?.feeHalfHour !== undefined ? `30 min: ${metrics.feeHalfHour} sat/vB` : ""}
              accent="blue"
            />
          </Card>
        </Link>

        <Link href="/explorer/vitals">
          <Card variant="metric" accent="violet" onClick={() => {}}>
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
          <Card variant="panel" className="h-full" onClick={() => {}}>
            <PanelHeader>Fee Market (sat/vB)</PanelHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Fast</span>
                <span className="font-mono text-red-400 font-bold">{renderMetricValue(metrics?.feeFast ?? null, "", "Data temporarily unavailable")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">30 min</span>
                <span className="font-mono text-amber-400 font-bold">{renderMetricValue(metrics?.feeHalfHour ?? null, "", "Data temporarily unavailable")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">60 min</span>
                <span className="font-mono text-emerald-400 font-bold">{renderMetricValue(metrics?.feeHour ?? null, "", "Data temporarily unavailable")}</span>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/explorer/vitals" className="block w-full h-full">
          <Card variant="panel" className="h-full" onClick={() => {}}>
            <PanelHeader>Network Snapshot</PanelHeader>
            {metrics ? (
              <div className="space-y-1 text-xs text-slate-300">
                <p>Source: {metrics.source}</p>
                <p>Last updated: {new Date(metrics.lastUpdated).toLocaleString()}</p>
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
