"use client";

import type { AcademyNodeContent } from "@/lib/content/schema";
import { useBitcoinLiveMetrics } from "@/hooks/useBitcoinLiveMetrics";
import { useTranslation } from "@/lib/i18n";

function metricValueToString(
  key: AcademyNodeContent["realData"][number]["key"],
  metrics: ReturnType<typeof useBitcoinLiveMetrics>["metrics"],
  unavailableLabel: string,
  locale: string,
): string {
  if (!metrics) return unavailableLabel;

  switch (key) {
    case "blockHeight":
      return metrics.blockHeight?.toLocaleString(locale) ?? unavailableLabel;
    case "feeFast":
      return metrics.feeFast !== null ? `${metrics.feeFast} sat/vB` : unavailableLabel;
    case "feeHalfHour":
      return metrics.feeHalfHour !== null ? `${metrics.feeHalfHour} sat/vB` : unavailableLabel;
    case "feeHour":
      return metrics.feeHour !== null ? `${metrics.feeHour} sat/vB` : unavailableLabel;
    case "hashrateEh":
      return metrics.hashrateEh !== null ? `${metrics.hashrateEh} EH/s` : unavailableLabel;
    case "blocksUntilHalving":
      return metrics.blocksUntilHalving?.toLocaleString(locale) ?? unavailableLabel;
    case "daysUntilHalving":
      return metrics.daysUntilHalving?.toLocaleString(locale) ?? unavailableLabel;
    case "lastUpdated":
      return new Date(metrics.lastUpdated).toLocaleString(locale);
    default:
      return unavailableLabel;
  }
}

export default function NodeRealDataPanel({ content }: { content: AcademyNodeContent }) {
  const { metrics, status, retry } = useBitcoinLiveMetrics();
  const { locale } = useTranslation();
  const copy = locale === "es"
    ? {
        unavailable: "Datos temporalmente no disponibles",
        title: "Datos Reales",
        retry: "Reintentar",
        loading: "Cargando...",
      }
    : {
        unavailable: "Data temporarily unavailable",
        title: "Real Data",
        retry: "Retry",
        loading: "Loading...",
      };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        {status === "error" ? (
          <button
            type="button"
            onClick={retry}
            className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-300"
          >
            {copy.retry}
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {content.realData.map((item) => (
          <div key={`${content.id}-${item.key}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm text-slate-100">
              {status === "loading" && !metrics ? copy.loading : metricValueToString(item.key, metrics, copy.unavailable, locale)}
            </p>
            <p className="mt-1 text-xs text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
