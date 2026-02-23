import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Assumptions Registry",
  description:
    "Bitcoin security assumptions registry covering cryptographic, network, economic, and game-theoretic assumptions and what weakens them.",
  path: "/research/assumptions",
  keywords: ["bitcoin security assumptions", "cryptographic assumptions", "game theory bitcoin"],
});
metadata.alternates = {
  canonical: "https://www.rawblock.net/research/assumptions",
  languages: {
    en: "https://www.rawblock.net/research/assumptions",
    es: "https://www.rawblock.net/es/research/assumptions",
    "x-default": "https://www.rawblock.net/research/assumptions",
  },
};

export default function ResearchAssumptionsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Research", path: "/research" },
          { name: "Assumptions", path: "/research/assumptions" },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: "Assumptions Registry",
          description:
            "Bitcoin security assumptions registry covering cryptographic, network, economic, and game-theoretic dependencies.",
          path: "/research/assumptions",
          about: ["Bitcoin", "security assumptions", "cryptography", "network assumptions", "economics"],
        })}
      />
      {children}
    </>
  );
}
