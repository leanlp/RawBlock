import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Policy vs Consensus",
  description:
    "Reference guide distinguishing Bitcoin relay policy behavior from consensus-critical rules with structured examples and sources.",
  path: "/research/policy",
  keywords: ["bitcoin policy vs consensus", "standardness", "relay policy", "consensus rules"],
});
metadata.alternates = {
  canonical: "https://www.rawblock.net/research/policy",
  languages: {
    en: "https://www.rawblock.net/research/policy",
    es: "https://www.rawblock.net/es/research/policy",
    "x-default": "https://www.rawblock.net/research/policy",
  },
};

export default function ResearchPolicyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Research", path: "/research" },
          { name: "Policy vs Consensus", path: "/research/policy" },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: "Policy vs Consensus",
          description:
            "Reference guide separating Bitcoin relay policy behavior from consensus-critical validation rules and protocol invariants.",
          path: "/research/policy",
          about: ["Bitcoin", "relay policy", "consensus rules", "standardness"],
        })}
      />
      {children}
    </>
  );
}
