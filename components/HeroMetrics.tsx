"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Card, { MetricValue, PanelHeader } from "./Card";
import ProvenanceBadge from "./ProvenanceBadge";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { track } from "@/lib/analytics/track";
import {
  BITCOIN_BLOCK_TIME_MINUTES,
  BITCOIN_HALVING_INTERVAL_BLOCKS,
} from "@/lib/constants/bitcoinProtocol";
import { formatSatVb } from "@/lib/feeBands";
import {
  displayableHeroReading,
  HERO_POLL_MS,
  HISTORY_FRESH_MS,
  isHeroReadingFresh,
  MEMPOOL_FRESH_MS,
  mergeHeroCore,
  NETWORK_FRESH_MS,
  updateHeroReading,
  type HeroCoreMetrics,
  type HeroHistoryMetrics,
  type HeroReading,
  type HeroRecentMetrics,
} from "@/lib/heroMetrics";
import { useTranslation } from "@/lib/i18n";
import { useHeroSnapshot } from "@/hooks/useHeroSnapshot";

function mergeCore(previous: HeroCoreMetrics, incoming: HeroCoreMetrics | null) {
  return mergeHeroCore(previous, incoming ?? {
    height: null,
    hashrate: null,
    fees: null,
    mempool: null,
    checkedAt: Date.now(),
  });
}

function mergePanel<T>(previous: HeroReading<T> | null, incoming: HeroReading<T> | null) {
  return updateHeroReading(previous, incoming, Date.now());
}

function ReadingProvenance({ reading, now, maxAgeMs }: {
  reading: HeroReading<unknown> | null;
  now: number;
  maxAgeMs: number;
}) {
  const { locale, t } = useTranslation();
  if (!reading) {
    return <p className="mt-2 text-xs text-slate-400">{t.hero.dataTemporarilyUnavailable}</p>;
  }
  const fresh = isHeroReadingFresh(reading, now, maxAgeMs);
  const source = reading.source === "unknown" ? "Unverified Source"
    : reading.source === "fallback" ? "Public API Fallback"
    : fresh ? "Node Snapshot" : "Cached Snapshot";
  const stamp = reading.observedAt === null ? t.hero.unknownObservationTime
    : new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(reading.observedAt);

  return (
    <div className="mt-2 flex justify-center">
      <ProvenanceBadge
        source={source}
        timestamp={reading.lastKnown ? `${t.hero.lastKnown} · ${stamp}` : stamp}
        className="flex-wrap justify-center"
      />
    </div>
  );
}

function formatTxAge(time: number | null, now: number, locale: string, unknown: string) {
  if (time === null) return unknown;
  const seconds = Math.max(0, Math.floor(now / 1000) - time);
  const relativeTime = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" });
  if (seconds < 60) return relativeTime.format(-seconds, "second");
  if (seconds < 3600) return relativeTime.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86_400) return relativeTime.format(-Math.floor(seconds / 3600), "hour");
  return relativeTime.format(-Math.floor(seconds / 86_400), "day");
}

function getFeeRateTone(feeRate: number | null): string {
  if (feeRate === null || !Number.isFinite(feeRate)) return "border-slate-700/80 text-slate-400";
  if (feeRate >= 20) return "border-rose-500/50 text-rose-300";
  if (feeRate >= 8) return "border-amber-500/50 text-amber-300";
  return "border-emerald-500/50 text-emerald-300";
}

type HeroFeeTooltipProps = {
  active?: boolean;
  label?: number | string;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
};

