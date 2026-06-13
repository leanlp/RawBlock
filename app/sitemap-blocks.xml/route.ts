import { BLOCK_SITEMAP_MAX, getRecentBlockHeights } from "@/lib/seo/recentBlocks";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rawblock.net").replace(/\/+$/, "");

export async function GET() {
  const heights = await getRecentBlockHeights(BLOCK_SITEMAP_MAX);
  const lastmod = new Date().toISOString();

  const rows =
    heights.length > 0
      ? heights
          .map(
            (height) => `  <url>
    <loc>${SITE_URL}/explorer/block/${height}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.55</priority>
  </url>`,
          )
          .join("\n")
      : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
