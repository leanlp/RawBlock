import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Decentralization Index",
  description:
    "Measure Bitcoin decentralization across mining, nodes, economic concentration, and protocol modernity with a weighted D-index dashboard.",
  path: "/analysis/d-index",
  keywords: ["bitcoin decentralization", "d-index", "mining resilience", "node diversity"],
});

export default function AnalysisDIndexLayout({ children }: { children: ReactNode }) {
  return children;
}

