import { getAllAcademyNodeContent } from "@/lib/content/academy";
import { getAllPaths } from "@/lib/graph/pathEngine";

export type LocaleCode = "en" | "es";

export type LocalizedSitemapEntry = {
  enPath: string;
  esPath: string;
  lastModified?: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: number;
};

const RESEARCH_LOCALIZED_ROUTES = [
  { enPath: "/research", esPath: "/es/research" },
  { enPath: "/research/vulnerabilities", esPath: "/es/research/vulnerabilities" },
  { enPath: "/research/attacks", esPath: "/es/research/attacks" },
  { enPath: "/research/assumptions", esPath: "/es/research/assumptions" },
  { enPath: "/research/policy", esPath: "/es/research/policy" },
] as const;

export function getPhase1LocalizedEntries(): LocalizedSitemapEntry[] {
  const academyEntries = getAllAcademyNodeContent("en").map((node) => ({
    enPath: `/academy/${node.id}`,
    esPath: `/es/academy/${node.id}`,
    lastModified: `${node.verifiedAt}T00:00:00Z`,
    changefreq: "weekly" as const,
    priority: 0.76,
  }));

  const academyLanding: LocalizedSitemapEntry = {
    enPath: "/academy",
    esPath: "/es/academy",
    lastModified: "2026-02-22T00:00:00Z",
    changefreq: "weekly",
    priority: 0.8,
  };

  const researchEntries: LocalizedSitemapEntry[] = RESEARCH_LOCALIZED_ROUTES.map((route) => ({
    ...route,
    lastModified: "2026-02-22T00:00:00Z",
    changefreq: route.enPath === "/research" ? "daily" : "weekly",
    priority: route.enPath === "/research" ? 0.84 : 0.8,
  }));

  const pathEntries: LocalizedSitemapEntry[] = getAllPaths().map((path) => ({
    enPath: `/paths/${path.id}`,
    esPath: `/es/paths/${path.id}`,
    lastModified: "2026-02-22T00:00:00Z",
    changefreq: "weekly",
    priority: 0.74,
  }));

  return [academyLanding, ...academyEntries, ...researchEntries, ...pathEntries];
}

export function buildLocalizedSitemapXml(locale: LocaleCode, entries: LocalizedSitemapEntry[]): string {
  const base = "https://www.rawblock.net";
  const xmlRows = entries
    .map((entry) => {
      const selfPath = locale === "es" ? entry.esPath : entry.enPath;
      return `  <url>
    <loc>${base}${selfPath}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${base}${entry.enPath}" />
    <xhtml:link rel="alternate" hreflang="es" href="${base}${entry.esPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${entry.enPath}" />
    <lastmod>${entry.lastModified ?? "2026-02-22T00:00:00Z"}</lastmod>
    <changefreq>${entry.changefreq ?? "weekly"}</changefreq>
    <priority>${(entry.priority ?? 0.7).toFixed(2)}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlRows}
</urlset>`;
}
