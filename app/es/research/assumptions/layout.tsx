import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Registro de Supuestos",
    description:
      "Registro de supuestos de seguridad de Bitcoin (criptograficos, de red, economicos y de teoria de juegos) y factores que los debilitan.",
    path: "/es/research/assumptions",
    keywords: ["supuestos bitcoin", "seguridad bitcoin", "criptografia bitcoin"],
  }),
  alternates: {
    canonical: "https://www.rawblock.net/es/research/assumptions",
    languages: {
      en: "https://www.rawblock.net/research/assumptions",
      es: "https://www.rawblock.net/es/research/assumptions",
      "x-default": "https://www.rawblock.net/research/assumptions",
    },
  },
};

export default function EsResearchAssumptionsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Investigacion", path: "/es/research" },
          { name: "Supuestos", path: "/es/research/assumptions" },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: "Registro de Supuestos",
          description:
            "Registro de supuestos de seguridad de Bitcoin y dependencias criptograficas, economicas y de red.",
          path: "/es/research/assumptions",
          about: ["Bitcoin", "supuestos de seguridad", "criptografia", "economia"],
        })}
      />
      {children}
    </>
  );
}

