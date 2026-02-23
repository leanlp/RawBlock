import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Chain Evolution",
  description:
    "Track Bitcoin script-type adoption, protocol evolution signals, and fee anomalies with interactive chain evolution analytics.",
  path: "/analysis/evolution",
  keywords: ["bitcoin segwit adoption", "taproot adoption", "chain evolution", "fat finger fees"],
});

export default function AnalysisEvolutionLayout({ children }: { children: ReactNode }) {
  return children;
}

