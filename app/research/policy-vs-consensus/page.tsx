"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import AcademyNodeReferenceChip from "@/components/academy/AcademyNodeReferenceChip";
import { getResearchPolicyVsConsensus } from "@/lib/content/research";
import { useTranslation } from "@/lib/i18n";

export default function PolicyVsConsensusResearchPage() {
  const { locale } = useTranslation();
  const copy = locale === "es"
    ? {
        kicker: "Investigacion",
        title: "Politica vs Consenso",
        filters: "Filtros",
        hide: "Ocultar",
        allLayers: "Todas las capas",
        linkedNodePlaceholder: "ID de nodo vinculado",
        layer: "Capa",
        rule: "Regla",
        rationale: "Razon",
        linkedNodes: "Nodos Vinculados",
      }
    : {
        kicker: "Research",
        title: "Policy vs Consensus",
        filters: "Filters",
        hide: "Hide",
        allLayers: "All layers",
        linkedNodePlaceholder: "Linked node id",
        layer: "Layer",
        rule: "Rule",
        rationale: "Rationale",
        linkedNodes: "Linked Nodes",
      };
  const rules = getResearchPolicyVsConsensus(locale);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [layer, setLayer] = useState<string>("");
  const [linkedNode, setLinkedNode] = useState<string>("");

  const layerOptions = useMemo(() => [...new Set(rules.map((v) => v.layer))].sort(), [rules]);

  const filtered = rules.filter((item) => {
    if (layer && item.layer !== layer) return false;
    if (linkedNode && !item.linkedNodeIds.includes(linkedNode)) return false;
    return true;
  });

  return (
    <main className="page-shell bg-slate-950">
      <div className="page-wrap-wide">
        <div className="md:hidden">
          <Header />
        </div>
        <header className="page-header">
          <p className="page-kicker">{copy.kicker}</p>
          <h1 className="page-title">{copy.title}</h1>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4">
          <div className="flex items-center justify-between md:hidden">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{copy.filters}</p>
            <button
              type="button"
              aria-controls="policy-filters"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
            >
              {filtersOpen ? copy.hide : copy.filters}
              <span aria-hidden="true" className={`text-[10px] transition-transform ${filtersOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
          </div>

          <div
            id="policy-filters"
            className={`${filtersOpen ? "mt-3 grid" : "hidden"} gap-3 md:mt-0 md:grid md:grid-cols-2 xl:flex xl:flex-wrap xl:items-center`}
          >
            <select value={layer} onChange={(e) => setLayer(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:min-w-[10rem] sm:w-auto">
              <option value="">{copy.allLayers}</option>
              {layerOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <input
              value={linkedNode}
              onChange={(e) => setLinkedNode(e.target.value)}
              placeholder={copy.linkedNodePlaceholder}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:min-w-[10rem] sm:w-auto"
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-sm font-medium text-slate-100">{item.title}</p>
                <div className="mt-2 text-xs text-slate-300">
                  <p><span className="text-slate-500">{copy.layer}:</span> {item.layer}</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">{item.rationale}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.linkedNodeIds.map((nodeId) => (
                    <AcademyNodeReferenceChip key={`${item.id}-${nodeId}`} nodeId={nodeId} />
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-3 py-2">{copy.rule}</th>
                  <th className="px-3 py-2">{copy.layer}</th>
                  <th className="px-3 py-2">{copy.rationale}</th>
                  <th className="px-3 py-2">{copy.linkedNodes}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-slate-900/80 align-top">
                    <td className="px-3 py-2 text-slate-100">{item.title}</td>
                    <td className="px-3 py-2">{item.layer}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{item.rationale}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {item.linkedNodeIds.map((nodeId) => (
                          <AcademyNodeReferenceChip key={`${item.id}-${nodeId}`} nodeId={nodeId} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
