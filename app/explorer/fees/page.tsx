"use client";

import { useMemo } from "react";
import Header from "../../../components/Header";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState, LoadingState } from "../../../components/EmptyState";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { formatSatVb } from "@/lib/feeBands";
import { formatFeeTime, useFeeMarketData } from "@/hooks/useFeeMarketData";

type FeeTooltipProps = {
  active?: boolean;
  label?: number | string;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
};

function FeeTooltipContent({ active, label, payload }: FeeTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[210px] rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {formatFeeTime(Number(label))}
      </p>
      <div className="space-y-1.5 text-xs">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color ?? "#94a3b8" }} />
              {entry.name}
            </span>
            <span className="font-mono font-semibold text-slate-100">{formatSatVb(entry.value ?? 0)} sat/vB</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeesPage() {
  const { history, cardFees, stats, longHorizon, currentTimestamp, loading, error, hasData, retry } = useFeeMarketData(30_000);

  const chartMeta = useMemo(() => {
    if (history.length === 0) return null;

    const historyMin = Math.min(...history.map((point) => point.slow));
    const historyMax = Math.max(...history.map((point) => point.fast));
    const observedMin = stats?.minObservedSatVB ?? historyMin;
    const observedAvg = stats?.avgObservedSatVB ?? (historyMin + historyMax) / 2;
    const policyFloor = stats?.policyFloorSatVB ?? 1;
    const yMax = Math.max(3, Math.ceil(historyMax * 1.25));
    const latest = history[history.length - 1];
    const first = history[0];
    const expressDelta = latest.fast - first.fast;
    const syncLagSeconds =
      currentTimestamp !== null ? Math.max(0, Math.round(Math.abs(currentTimestamp - latest.timestamp) / 1000)) : null;

    return {
      historyMin,
      historyMax,
      observedMin,
      observedAvg,
      policyFloor,
      yMax,
      calmBandTop: Math.min(Math.max(policyFloor, 0.5), yMax),
      normalBandTop: Math.min(5, yMax),
      range: historyMax - historyMin,
      expressDelta,
      syncLagSeconds,
    };
  }, [history, stats, currentTimestamp]);

  const renderFee = (value: number | null) => {
    const formatted = formatSatVb(value);
    return formatted === "Data temporarily unavailable" ? formatted : `${formatted} sat/vB`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header />

        <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
              Fee Market Intelligence
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Live recommended-fee trend from the same backend feed used for the summary cards.
            </p>
          </div>
        </div>

        {loading && !hasData && <LoadingState message="Connecting to fee market feed..." />}
        {!loading && error && !hasData && <ErrorState message={error} onRetry={retry} />}

        {hasData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center mb-2">
                Economy (Low Priority)
              </h3>
              <div className="text-center break-words text-3xl md:text-4xl font-black text-slate-200 leading-tight">{renderFee(cardFees.slow)}</div>
              <p className="text-xs text-slate-400 text-center mt-2">~1 Hour Confirmation</p>
            </div>

            <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center mb-2">
                Standard (Recommended)
              </h3>
              <div className="text-center break-words text-3xl md:text-4xl font-black text-amber-400 leading-tight">{renderFee(cardFees.medium)}</div>
              <p className="text-xs text-slate-400 text-center mt-2">~30 Min Confirmation</p>
            </div>

            <div className="bg-slate-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center mb-2">
                Express (Next Block)
              </h3>
              <div className="text-center break-words text-3xl md:text-4xl font-black text-red-400 leading-tight">{renderFee(cardFees.fast)}</div>
              <p className="text-xs text-slate-400 text-center mt-2">~10 Min Confirmation</p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm min-h-[420px] relative">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_52%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_58%)]" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                    24-Hour Fee Trend
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Regime overlays highlight calm, normal and spike pressure zones.
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Economy
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Standard
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    Express
                  </span>
                </div>
              </div>

              {chartMeta ? (
                <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-slate-300">
                    24h range: {formatSatVb(chartMeta.range)} sat/vB
                  </span>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                    Min observed: {formatSatVb(chartMeta.observedMin)} sat/vB
                  </span>
                  <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                    Avg observed: {formatSatVb(chartMeta.observedAvg)} sat/vB
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 ${chartMeta.expressDelta >= 0
                      ? "border-red-500/25 bg-red-500/10 text-red-300"
                      : "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
                      }`}
                  >
                    Express Δ24h: {chartMeta.expressDelta >= 0 ? "+" : ""}
                    {formatSatVb(chartMeta.expressDelta)} sat/vB
                  </span>
                  {chartMeta.syncLagSeconds !== null ? (
                    <span
                      className={`rounded-full border px-3 py-1 ${chartMeta.syncLagSeconds <= 60
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                        : chartMeta.syncLagSeconds <= 180
                          ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                          : "border-red-500/25 bg-red-500/10 text-red-300"
                        }`}
                    >
                      Sync lag: {chartMeta.syncLagSeconds}s
                    </span>
                  ) : null}
                  {longHorizon ? (
                    <span
                      className={`rounded-full border px-3 py-1 ${longHorizon.satVB < (chartMeta.policyFloor ?? 1)
                        ? "border-violet-500/35 bg-violet-500/10 text-violet-300"
                        : "border-slate-700/80 bg-slate-900/70 text-slate-300"
                        }`}
                    >
                      Long horizon ({longHorizon.targetBlocks} blocks): {formatSatVb(longHorizon.satVB)} sat/vB
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="h-[350px] w-full min-w-0">
                {history.length === 0 ? (
                  <ErrorState
                    message="Historical fee data is temporarily unavailable."
                    onRetry={retry}
                  />
                ) : (
                  <SafeResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <AreaChart data={history} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="fee-economy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.34} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fee-standard" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fee-express" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <ReferenceArea
                        y1={0}
                        y2={chartMeta?.calmBandTop ?? 1}
                        fill="#10b981"
                        fillOpacity={0.06}
                      />
                      <ReferenceArea
                        y1={chartMeta?.calmBandTop ?? 1}
                        y2={chartMeta?.normalBandTop ?? 5}
                        fill="#f59e0b"
                        fillOpacity={0.05}
                      />
                      <ReferenceArea
                        y1={chartMeta?.normalBandTop ?? 5}
                        y2={chartMeta?.yMax ?? "auto"}
                        fill="#ef4444"
                        fillOpacity={0.05}
                      />
                      <CartesianGrid strokeDasharray="3 4" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatFeeTime}
                        stroke="#475569"
                        tick={{ fontSize: 12 }}
                        minTickGap={48}
                      />
                      <YAxis
                        scale="linear"
                        domain={[0, chartMeta?.yMax ?? "auto"]}
                        stroke="#475569"
                        tick={{ fontSize: 12 }}
                        label={{ value: "sat/vB", angle: -90, position: "insideLeft", fill: "#475569" }}
                      />
                      <ReferenceLine
                        y={chartMeta?.policyFloor ?? 1}
                        stroke="#38bdf8"
                        strokeDasharray="4 4"
                        strokeOpacity={0.7}
                        label={{
                          value: `${formatSatVb(chartMeta?.policyFloor ?? 1)} sat/vB node relay floor`,
                          fill: "#38bdf8",
                          fontSize: 10,
                          position: "insideTopRight",
                        }}
                      />
                      <Tooltip
                        cursor={{ stroke: "#94a3b8", strokeDasharray: "6 6", strokeWidth: 1 }}
                        content={<FeeTooltipContent />}
                      />

                      <Area
                        type="monotoneX"
                        dataKey="slow"
                        stroke="#10b981"
                        strokeWidth={2.2}
                        fill="url(#fee-economy)"
                        name="Economy"
                        activeDot={{ r: 4, stroke: "#052e16", strokeWidth: 1.5 }}
                      />
                      <Area
                        type="monotoneX"
                        dataKey="medium"
                        stroke="#f59e0b"
                        strokeWidth={2.2}
                        fill="url(#fee-standard)"
                        name="Standard"
                        activeDot={{ r: 4, stroke: "#451a03", strokeWidth: 1.5 }}
                      />
                      <Area
                        type="monotoneX"
                        dataKey="fast"
                        stroke="#ef4444"
                        strokeWidth={2.4}
                        fill="url(#fee-express)"
                        name="Express"
                        activeDot={{ r: 4, stroke: "#450a0a", strokeWidth: 1.5 }}
                      />
                    </AreaChart>
                  </SafeResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
