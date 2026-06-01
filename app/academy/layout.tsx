import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import SeoContentSection from "@/components/seo/SeoContentSection";
import { breadcrumbJsonLd, buildPageMetadata, collectionPageJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Bitcoin Academy",
  description:
    "Structured Bitcoin learning paths and concept nodes covering validation, blocks, mempool, consensus, mining, and security fundamentals.",
  path: "/academy",
  keywords: ["bitcoin academy", "bitcoin learning path", "bitcoin education"],
  locales: { enPath: "/academy", esPath: "/es/academy" },
});

export default function AcademyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Academy", path: "/academy" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Bitcoin Academy",
          description:
            "Structured learning paths and concept nodes for Bitcoin blocks, transactions, mining, consensus, and protocol security.",
          path: "/academy",
        })}
      />
      {children}
      <SeoContentSection pageKey="academy" />
    </>
  );
}
