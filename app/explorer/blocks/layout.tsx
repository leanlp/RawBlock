import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Latest Blocks Ledger",
    template: "%s | Raw Block",
  },
  description:
    "Track recent Bitcoin blocks with miner attribution, timing, and direct drill-down into block header fields, transaction distribution, and coinbase trace.",
  alternates: {
    canonical: "https://www.rawblock.net/explorer/blocks",
  },
};

export default function ExplorerBlocksLayout({ children }: { children: ReactNode }) {
  return children;
}
