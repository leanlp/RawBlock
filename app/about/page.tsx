import Link from "next/link";

const API_GATEWAY_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const CONTACTS = [
  { label: "X (Twitter)", href: "https://x.com/rawblocknet" },
  { label: "LinkedIn", href: "https://linkedin.com/company/rawblock" },
];

const DATA_STACK = [
  {
    label: "Bitcoin Core (self-hosted full node)",
    href: "https://bitcoincore.org/en/download/",
    notes:
      "Primary source of truth for consensus state: chain tip, difficulty, mempool policy, and mining telemetry via RPC.",
  },
  {
    label: "electrs (self-hosted indexer, rolling out)",
    href: "https://github.com/romanz/electrs",
    notes:
      "Fast address / transaction lookups via an indexed view of the chain. Used to power explorer-grade queries without relying on third-party APIs (deployment in progress).",
  },
  {
    label: "Rawblock API (our node gateway)",
    href: `${API_GATEWAY_BASE_URL}/api/network-stats`,
    notes:
      "Our public-facing API layer that serves data from the node + indexer stack and streams real-time events to the UI.",
  },
];

const FALLBACK_SOURCES = [
  {
    label: "mempool.space",
    href: "https://mempool.space/docs/api/rest",
    notes:
      "Fallback telemetry used only when our infrastructure is unavailable, or when running in demo mode without a configured node gateway.",
  },
  {
    label: "blockstream.info",
    href: "https://github.com/Blockstream/esplora/blob/master/API.md",
    notes: "Secondary fallback (Esplora-compatible) for tip height and fee-estimate continuity.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-200 md:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3 border-b border-slate-800 pb-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300/80">Raw Block</p>
          <h1 className="text-3xl font-extrabold text-slate-100 md:text-4xl">About & Trust</h1>
          <p className="max-w-3xl text-sm text-slate-300 md:text-base">
            Raw Block is a Bitcoin analysis and learning workspace built around one principle: show
            real network behavior from our own infrastructure (node + indexer), and make the sources
            explicit when fallbacks are used.
          </p>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Our Mission</h2>
          <p className="mt-2 text-sm text-slate-300">
            Bitcoin is the most important monetary network in human history, but understanding its mechanics remains deeply inaccessible to non-engineers. Our mission is to bridge this gap by providing an <strong>Interactive Bitcoin Lab</strong> that allows anyone to visually debug node consensus, mempool flows, and cryptography without running complex CLI commands.
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Open-Source Transparency</h2>
          <p className="mt-2 text-sm text-slate-300">
            Raw Block is committed to radical transparency. The entire frontend architecture, charting layer, and RPC proxy logic are fully open-source. Anyone can audit the code, run it locally, or contribute to its educational curriculum.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="https://github.com/rawblock"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
              View GitHub Repository
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Operator Model</h2>
          <p className="mt-2 text-sm text-slate-300">
            The project is maintained by a small independent team under the Raw Block identity.
            Public communication currently happens through the channels below.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CONTACTS.map((contact) => (
              <Link
                key={contact.href}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20"
              >
                {contact.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Data Stack</h2>
          <p className="mt-2 text-sm text-slate-300">
            Raw Block is built to run on Bitcoin Core plus an electrs-backed index. During the
            current rollout (index compaction and hardening), some views may temporarily use public
            telemetry fallbacks for continuity.
          </p>
          <ul className="mt-4 space-y-3">
            {DATA_STACK.map((source) => (
              <li key={source.href} className="rounded-lg border border-slate-800 bg-slate-950/60">
                <Link
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3"
                >
                  <span className="text-sm font-semibold text-cyan-300 hover:underline">
                    {source.label}
                  </span>
                  <p className="mt-1 text-sm text-slate-300">{source.notes}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Fallback Policy</h2>
          <p className="mt-2 text-sm text-slate-300">
            If our node gateway is unreachable, some dashboards may temporarily fall back to public
            telemetry providers to keep the UI responsive. When you see a fallback source label,
            treat it as an availability measure, not the default mode.
          </p>
          <ul className="mt-4 space-y-3">
            {FALLBACK_SOURCES.map((source) => (
              <li key={source.href} className="rounded-lg border border-slate-800 bg-slate-950/60">
                <Link
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3"
                >
                  <span className="text-sm font-semibold text-cyan-300 hover:underline">
                    {source.label}
                  </span>
                  <p className="mt-1 text-sm text-slate-300">{source.notes}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="text-lg font-semibold text-amber-200">RPC / Node Security Guidance</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-100/90">
            <li>Never expose Bitcoin Core RPC to the public internet.</li>
            <li>Use dedicated read-only credentials for explorer tooling whenever possible.</li>
            <li>Prefer localhost or private network tunnels with strict firewall controls.</li>
            <li>Do not paste wallet secrets, seed phrases, or private keys into browser tools.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Known Limits</h2>
          <p className="mt-2 text-sm text-slate-300">
            Educational modules and dashboards may evolve quickly. When metrics look suspicious,
            cross-check against primary sources and treat anomalies as potential display bugs.
          </p>
        </section>
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Project Roadmap</h2>
          <ul className="mt-4 space-y-4 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">✓</span>
              <div>
                <strong>Phase 1: Deep Inspection</strong>
                <p className="mt-1 text-slate-400">Byte-level parsers for block headers, transaction hex payloads, and P2P routing visualizations.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">✓</span>
              <div>
                <strong>Phase 2: Educational Scaffolding</strong>
                <p className="mt-1 text-slate-400">Guided journeys, progress tracking, and interactive simulators for mining and mempool mechanics.</p>
              </div>
            </li>
            <li className="flex gap-3 opacity-60">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600">3</span>
              <div>
                <strong>Phase 3: Network Attacks & Forensics</strong>
                <p className="mt-1 text-slate-400">Simulating 51% attacks, strict signature validation paths, and UTXO graph clustering maps.</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
