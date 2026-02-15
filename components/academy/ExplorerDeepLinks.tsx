import Link from "next/link";
import type { AcademyNodeContent } from "@/lib/content/schema";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function mapExternalExplorerLink(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Map common mempool.space deep links to Raw Block equivalents.
    if (parsed.hostname === "mempool.space") {
      const path = parsed.pathname.replace(/\/+$/, "");

      if (path === "" || path === "/") return "/";
      if (path === "/blocks") return "/explorer/blocks";
      if (path === "/mempool") return "/explorer/mempool";
      if (path === "/mining") return "/explorer/miners";
      if (path === "/lightning") return "/lab/lightning";

      const txMatch = path.match(/^\/tx\/([0-9a-fA-F]{64})$/);
      if (txMatch) {
        const txid = txMatch[1];
        return `/explorer/decoder?query=${encodeURIComponent(txid)}`;
      }

      const addressMatch = path.match(/^\/address\/([a-zA-Z0-9]{25,90})$/);
      if (addressMatch) {
        const address = addressMatch[1];
        return `/explorer/decoder?query=${encodeURIComponent(address)}`;
      }

      const blockMatch = path.match(/^\/block\/([0-9a-fA-F]{64})$/);
      if (blockMatch) {
        const hash = blockMatch[1];
        return `/explorer/block/${encodeURIComponent(hash)}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export default function ExplorerDeepLinks({ content }: { content: AcademyNodeContent }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-lg font-semibold">Explorer Deep Links</h2>
      <p className="mb-4 text-sm text-slate-400">
        Some sources are external. When an internal Raw Block view is available, we&apos;ll surface it here.
      </p>
      <ul className="space-y-2">
        {content.explorerDeepLinks.map((item) => {
          const internalHref = isExternalUrl(item.url) ? mapExternalExplorerLink(item.url) : null;

          return (
            <li key={item.url} className="flex flex-wrap items-center gap-2">
              {internalHref ? (
                <Link
                  href={internalHref}
                  className="inline-flex rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20"
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  href={item.url}
                  target={isExternalUrl(item.url) ? "_blank" : undefined}
                  rel={isExternalUrl(item.url) ? "noreferrer" : undefined}
                  className="inline-flex rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-cyan-300 hover:border-cyan-500"
                >
                  {item.label}
                  {isExternalUrl(item.url) ? <span className="ml-2 text-slate-400">↗</span> : null}
                </Link>
              )}

              {isExternalUrl(item.url) ? (
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  title="Open external source"
                >
                  External
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
