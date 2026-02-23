import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Modelos de Ataque",
    description:
      "Catalogo de modelos de ataque de Bitcoin con capacidades del atacante, capas objetivo, casos observados y mitigaciones.",
    path: "/es/research/attacks",
    keywords: ["ataques bitcoin", "modelos de ataque", "seguridad de red bitcoin"],
  }),
  alternates: {
    canonical: "https://www.rawblock.net/es/research/attacks",
    languages: {
      en: "https://www.rawblock.net/research/attacks",
      es: "https://www.rawblock.net/es/research/attacks",
      "x-default": "https://www.rawblock.net/research/attacks",
    },
  },
};

export default function EsResearchAttacksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Investigacion", path: "/es/research" },
          { name: "Ataques", path: "/es/research/attacks" },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: "Modelos de Ataque",
          description:
            "Catalogo estructurado de modelos de ataque en Bitcoin con capacidades, capas objetivo y mitigaciones.",
          path: "/es/research/attacks",
          about: ["Bitcoin", "ataques", "red", "mempool", "consenso"],
        })}
      />
      {children}
    </>
  );
}

