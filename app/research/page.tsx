"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import Header from "@/components/Header";

export default function ResearchLandingPage() {
  const { t, locale } = useTranslation();
  const routePrefix = locale === "es" ? "/es" : "";
  const sections = [
    {
      title: locale === "es" ? "Vulnerabilidades" : "Vulnerabilities",
      href: `${routePrefix}/research/vulnerabilities`,
      description:
        locale === "es"
          ? "Registro historico de vulnerabilidades con filtros por severidad, ano y version."
          : "Historical vulnerability registry with severity, year, and version filters.",
    },
    {
      title: locale === "es" ? "Modelos de Ataque" : "Attack Models",
      href: `${routePrefix}/research/attacks`,
      description:
        locale === "es"
          ? "Modelos adversariales estructurados, superficies de explotacion y mitigaciones."
          : "Structured adversarial models, exploit surfaces, and mitigations.",
    },
    {
      title: locale === "es" ? "Supuestos" : "Assumptions",
      href: `${routePrefix}/research/assumptions`,
      description:
        locale === "es"
          ? "Supuestos de seguridad en los que se apoya el protocolo y que los debilita."
          : "Security assumptions the protocol relies on and what weakens them.",
    },
    {
      title: locale === "es" ? "Politica vs Consenso" : "Policy vs Consensus",
      href: `${routePrefix}/research/policy`,
      description:
        locale === "es"
          ? "Distincion explicita entre politica de nodo y reglas criticas de consenso."
          : "Explicit distinction between policy-layer behavior and consensus-critical rules.",
    },
  ];
  return (
    <main className="page-shell bg-slate-950">
      <div className="page-wrap reading-flow">
        <div className="md:hidden">
          <Header />
        </div>
        <header className="page-header">
          <p className="page-kicker">{locale === "es" ? "Investigacion" : "Research"}</p>
          <h1 className="page-title">{t.research.title}</h1>
          <p className="page-subtitle">
            {t.research.subtitle}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-cyan-500/60"
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{section.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
