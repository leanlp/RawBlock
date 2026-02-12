"use client";

import { useMemo } from "react";
import Header from "../../../components/Header";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState, LoadingState } from "../../../components/EmptyState";
import { useBitcoinFeeBands } from "@/hooks/useBitcoinFeeBands";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { formatSatVb } from "@/lib/feeBands";

export default function FeesPage() {
  const { bands: feeBands, loading: bandsLoading, error: bandsError, retry: retryBands } = useBitcoinFeeBands(30_000);

  const hasFeeBands = feeBands.length > 0;
  const cardFees = useMemo(
    () => ({
      // Keep cards and chart fully aligned by using the same next-block fee-band source.
      fast: feeBands[0]?.high ?? null,
      standard: feeBands[0]?.median ?? null,
      economy: feeBands[0]?.low ?? null,
    }),
    [feeBands],
  );

  const formatFee = (value: number | null) => {
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
              Live mempool block fee bands from public APIs, aligned with the summary cards.
            </p>
          </div>
        </div>

        {bandsLoading && !hasFeeBands && <LoadingState message="Analyzing mempool dynamics..." />}
        {bandsError && !hasFeeBands && (
          <ErrorState message={bandsError ?? "Unable to load fee market data."} onRetry={retryBands} />
        )}

        {!(bandsLoading && !hasFeeBands) && !(bandsError && !hasFeeBands) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                Economy (Low Priority)
              </h3>
              <div className="text-4xl font-black text-slate-200">{formatFee(cardFees.economy)}</div>
              <p className="text-xs text-slate-400 mt-2">~1 Hour Confirmation</p>
            </div>

            <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                Standard (Recommended)
              </h3>
              <div className="text-5xl font-black text-amber-400">{formatFee(cardFees.standard)}</div>
              <p className="text-xs text-slate-400 mt-2">~30 Min Confirmation</p>
            </div>

            <div className="bg-slate-900/50 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                Express (Next Block)
              </h3>
              <div className="text-4xl font-black text-red-400">{formatFee(cardFees.fast)}</div>
              <p className="text-xs text-slate-400 mt-2">~10 Min Confirmation</p>
            </div>

            <div className="md:col-span-3 bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm min-h-[420px]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Fee Bands By Upcoming Mempool Blocks
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Low
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Median
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    High
                  </span>
                </div>
              </div>

              <div className="h-[350px] w-full min-w-0">
                {bandsLoading && !hasFeeBands ? (
                  <LoadingState message="Loading live fee bands..." />
                ) : bandsError && !hasFeeBands ? (
                  <ErrorState message={bandsError} onRetry={retryBands} />
                ) : (
                  <SafeResponsiveContainer width="100%" height="100%">
                    <LineChart data={feeBands} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="bucket" stroke="#475569" tick={{ fontSize: 12 }} />
                      <YAxis
                        scale="linear"
                        domain={[0, "auto"]}
                        stroke="#475569"
                        tick={{ fontSize: 12 }}
                        label={{ value: "sat/vB", angle: -90, position: "insideLeft", fill: "#475569" }}
                      />
                      <ReferenceLine
                        y={cardFees.standard ?? undefined}
                        stroke="#e2e8f0"
                        strokeDasharray="8 6"
                        strokeOpacity={0.75}
                      />
                      <Tooltip
                        cursor={{ stroke: "#94a3b8", strokeDasharray: "6 6", strokeWidth: 1 }}
                        formatter={(value, name) => [
                          `${formatSatVb(Number(value))} sat/vB`,
                          String(name),
                        ]}
                        labelFormatter={(label) => `${label}`}
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#334155",
                          color: "#f1f5f9",
                          borderRadius: "12px",
                          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
                        }}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="high"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        name="High"
                      />
                      <Line
                        type="stepAfter"
                        dataKey="median"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        name="Median"
                      />
                      <Line
                        type="stepAfter"
                        dataKey="low"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        name="Low"
                      />
                    </LineChart>
                  </SafeResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
