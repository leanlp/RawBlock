import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Miners & Pool Attribution",
  description:
    "Analyze recent miners, pool attribution, hashrate distribution, and block production cadence from Raw Block miner intelligence dashboards.",
  path: "/explorer/miners",
  keywords: ["bitcoin miners", "mining pools", "hashrate distribution", "coinbase tags"],
});

export default function ExplorerMinersLayout({ children }: { children: ReactNode }) {
  return children;
}

