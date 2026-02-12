import Link from "next/link";

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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Research</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Security Research Layer</h1>
          <p className="text-sm text-slate-400">
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
