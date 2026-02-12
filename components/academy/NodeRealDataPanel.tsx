"use client";

import type { AcademyNodeContent } from "@/lib/content/schema";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";

function metricValueToString(
  key: AcademyNodeContent["realData"][number]["key"],
  metrics: ReturnType<typeof useBitcoinLiveMetrics>["metrics"],
): string {
  if (!metrics) return "Data temporarily unavailable";

  switch (key) {
    case "blockHeight":
      return metrics.blockHeight?.toLocaleString() ?? "Data temporarily unavailable";
    case "feeFast":
      return metrics.feeFast !== null ? `${metrics.feeFast} sat/vB` : "Data temporarily unavailable";
    case "feeHalfHour":
      return metrics.feeHalfHour !== null ? `${metrics.feeHalfHour} sat/vB` : "Data temporarily unavailable";
    case "feeHour":
      return metrics.feeHour !== null ? `${metrics.feeHour} sat/vB` : "Data temporarily unavailable";
    case "hashrateEh":
      return metrics.hashrateEh !== null ? `${metrics.hashrateEh} EH/s` : "Data temporarily unavailable";
    case "blocksUntilHalving":
      return metrics.blocksUntilHalving?.toLocaleString() ?? "Data temporarily unavailable";
    case "daysUntilHalving":
      return metrics.daysUntilHalving?.toLocaleString() ?? "Data temporarily unavailable";
    case "lastUpdated":
      return new Date(metrics.lastUpdated).toLocaleString();
    default:
      return "Data temporarily unavailable";
  }
}

export default function NodeRealDataPanel({ content }: { content: AcademyNodeContent }) {
  const { metrics, status, retry } = useBitcoinLiveMetrics();

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Real Data</h2>
        {status === "error" ? (
          <button
            type="button"
            onClick={retry}
            className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-300"
          >
            Retry
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {content.realData.map((item) => (
          <div key={`${content.id}-${item.key}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm text-slate-100">
              {status === "loading" && !metrics ? "Loading..." : metricValueToString(item.key, metrics)}
            </p>
            <p className="mt-1 text-xs text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
