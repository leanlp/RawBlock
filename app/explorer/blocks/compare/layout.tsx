import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Block Compare",
  description:
    "Compare Bitcoin blocks side-by-side to inspect header fields, timing, size, weight, and miner-level differences.",
  path: "/explorer/blocks/compare",
  keywords: ["bitcoin block compare", "block header comparison", "block explorer tools"],
});

export default function ExplorerBlocksCompareLayout({ children }: { children: ReactNode }) {
  return children;
}

