import type { ReactNode } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Analysis Dashboards",
    template: "%s | Raw Block",
  },
  description:
    "Bitcoin analysis tools for forensics, chain evolution, decentralization metrics, graffiti feeds, and structured network observations.",
  alternates: {
    canonical: "https://www.rawblock.net/analysis",
  },
};

export default function AnalysisLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Analysis", path: "/analysis/forensics" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Analysis Dashboards",
          description:
            "Bitcoin forensics, chain evolution, decentralization metrics, UTXO analysis, and graffiti signal dashboards.",
          path: "/analysis/forensics",
        })}
      />
      {children}
    </>
  );
}
