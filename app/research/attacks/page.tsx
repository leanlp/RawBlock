"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getResearchAttacks } from "@/lib/content/research";
import { graphStore } from "@/lib/graph/store";

export default function AttacksResearchPage() {
  const attacks = getResearchAttacks();
  const [severity, setSeverity] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [linkedNode, setLinkedNode] = useState<string>("");

  const yearOptions = useMemo(() => [...new Set(attacks.map((v) => String(v.year)))].sort(), [attacks]);
  const categoryOptions = useMemo(() => [...new Set(attacks.map((v) => v.category))].sort(), [attacks]);

  const filtered = attacks.filter((item) => {
    if (severity && item.severity !== severity) return false;
    if (year && String(item.year) !== year) return false;
    if (category && item.category !== category) return false;
    if (linkedNode && !item.linkedNodeIds.includes(linkedNode)) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Research</p>
          <h1 className="text-3xl font-semibold">Attack Models</h1>
        </header>

        <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-4">
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">All severities</option>
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">All years</option>
            {yearOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input value={linkedNode} onChange={(e) => setLinkedNode(e.target.value)} placeholder="Linked node id" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
        </section>

        <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Layer</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Observed</th>
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
                  <td className="px-3 py-2">{item.targetLayer}</td>
                  <td className="px-3 py-2">{item.severity}</td>
                  <td className="px-3 py-2">{item.observedInWild ? "Yes" : "No"}</td>
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
