"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/Header";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState, LoadingState } from "../../../components/EmptyState";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";
import SafeResponsiveContainer from "@/components/charts/SafeResponsiveContainer";

type FeeBandPoint = {
  bucket: string;
  low: number;
  median: number;
  high: number;
};

type FeeBlockResponse = {
  ok: boolean;
  error?: string;
  blocks?: Array<{
    medianFee: number;
    feeRange: number[];
  }>;
};

function normalizeSatVb(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
}

export default function FeesPage() {
  const { metrics, status, error, retry } = useBitcoinLiveMetrics(30_000);
  const [feeBands, setFeeBands] = useState<FeeBandPoint[]>([]);
  const [bandsLoading, setBandsLoading] = useState(true);
  const [bandsError, setBandsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchFeeBands = async () => {
      setBandsLoading(true);
      setBandsError(null);
      try {
        const response = await fetch("/api/bitcoin/fee-blocks", { cache: "no-store" });
        const payload = (await response.json()) as FeeBlockResponse;

        if (!response.ok || !payload.ok || !payload.blocks?.length) {
          throw new Error(payload.error ?? "Unable to fetch fee blocks");
        }

        const nextBands = payload.blocks.slice(0, 8).map((block, idx) => {
          const range = block.feeRange ?? [];
          const lowRaw = range[0] ?? block.medianFee ?? 0;
          const highRaw = range.length ? range[range.length - 1] : block.medianFee ?? 0;
          const medianRaw = block.medianFee ?? lowRaw;

          return {
            bucket: `Next ${idx + 1}`,
            low: Number(lowRaw.toFixed(2)),
            median: Number(medianRaw.toFixed(2)),
            high: Number(highRaw.toFixed(2)),
          };
        });

        if (mounted) setFeeBands(nextBands);
      } catch (fetchError) {
        if (mounted) {
          setBandsError(
            fetchError instanceof Error ? fetchError.message : "Unable to fetch fee bands",
          );
          setFeeBands([]);
        }
      } finally {
        if (mounted) setBandsLoading(false);
      }
    };

    fetchFeeBands();
    const timer = window.setInterval(fetchFeeBands, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const cardFees = useMemo(
    () => ({
      fast: normalizeSatVb(metrics?.feeFast),
      standard: normalizeSatVb(metrics?.feeHalfHour),
      economy: normalizeSatVb(metrics?.feeHour),
    }),
    [metrics?.feeFast, metrics?.feeHalfHour, metrics?.feeHour],
  );

  const formatFee = (value: number | null) => (value === null ? "Data temporarily unavailable" : `${value} sat/vB`);

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
              Recommended fees plus live mempool block fee bands from public APIs.
            </p>
          </div>
        </div>

        {status === "loading" && !metrics && <LoadingState message="Analyzing mempool dynamics..." />}
        {status === "error" && !metrics && (
          <ErrorState message={error ?? "Unable to load fee market data."} onRetry={retry} />
        )}

        {!(status === "loading" && !metrics) && !(status === "error" && !metrics) && (
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
                {bandsLoading && feeBands.length === 0 ? (
                  <LoadingState message="Loading live fee bands..." />
                ) : bandsError && feeBands.length === 0 ? (
                  <ErrorState message={bandsError} onRetry={() => window.location.reload()} />
                ) : (
                  <SafeResponsiveContainer width="100%" height="100%">
                    <AreaChart data={feeBands}>
                      <defs>
                        <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorMedian" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="bucket" stroke="#475569" tick={{ fontSize: 12 }} />
                      <YAxis
                        stroke="#475569"
                        tick={{ fontSize: 12 }}
                        label={{ value: "sat/vB", angle: -90, position: "insideLeft", fill: "#475569" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          color: "#f1f5f9",
                        }}
                      />
                      <Area type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} fill="url(#colorHigh)" name="High" />
                      <Area type="monotone" dataKey="median" stroke="#f59e0b" strokeWidth={2} fill="url(#colorMedian)" name="Median" />
                      <Area type="monotone" dataKey="low" stroke="#10b981" strokeWidth={2} fill="url(#colorLow)" name="Low" />
                    </AreaChart>
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
