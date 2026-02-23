import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Rich List (Whale Watch)",
    template: "%s | Raw Block",
  },
  description:
    "Track top Bitcoin addresses by confirmed balance with cached UTXO snapshot totals, filters, and whale-level UTXO drill-down pages.",
  alternates: {
    canonical: "https://www.rawblock.net/explorer/rich-list",
  },
};

export default function ExplorerRichListLayout({ children }: { children: ReactNode }) {
  return children;
}
