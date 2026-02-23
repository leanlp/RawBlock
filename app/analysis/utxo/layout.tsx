import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "UTXO Set Analysis",
  description:
    "Explore Bitcoin UTXO distribution by value, age, and address type with visual analytics and educational context.",
  path: "/analysis/utxo",
  keywords: ["bitcoin utxo set", "utxo distribution", "coin age", "address type distribution"],
});

export default function AnalysisUtxoLayout({ children }: { children: ReactNode }) {
  return children;
}

