"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getResearchPolicyVsConsensus } from "@/lib/content/research";
import { graphStore } from "@/lib/graph/store";

export default function PolicyVsConsensusResearchPage() {
  const rules = getResearchPolicyVsConsensus();
  const [layer, setLayer] = useState<string>("");
  const [linkedNode, setLinkedNode] = useState<string>("");

  const layerOptions = useMemo(() => [...new Set(rules.map((v) => v.layer))].sort(), [rules]);

  const filtered = rules.filter((item) => {
    if (layer && item.layer !== layer) return false;
    if (linkedNode && !item.linkedNodeIds.includes(linkedNode)) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Research</p>
          <h1 className="text-3xl font-semibold">Policy vs Consensus</h1>
        </header>

        <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-2">
          <select value={layer} onChange={(e) => setLayer(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">All layers</option>
            {layerOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input value={linkedNode} onChange={(e) => setLinkedNode(e.target.value)} placeholder="Linked node id" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
        </section>

        <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-2">Rule</th>
                <th className="px-3 py-2">Layer</th>
                <th className="px-3 py-2">Rationale</th>
                <th className="px-3 py-2">Linked Nodes</th>
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
                        <Link key={`${item.id}-${nodeId}`} href={`/academy/${nodeId}`} className="rounded border border-slate-700 px-2 py-0.5 text-xs text-cyan-300 hover:border-cyan-500">
                          {graphStore.getNode(nodeId)?.title ?? nodeId}
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
