import Link from "next/link";
import Header from "@/components/Header";

const sections = [
  {
    title: "Vulnerabilities",
    href: "/research/vulnerabilities",
    description: "Historical vulnerability registry with severity, year, and version filters.",
  },
  {
    title: "Attack Models",
    href: "/research/attacks",
    description: "Structured adversarial models, exploit surfaces, and mitigations.",
  },
  {
    title: "Assumptions",
    href: "/research/assumptions",
    description: "Security assumptions the protocol relies on and what weakens them.",
  },
  {
    title: "Policy vs Consensus",
    href: "/research/policy",
    description: "Explicit distinction between policy-layer behavior and consensus-critical rules.",
  },
];

export default function ResearchLandingPage() {
  return (
    <main className="page-shell bg-slate-950">
      <div className="page-wrap reading-flow">
        <div className="md:hidden">
          <Header />
        </div>
        <header className="page-header">
          <p className="page-kicker">Research</p>
          <h1 className="page-title">Security Research Layer</h1>
          <p className="page-subtitle">
            Explore vulnerabilities, attacks, assumptions, and policy-consensus boundaries as structured protocol data.
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
