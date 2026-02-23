import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Fee Market Intelligence",
  description:
    "Monitor Bitcoin fee recommendations and 24-hour fee trend data with source-aware summaries for economy, standard, and express confirmation targets.",
  path: "/explorer/fees",
  keywords: ["bitcoin fees", "sat/vB", "mempool fee market", "fee estimator"],
});

export default function ExplorerFeesLayout({ children }: { children: ReactNode }) {
  return children;
}

