export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  about: string[];
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "seo-explorer-and-labs",
    title: "Explorer, Labs, and Structured Learning on Raw Block",
    description:
      "How Raw Block combines live mainnet views with Script Lab, the transaction decoder, and Academy paths for protocol literacy.",
    datePublished: "2026-02-01",
    dateModified: "2026-06-01",
    about: ["Bitcoin", "education", "explorer"],
    body: [
      "Raw Block ships as an open-source frontend backed by self-hosted node infrastructure, with explicit fallback labeling when public telemetry keeps dashboards responsive.",
      "New SEO-friendly glossary pages, sitemap coverage for analysis modules, and bilingual research/academy mirrors help search engines and LLM crawlers discover the full tool surface.",
    ],
  },
  {
    slug: "data-provenance-and-trust",
    title: "Data Provenance and Trust Labels",
    description:
      "A short note on how Raw Block surfaces upstream sources, RPC security guidance, and operator transparency on the About page.",
    datePublished: "2026-03-15",
    dateModified: "2026-06-01",
    about: ["Bitcoin", "data provenance", "trust"],
    body: [
      "Primary metrics are intended to come from Bitcoin Core plus an electrs-backed index. During indexer rollout, some charts may temporarily read from public APIs.",
      "When a fallback badge appears, treat it as an availability measure—not the long-term architecture. Cross-check critical decisions against your own node where possible.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
