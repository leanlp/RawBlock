"use client";

import { useMemo, useState } from "react";
import AcademyNodeReferenceChip from "@/components/academy/AcademyNodeReferenceChip";
import { getResearchAssumptions } from "@/lib/content/research";

export default function AssumptionsResearchPage() {
  const assumptions = getResearchAssumptions();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [severity, setSeverity] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [linkedNode, setLinkedNode] = useState<string>("");

  const categoryOptions = useMemo(() => [...new Set(assumptions.map((v) => v.category))].sort(), [assumptions]);

  const filtered = assumptions.filter((item) => {
    if (severity && item.severity !== severity) return false;
    if (category && item.category !== category) return false;
    if (linkedNode && !item.linkedNodeIds.includes(linkedNode)) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Research</p>
          <h1 className="text-3xl font-semibold">Security Assumptions</h1>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4">
          <div className="flex items-center justify-between sm:hidden">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Filters</p>
            <button
              type="button"
              aria-controls="assumption-filters"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
            >
              {filtersOpen ? "Hide" : "Filters"}
              <span aria-hidden="true" className={`text-[10px] transition-transform ${filtersOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
          </div>

          <div
            id="assumption-filters"
            className={`${filtersOpen ? "mt-3 grid" : "hidden"} gap-3 sm:mt-0 sm:flex sm:flex-wrap sm:items-center`}
          >
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:min-w-[10rem] sm:w-auto">
              <option value="">All severities</option>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:min-w-[10rem] sm:w-auto">
              <option value="">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <input
              value={linkedNode}
              onChange={(e) => setLinkedNode(e.target.value)}
              placeholder="Linked node id"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:min-w-[10rem] sm:w-auto"
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-sm font-medium text-slate-100">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.summary}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <p><span className="text-slate-500">Type:</span> {item.assumptionType}</p>
                  <p><span className="text-slate-500">Severity:</span> {item.severity}</p>
                </div>
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
                <th className="px-3 py-2">Assumption</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Linked Nodes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-900/80 align-top">
                  <td className="px-3 py-2">
                    <p className="text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.summary}</p>
                  </td>
                  <td className="px-3 py-2">{item.assumptionType}</td>
                  <td className="px-3 py-2">{item.severity}</td>
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
