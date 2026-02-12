"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSecurityAssumptions } from "@/lib/graph/assumptionRegistry";
import {
  buildResearchQueryString,
  parseResearchQuery,
  type ResearchQuery,
} from "@/lib/research/query";

export default function AssumptionsResearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useMemo(() => parseResearchQuery(searchParams), [searchParams]);
  const assumptions = getSecurityAssumptions();

  const updateQuery = (patch: Partial<ResearchQuery>) => {
    const nextQuery: ResearchQuery = { ...query, ...patch };
    const queryString = buildResearchQueryString(nextQuery);
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const filtered = useMemo(
    () =>
      assumptions.filter((assumption) => {
        if (!query.layer) return true;
        if (query.layer === "network") return assumption.category === "network";
        if (query.layer === "economic") return assumption.category === "economic";
        return true;
      }),
    [assumptions, query.layer],
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Research</p>
          <h1 className="text-3xl font-semibold">Security Assumptions</h1>
        </header>

        <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">Severity</span>
            <select
              value={query.severity ?? ""}
              onChange={(event) =>
                updateQuery({
                  severity: (event.target.value || undefined) as ResearchQuery["severity"],
                })
              }
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">Year</span>
            <input
              value={query.year ? String(query.year) : ""}
              onChange={(event) =>
                updateQuery({
                  year: event.target.value
                    ? Number.parseInt(event.target.value, 10)
                    : undefined,
                })
              }
              placeholder="Any"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">Layer</span>
            <select
              value={query.layer ?? ""}
              onChange={(event) =>
                updateQuery({
                  layer: (event.target.value || undefined) as ResearchQuery["layer"],
                })
              }
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="">All</option>
              <option value="consensus">Consensus</option>
              <option value="policy">Policy</option>
              <option value="network">Network</option>
              <option value="mining">Mining</option>
              <option value="economic">Economic</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">Affected Version</span>
            <input
              value={query.affectedVersion ?? ""}
              onChange={(event) =>
                updateQuery({
                  affectedVersion: event.target.value || undefined,
                })
              }
              placeholder="Any"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
        </section>

        <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-2">Statement</th>
                <th className="px-3 py-2">Layer</th>
                <th className="px-3 py-2">Depends On</th>
                <th className="px-3 py-2">Weakened By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((assumption) => (
                <tr key={assumption.id} className="border-b border-slate-900/80 align-top">
                  <td className="px-3 py-2 text-slate-100">{assumption.statement}</td>
                  <td className="px-3 py-2">{assumption.category}</td>
                  <td className="px-3 py-2">{assumption.dependsOn.join(", ")}</td>
                  <td className="px-3 py-2">{assumption.weakenedBy?.join(", ") ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
