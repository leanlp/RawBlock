import type { MetadataRoute } from "next";
import { graphStore } from "@/lib/graph/store";
import { getAllPaths } from "@/lib/graph/pathEngine";

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

  return { changeFrequency: "weekly", priority: 0.68 };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "/",
    "/academy",
    "/research",
    "/research/vulnerabilities",
    "/research/attacks",
    "/research/assumptions",
    "/research/policy",
    "/research/policy-vs-consensus",
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
    "/lab/script",
    "/lab/taproot",
    "/lab/keys",
    "/lab/hashing",
    "/lab/consensus",
    "/lab/lightning",
    "/game/tetris",
    "/game/mining",
  ];

  const pathRoutes = getAllPaths().map((path) => `/paths/${path.id}`);
  const academyNodeRoutes = graphStore.nodes.map((node) => `/academy/${node.id}`);

  const uniqueRoutes = Array.from(new Set([...staticRoutes, ...pathRoutes, ...academyNodeRoutes]));

  return uniqueRoutes.map((route) => {
    const seo = getSeoMetadata(route);
    return {
      url: toUrl(route),
      lastModified: now,
      changeFrequency: seo.changeFrequency,
      priority: seo.priority,
    };
  });
}
