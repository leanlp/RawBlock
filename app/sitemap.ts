import type { MetadataRoute } from "next";
import { GLOSSARY_EN } from "@/data/glossary";
import { BLOG_POSTS } from "@/data/blogPosts";
import { graphStore } from "@/lib/graph/store";
import { getAllPaths } from "@/lib/graph/pathEngine";
import { getAllAcademyNodeContent } from "@/lib/content/academy";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rawblock.net").replace(/\/+$/, "");

function toUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

function getSeoMetadata(route: string): Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority"> {
  if (route === "/") {
    return { changeFrequency: "hourly", priority: 1 };
  }

  if (route.startsWith("/explorer/")) {
    if (route === "/explorer/mempool" || route === "/explorer/fees") {
      return { changeFrequency: "hourly", priority: 0.92 };
    }
    return { changeFrequency: "daily", priority: 0.86 };
  }

  if (route.startsWith("/analysis/")) {
    return { changeFrequency: "daily", priority: 0.82 };
  }

  if (route === "/research") {
    return { changeFrequency: "daily", priority: 0.84 };
  }

  if (route.startsWith("/research/")) {
    return { changeFrequency: "weekly", priority: 0.8 };
  }

  if (route === "/academy") {
    return { changeFrequency: "daily", priority: 0.8 };
  }

  if (route.startsWith("/academy/")) {
    return { changeFrequency: "weekly", priority: 0.76 };
  }

  if (route.startsWith("/paths/")) {
    return { changeFrequency: "weekly", priority: 0.74 };
  }

  if (route.startsWith("/lab/")) {
    return { changeFrequency: "weekly", priority: 0.72 };
  }

  if (route.startsWith("/game/")) {
    return { changeFrequency: "weekly", priority: 0.7 };
  }

  if (route === "/graph") {
    return { changeFrequency: "weekly", priority: 0.72 };
  }

  if (route === "/glossary" || route.startsWith("/glossary/")) {
    return { changeFrequency: "monthly", priority: 0.7 };
  }

  if (route === "/blog" || route.startsWith("/blog/")) {
    return { changeFrequency: "monthly", priority: 0.65 };
  }

  return { changeFrequency: "weekly", priority: 0.68 };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const academyById = new Map(
    getAllAcademyNodeContent("en").map((node) => [node.id, new Date(`${node.verifiedAt}T00:00:00Z`)]),
  );

  const stableContentModified = new Date("2026-02-22T00:00:00Z");

  function getLastModified(route: string): Date {
    if (route === "/" || route.startsWith("/explorer/") || route.startsWith("/analysis/")) {
      return now;
    }
    if (route.startsWith("/academy/")) {
      const nodeId = route.split("/")[2];
      return academyById.get(nodeId) ?? stableContentModified;
    }
    return stableContentModified;
  }

  const staticRoutes = [
    "/",
    "/about",
    "/academy",
    "/blog",
    "/glossary",
    "/graph",
    "/research",
    "/research/vulnerabilities",
    "/research/attacks",
    "/research/assumptions",
    "/research/policy",
    "/explorer/mempool",
    "/explorer/network",
    "/explorer/blocks",
    "/explorer/decoder",
    "/explorer/rich-list",
    "/explorer/fees",
    "/explorer/miners",
    "/explorer/vitals",
    "/explorer/rpc",
    "/analysis/utxo",
    "/analysis/forensics",
    "/analysis/evolution",
    "/analysis/d-index",
    "/analysis/graffiti",
    "/analysis/privacy",
    "/analysis/bridges",
    "/analysis/incidents",
    "/analysis/lightning/threats",
    "/lab/script",
    "/lab/taproot",
    "/lab/keys",
    "/lab/hashing",
    "/lab/consensus",
    "/lab/lightning",
    "/lab/scenarios",
    "/game/tetris",
    "/game/mining",
    "/game/mempool",
  ];

  const pathRoutes = getAllPaths().map((path) => `/paths/${path.id}`);
  const academyNodeRoutes = graphStore.nodes.map((node) => `/academy/${node.id}`);
  const glossaryRoutes = Object.keys(GLOSSARY_EN).map((term) => `/glossary/${term}`);
  const blogRoutes = BLOG_POSTS.map((post) => `/blog/${post.slug}`);

  const uniqueRoutes = Array.from(
    new Set([...staticRoutes, ...pathRoutes, ...academyNodeRoutes, ...glossaryRoutes, ...blogRoutes]),
  );

  return uniqueRoutes.map((route) => {
    const seo = getSeoMetadata(route);
    return {
      url: toUrl(route),
      lastModified: getLastModified(route),
      changeFrequency: seo.changeFrequency,
      priority: seo.priority,
    };
  });
}
