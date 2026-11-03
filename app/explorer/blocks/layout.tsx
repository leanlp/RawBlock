import type { ReactNode } from "react";
import SeoContentSection from "@/components/seo/SeoContentSection";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Latest Blocks Ledger",
  description:
    "Track recent Bitcoin blocks with miner attribution, timing, and direct drill-down into block header fields, transaction distribution, and coinbase trace.",
  path: "/explorer/blocks",
  keywords: ["bitcoin block explorer", "recent blocks", "block height", "miner attribution"],
});

export default function ExplorerBlocksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SeoContentSection pageKey="blocks" />
    </>
  );
}
