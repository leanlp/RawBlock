import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Forensics Workbench",
  description:
    "Visual Bitcoin transaction forensics workbench with graph exploration, case presets, and suspicious flow analysis tooling.",
  path: "/analysis/forensics",
  keywords: ["bitcoin forensics", "transaction graph", "chain analysis", "bitcoin investigation"],
});

export default function AnalysisForensicsLayout({ children }: { children: ReactNode }) {
  return children;
}

