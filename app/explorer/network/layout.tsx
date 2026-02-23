import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Global Network Monitor",
  description:
    "Visualize Bitcoin P2P peers, geolocation clusters, client distribution, latency bands, and active connections from Raw Block network telemetry.",
  path: "/explorer/network",
  keywords: ["bitcoin network map", "bitcoin peers", "p2p monitor", "bitcoin nodes"],
});

export default function ExplorerNetworkLayout({ children }: { children: ReactNode }) {
  return children;
}

