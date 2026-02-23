import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "About & Trust",
  description:
    "Raw Block data sources, fallback policy, operator model, and transparency commitments for Bitcoin explorer and protocol tooling.",
  path: "/about",
  keywords: ["bitcoin explorer trust", "bitcoin data provenance", "raw block about"],
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About & Trust", path: "/about" },
        ])}
      />
      {children}
    </>
  );
}
