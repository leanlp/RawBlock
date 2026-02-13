import Link from "next/link";
import type { AcademyNodeContent } from "@/lib/content/schema";

export default function ExplorerDeepLinks({ content }: { content: AcademyNodeContent }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-lg font-semibold">Explorer Deep Links</h2>
      <ul className="space-y-2">
        {content.explorerDeepLinks.map((item) => (
          <li key={item.url}>
            <Link
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-cyan-300 hover:border-cyan-500"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
