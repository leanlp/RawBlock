import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Attack Models",
  description:
    "Bitcoin attack model catalog with target layers, attacker capabilities, observed cases, and defensive mitigations.",
  path: "/research/attacks",
  keywords: ["bitcoin attack models", "consensus attacks", "network attacks", "mempool attacks"],
});
metadata.alternates = {
  canonical: "https://www.rawblock.net/research/attacks",
  languages: {
    en: "https://www.rawblock.net/research/attacks",
    es: "https://www.rawblock.net/es/research/attacks",
    "x-default": "https://www.rawblock.net/research/attacks",
  },
};

export default function ResearchAttacksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Research", path: "/research" },
          { name: "Attack Models", path: "/research/attacks" },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: "Attack Models",
          description:
            "Structured Bitcoin attack model catalog covering capabilities, target layers, observed cases, and mitigations.",
          path: "/research/attacks",
          about: ["Bitcoin", "attack models", "network attacks", "mempool attacks", "consensus attacks"],
        })}
      />
      {children}
    </>
  );
}
