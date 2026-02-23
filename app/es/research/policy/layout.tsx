import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Politica vs Consenso",
    description:
      "Guia de referencia que separa la politica de relevo de Bitcoin de las reglas criticas de consenso y validacion.",
    path: "/es/research/policy",
    keywords: ["politica vs consenso bitcoin", "standardness", "reglas de consenso"],
  }),
  alternates: {
    canonical: "https://www.rawblock.net/es/research/policy",
    languages: {
      en: "https://www.rawblock.net/research/policy",
      es: "https://www.rawblock.net/es/research/policy",
      "x-default": "https://www.rawblock.net/research/policy",
    },
  },
};

export default function EsResearchPolicyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Investigacion", path: "/es/research" },
          { name: "Politica vs Consenso", path: "/es/research/policy" },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: "Politica vs Consenso",
          description:
            "Guia que distingue la politica de relevo de Bitcoin de las reglas criticas de consenso.",
          path: "/es/research/policy",
          about: ["Bitcoin", "politica de relevo", "consenso", "standardness"],
        })}
      />
      {children}
    </>
  );
}

