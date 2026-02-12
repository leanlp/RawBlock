import Link from "next/link";
import type { AcademyNodeContent } from "@/lib/content/schema";

export default function NodeSources({ content }: { content: AcademyNodeContent }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-lg font-semibold">Claim Sources</h2>
      <div className="space-y-3">
        {content.claimSources.map((entry) => (
          <div key={entry.claim} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm text-slate-200">{entry.claim}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-400">
              {entry.sources.map((source) => (
                <li key={`${entry.claim}-${source.url}`}>
                  <Link href={source.url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">
                    {source.title}
                  </Link>{" "}
                  <span className="uppercase text-slate-500">({source.type})</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
