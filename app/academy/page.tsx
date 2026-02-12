"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAllPaths } from "@/lib/graph/pathEngine";
import { graphStore } from "@/lib/graph/store";

export default function AcademyLandingPage() {
  const paths = getAllPaths();
  const [query, setQuery] = useState("");

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return graphStore.nodes;
    return graphStore.nodes.filter(
      (node) =>
        node.title.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Academy</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Graph-Driven Learning</h1>
          <p className="text-sm text-slate-400">
            Learn Bitcoin protocol concepts through structured graph nodes and ordered paths.
          </p>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-3 text-lg font-semibold">Core Learning Paths</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {paths.map((path) => (
              <Link
                key={path.id}
                href={`/paths/${path.id}`}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 hover:border-cyan-500/60"
              >
                <p className="text-slate-100">{path.title}</p>
                <p className="mt-1 text-xs text-slate-400">{path.orderedNodes.length} concepts</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Browse Nodes</h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, id, or type..."
              className="w-full max-w-sm rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNodes.map((node) => (
              <li key={node.id}>
                <Link
                  href={`/academy/${node.id}`}
                  className="block rounded-lg border border-slate-800 bg-slate-950/70 p-3 hover:border-cyan-500/60"
                >
                  <p className="text-sm text-slate-100">{node.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {node.type} · difficulty {node.difficulty}/4
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
