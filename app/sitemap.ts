import type { MetadataRoute } from "next";
import { graphStore } from "@/lib/graph/store";
import { getAllPaths } from "@/lib/graph/pathEngine";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rawblock.net").replace(/\/+$/, "");

function toUrl(path: string): string {
  return `${SITE_URL}${path}`;
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

  return uniqueRoutes.map((route) => ({
    url: toUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "hourly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }));
}