function HeroFeeTooltipContent({ active, label, payload }: HeroFeeTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[170px] rounded-lg border border-slate-700/90 bg-slate-950/95 px-2.5 py-2 shadow-2xl backdrop-blur-md">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {new Date(Number(label)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      <div className="space-y-1 text-[11px]">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? "#94a3b8" }} />
              {entry.name}
            </span>
            <span className="font-mono text-slate-100">{entry.value === undefined ? "—" : formatSatVb(entry.value) + " sat/vB"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroMetrics({ initialMetrics }: { initialMetrics: HeroCoreMetrics }) {
  const { locale, t } = useTranslation();
  const [now, setNow] = useState(initialMetrics.checkedAt);
  const initialRefreshDelay = isHeroReadingFresh(initialMetrics.height, initialMetrics.checkedAt, NETWORK_FRESH_MS) &&
    isHeroReadingFresh(initialMetrics.hashrate, initialMetrics.checkedAt, NETWORK_FRESH_MS) &&
    isHeroReadingFresh(initialMetrics.fees, initialMetrics.checkedAt, NETWORK_FRESH_MS) &&
    isHeroReadingFresh(initialMetrics.mempool, initialMetrics.checkedAt, MEMPOOL_FRESH_MS)
    ? HERO_POLL_MS : 0;
  const { snapshot, firstRefreshPending: corePending, retry: retryCore } = useHeroSnapshot("hero", initialMetrics, mergeCore, initialRefreshDelay);
  const { snapshot: recentSnapshot, firstRefreshPending: recentPending, retry: retryRecent } =
    useHeroSnapshot<HeroRecentMetrics | null>("hero-recent", null, mergePanel);
  const { snapshot: historySnapshot, firstRefreshPending: historyPending, retry: retryHistory } =
    useHeroSnapshot<HeroHistoryMetrics | null>("hero-history", null, mergePanel);

  const height = displayableHeroReading(snapshot.height, now);
  const hashrate = displayableHeroReading(snapshot.hashrate, now);
  const fees = displayableHeroReading(snapshot.fees, now);
  const mempool = displayableHeroReading(snapshot.mempool, now);
  const recent = displayableHeroReading(recentSnapshot, now);
  const history = displayableHeroReading(historySnapshot, now);
  const historyMaxFee = history ? Math.max(6, Math.ceil(Math.max(...history.value.map(point => point.fast)) * 1.15)) : 6;
  const blocksUntilHalving = height
    ? BITCOIN_HALVING_INTERVAL_BLOCKS - (height.value % BITCOIN_HALVING_INTERVAL_BLOCKS) : null;
  const daysUntilHalving = blocksUntilHalving === null ? null
    : Math.ceil(blocksUntilHalving * BITCOIN_BLOCK_TIME_MINUTES / (60 * 24));
  const integers = new Intl.NumberFormat(locale);
  const decimals = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const firstHeightReported = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!height || firstHeightReported.current) return;
    firstHeightReported.current = true;
    performance.mark("rawblock:hero-first-height");
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation && new URL(navigation.name).pathname === "/") {
      track({
        name: "explorer_data_timing",
        properties: {
          tool: "hero",
          phase: "first_height",
          duration_ms: Math.round(performance.now()),
          source: initialMetrics.height ? "server" : "api",
          age_ms: height.observedAt === null ? undefined : Math.max(0, Date.now() - height.observedAt),
        },
      });
    }
  }, [height, initialMetrics.height]);

  const unavailable = !height || !hashrate || !mempool || !fees || (!recentPending && !recent) || (!historyPending && !history);

  return (
    <div className="w-full mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 auto-rows-fr">
        <Link href="/explorer/blocks">
          <Card variant="metric" accent="cyan" animateEntrance={false}>
            <MetricValue icon="📦" value={height ? integers.format(height.value) : "—"} label={t.hero.blockHeight} accent="cyan" />
            <ReadingProvenance reading={height} now={now} maxAgeMs={NETWORK_FRESH_MS} />
          </Card>
        </Link>

        <Link href="/explorer/vitals">
          <Card variant="metric" accent="orange" animateEntrance={false}>
            <MetricValue
              icon="⛏️"
              value={hashrate ? <>{decimals.format(hashrate.value)} <span className="text-sm">EH/s</span></> : "—"}
              label={t.hero.hashrate}
              accent="orange"
            />
            <ReadingProvenance reading={hashrate} now={now} maxAgeMs={NETWORK_FRESH_MS} />
          </Card>
        </Link>

        <Link href="/explorer/mempool">
          <Card variant="metric" accent="blue" animateEntrance={false}>
            <MetricValue
              icon="🌊"
              value={mempool?.value.count != null ? integers.format(mempool.value.count) : "—"}
              label={t.hero.pendingTxs}
              sublabel={mempool?.value.vsizeMb != null ? `${decimals.format(mempool.value.vsizeMb)} vMB` : undefined}
              accent="blue"
            />
            <ReadingProvenance reading={mempool} now={now} maxAgeMs={MEMPOOL_FRESH_MS} />
          </Card>
        </Link>

        <Link href="/explorer/vitals">
          <Card variant="metric" accent="violet" animateEntrance={false}>
            <MetricValue
              icon="⏳"
              value={daysUntilHalving === null ? "—" : integers.format(daysUntilHalving)}
              label={t.hero.daysToHalving}
              sublabel={blocksUntilHalving === null ? undefined : `${integers.format(blocksUntilHalving)} ${t.hero.blocks}`}
              accent="violet"
            />
            <ReadingProvenance reading={height} now={now} maxAgeMs={NETWORK_FRESH_MS} />
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/explorer/fees" className="block w-full h-full">
          <Card variant="panel" className="h-full" animateEntrance={false}>
            <PanelHeader>{t.hero.feeMarket}</PanelHeader>
            <dl className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
              {([
                [t.hero.express, fees?.value.fast, "text-red-400"],
                [t.hero.standard, fees?.value.medium, "text-amber-400"],
                [t.hero.economy, fees?.value.slow, "text-emerald-400"],
              ] as const).map(([label, fee, color]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className={`font-mono font-bold ${color}`}>{fee == null ? "—" : `${formatSatVb(fee)} sat/vB`}</dd>
                </div>
              ))}
            </dl>
            <ReadingProvenance reading={fees} now={now} maxAgeMs={NETWORK_FRESH_MS} />
            {history && history.value.length > 0 ? (
              <>
              <div className="mt-3 h-24 rounded-lg border border-slate-800/80 bg-slate-950/50 px-2 py-1.5">
                <SafeResponsiveContainer width="100%" height="100%" minHeight={64}>
                  <AreaChart data={history.value} margin={{ top: 4, right: 4, left: 2, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hero-fee-economy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="hero-fee-standard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="hero-fee-express" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <ReferenceArea
                      y1={0}
                      y2={1}
                      fill="#10b981"
                      fillOpacity={0.06}
                    />
                    <ReferenceArea
                      y1={1}
                      y2={5}
                      fill="#f59e0b"
                      fillOpacity={0.05}
                    />
                    <ReferenceArea
                      y1={5}
                      y2={historyMaxFee}
                      fill="#ef4444"
                      fillOpacity={0.05}
                    />
                    <CartesianGrid strokeDasharray="3 4" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="timestamp" type="number" domain={["dataMin", "dataMax"]} hide />
                    <YAxis hide scale="linear" domain={[0, historyMaxFee]} />
                    <ReferenceLine y={1} stroke="#38bdf8" strokeDasharray="4 4" strokeOpacity={0.55} />
                    <Tooltip
                      cursor={{ stroke: "#94a3b8", strokeDasharray: "6 6", strokeWidth: 1 }}
                      content={<HeroFeeTooltipContent />}
                    />
                    <Area
                      type="monotoneX"
                      dataKey="slow"
                      stroke="#10b981"
                      fill="url(#hero-fee-economy)"
                      strokeWidth={1.6}
                      name={t.hero.economy}
                      isAnimationActive={false}
                      activeDot={{ r: 3, stroke: "#052e16", strokeWidth: 1.2 }}
                    />
                    <Area
                      type="monotoneX"
                      dataKey="medium"
                      stroke="#f59e0b"
                      fill="url(#hero-fee-standard)"
                      strokeWidth={1.6}
                      name={t.hero.standard}
                      isAnimationActive={false}
                      activeDot={{ r: 3, stroke: "#451a03", strokeWidth: 1.2 }}
                    />
                    <Area
                      type="monotoneX"
                      dataKey="fast"
                      stroke="#ef4444"
                      fill="url(#hero-fee-express)"
                      strokeWidth={1.8}
                      name={t.hero.express}
                      isAnimationActive={false}
                      activeDot={{ r: 3, stroke: "#450a0a", strokeWidth: 1.2 }}
                    />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>
                <ReadingProvenance reading={history} now={now} maxAgeMs={HISTORY_FRESH_MS} />
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-400">{historyPending ? t.common.loading : t.hero.noFeeHistory}</p>
            )}
          </Card>
        </Link>

        <Link href="/explorer/mempool" className="block w-full h-full">
          <Card variant="panel" className="h-full" animateEntrance={false}>
            <PanelHeader>{t.hero.recentTransactions}</PanelHeader>
            {recent && recent.value.length > 0 ? (
              <ul className="space-y-1.5">
                {recent.value.map(tx => (
                  <li
                    key={tx.txid}
                    className="rounded-lg border border-cyan-500/20 bg-slate-950/50 px-3 py-1.5 transition-colors group-hover:border-cyan-400/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs text-cyan-300">TX: {tx.txid.slice(0, 8)}...{tx.txid.slice(-4)}</p>
                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${getFeeRateTone(tx.feeRate)}`}>
                        {tx.feeRate === null ? "—" : `${formatSatVb(tx.feeRate)} sat/vB`}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-slate-400">
                      {tx.vsize !== null && <span>{integers.format(tx.vsize)} vB</span>}
                      <span>{formatTxAge(tx.time, now, locale, t.hero.unknownTransactionTime)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : recent ? (
              <p className="text-xs text-slate-400">{t.hero.noRecentTransactions}</p>
            ) : recentPending ? (
              <p className="text-xs text-slate-400">{t.common.loading}</p>
            ) : null}
            {(!recentPending || recent) && <ReadingProvenance reading={recent} now={now} maxAgeMs={MEMPOOL_FRESH_MS} />}
            <p className="pt-2 text-[10px] uppercase tracking-wider text-cyan-400/90">{t.hero.viewFullMempool}</p>
          </Card>
        </Link>
      </div>

      {!corePending && unavailable && (
        <button
          type="button"
          onClick={() => { retryCore(); retryRecent(); retryHistory(); }}
          className="mt-3 min-h-11 rounded border border-slate-700 px-3 text-xs text-slate-300 focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          {t.hero.retry}
        </button>
      )}
    </div>
  );
}
