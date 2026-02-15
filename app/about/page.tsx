import Link from "next/link";

const CONTACTS = [
  { label: "X (Twitter)", href: "https://x.com/rawblocknet" },
  { label: "LinkedIn", href: "https://linkedin.com/company/rawblock" },
];

const DATA_SOURCES = [
  {
    label: "mempool.space",
    href: "https://mempool.space/docs/api/rest",
    notes: "Primary public telemetry for hashrate, mempool, and fee recommendations.",
  },
  {
    label: "blockstream.info",
    href: "https://github.com/Blockstream/esplora/blob/master/API.md",
    notes: "Fallback API for block height and fee-estimate continuity.",
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
            Raw Block is a Bitcoin analysis and learning workspace. This page documents data origins,
            operator model, and safe usage boundaries for power features.
          </p>
        </header>

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
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20"
              >
                {contact.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Data Provenance</h2>
          <p className="mt-2 text-sm text-slate-300">
            Live dashboards aggregate public network telemetry. Source availability and update cadence
            can affect metric freshness.
          </p>
          <ul className="mt-4 space-y-3">
            {DATA_SOURCES.map((source) => (
              <li key={source.href} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <Link
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-cyan-300 hover:underline"
                >
                  {source.label}
                </Link>
                <p className="mt-1 text-sm text-slate-300">{source.notes}</p>
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
            cross-check with primary upstream sources and treat anomalies as potential display bugs.
          </p>
        </section>
      </div>
    </main>
  );
}
