import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Graffiti Wall",
  description:
    "Live feed of Bitcoin coinbase and OP_RETURN graffiti messages with timestamps and transaction references.",
  path: "/analysis/graffiti",
  keywords: ["bitcoin graffiti", "op_return messages", "coinbase messages"],
});

export default function AnalysisGraffitiLayout({ children }: { children: ReactNode }) {
  return children;
}

