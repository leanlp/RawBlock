import { buildLocalizedSitemapXml, getPhase1LocalizedEntries } from "@/lib/seo/localeSitemaps";

export async function GET() {
  const xml = buildLocalizedSitemapXml("en", getPhase1LocalizedEntries());
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

