import Link from "next/link";
import type { SeoLink } from "@/lib/seo/pageContent";

type RelatedToolsProps = {
  links: SeoLink[];
  title?: string;
};

export default function RelatedTools({
  links,
  title = "Related tools",
}: RelatedToolsProps) {
  if (links.length === 0) return null;

  return (
    <nav
      aria-label={title}
      className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4"
    >
      <span className="w-full text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </span>
      {links.map((link) => {
        const external = link.href.startsWith("http");
        const className =
          "inline-flex min-h-9 items-center rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 text-sm text-cyan-300 transition hover:border-cyan-500/50 hover:bg-slate-800/80";

        if (external) {
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {link.label}
            </a>
          );
        }

        return (
          <Link key={link.href} href={link.href} className={className}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
