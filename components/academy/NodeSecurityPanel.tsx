"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import type {
  ResearchAssumption,
  ResearchAttack,
  ResearchPolicyConsensus,
  ResearchVulnerability,
} from "@/lib/content/schema";

type NodeSecurityPanelProps = {
  vulnerabilities: ResearchVulnerability[];
  attacks: ResearchAttack[];
  assumptions: ResearchAssumption[];
  policyConsensus: ResearchPolicyConsensus[];
};

export default function NodeSecurityPanel({
  vulnerabilities,
  attacks,
  assumptions,
  policyConsensus,
}: NodeSecurityPanelProps) {
  const { locale } = useTranslation();
  const routePrefix = locale === "es" ? "/es" : "";
  const copy = locale === "es"
    ? {
        title: "Panel de Seguridad del Nodo",
        vulnerabilities: "Vulnerabilidades",
        attacks: "Ataques",
        assumptions: "Supuestos",
        policy: "Politica vs Consenso",
      }
    : {
        title: "Node Security Panel",
        vulnerabilities: "Vulnerabilities",
        attacks: "Attacks",
        assumptions: "Assumptions",
        policy: "Policy vs Consensus",
      };
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-lg font-semibold">{copy.title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <h3 className="text-sm font-medium text-cyan-300">{copy.vulnerabilities} ({vulnerabilities.length})</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {vulnerabilities.map((item) => (
              <li key={item.id}>
                <Link href={`${routePrefix}/research/vulnerabilities`} className="hover:text-cyan-200">{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <h3 className="text-sm font-medium text-cyan-300">{copy.attacks} ({attacks.length})</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {attacks.map((item) => (
              <li key={item.id}>
                <Link href={`${routePrefix}/research/attacks`} className="hover:text-cyan-200">{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <h3 className="text-sm font-medium text-cyan-300">{copy.assumptions} ({assumptions.length})</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {assumptions.map((item) => (
              <li key={item.id}>
                <Link href={`${routePrefix}/research/assumptions`} className="hover:text-cyan-200">{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <h3 className="text-sm font-medium text-cyan-300">{copy.policy} ({policyConsensus.length})</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {policyConsensus.map((item) => (
              <li key={item.id}>
                <Link href={`${routePrefix}/research/policy`} className="hover:text-cyan-200">{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
