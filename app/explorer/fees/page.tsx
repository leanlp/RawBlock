"use client";

import Header from "../../../components/Header";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState, LoadingState } from "../../../components/EmptyState";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";
import { formatSatVb } from "@/lib/feeBands";
import { formatFeeTime, useFeeMarketData } from "@/hooks/useFeeMarketData";

export default function FeesPage() {
  const { history, cardFees, loading, error, hasData, retry } = useFeeMarketData(30_000);

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

        {loading && !hasData && <LoadingState message="Analyzing mempool dynamics..." />}
        {!loading && error && !hasData && <ErrorState message={error} onRetry={retry} />}

        {hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div className="md:col-span-3 bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm min-h-[420px]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  24-Hour Fee Trend
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono">
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

              <div className="h-[350px] w-full min-w-0">
                {history.length === 0 ? (
                  <ErrorState
                    message="Historical fee data is temporarily unavailable."
                    onRetry={retry}
                  />
                ) : (
                  <SafeResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <AreaChart data={history} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fee-economy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fee-standard" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fee-express" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                        scale="linear"
                        domain={[0, "auto"]}
                        stroke="#475569"
                        tick={{ fontSize: 12 }}
                        label={{ value: "sat/vB", angle: -90, position: "insideLeft", fill: "#475569" }}
                      />
                      <Tooltip
                        cursor={{ stroke: "#94a3b8", strokeDasharray: "6 6", strokeWidth: 1 }}
                        labelFormatter={(value) => formatFeeTime(Number(value))}
                        formatter={(value, name) => [
                          `${formatSatVb(Number(value))} sat/vB`,
                          String(name),
                        ]}
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#334155",
                          color: "#f1f5f9",
                          borderRadius: "12px",
                          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="slow"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#fee-economy)"
                        name="Economy"
                        activeDot={{ r: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="medium"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#fee-standard)"
                        name="Standard"
                        activeDot={{ r: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="fast"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#fee-express)"
                        name="Express"
                        activeDot={{ r: 4 }}
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
