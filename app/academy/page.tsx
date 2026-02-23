"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Header from "@/components/Header";
import { useTranslation } from "@/lib/i18n";
import { getAllPaths } from "@/lib/graph/pathEngine";
import { getLocalizedNodeTypeLabel } from "@/lib/graph/nodeTypePresentation";
import { graphStore } from "@/lib/graph/store";
import { getAcademyNodeContent } from "@/lib/content/academy";

export default function AcademyLandingPage() {
  const { t, locale } = useTranslation();
  const paths = getAllPaths();
  const [query, setQuery] = useState("");
  const routePrefix = locale === "es" ? "/es" : "";
  const localizedPathTitles: Record<string, string> = {
    "bitcoin-foundations": "Fundamentos de Bitcoin",
    "lightning-primer": "Introduccion a Lightning",
    "transaction-lifecycle": "La Vida de una Transaccion",
  };

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
    <main className="page-shell bg-slate-950">
      <div className="page-wrap reading-flow">
        <div className="md:hidden">
          <Header />
        </div>
        <header className="page-header">
          <p className="page-kicker">{locale === "es" ? "Academia" : "Academy"}</p>
          <h1 className="page-title">{t.academy.title}</h1>
          <p className="page-subtitle">
            {t.academy.subtitle}
          </p>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-3 text-lg font-semibold">{locale === "es" ? "Rutas de Aprendizaje" : "Core Learning Paths"}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {paths.map((path) => (
              <Link
                key={path.id}
                href={`${routePrefix}/paths/${path.id}`}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 hover:border-cyan-500/60"
              >
                <p className="text-slate-100">{locale === "es" ? (localizedPathTitles[path.id] ?? path.title) : path.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {path.orderedNodes.length} {locale === "es" ? "conceptos" : "concepts"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{locale === "es" ? "Explorar Nodos" : "Browse Nodes"}</h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === "es" ? "Buscar por titulo, id o tipo..." : "Search by title, id, or type..."}
              className="w-full max-w-sm rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNodes.map((node) => (
              <li key={node.id}>
                {(() => {
                  const localizedNode = getAcademyNodeContent(node.id, locale);
                  return (
                <Link
                  href={`${routePrefix}/academy/${node.id}`}
                  className="block rounded-lg border border-slate-800 bg-slate-950/70 p-3 hover:border-cyan-500/60"
                >
                  <p className="text-sm text-slate-100">{localizedNode?.title ?? node.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {getLocalizedNodeTypeLabel(node.type, locale)} · {locale === "es" ? "dificultad" : "difficulty"} {node.difficulty}/4
                  </p>
                </Link>
                  );
                })()}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
