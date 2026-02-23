import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Investigacion",
    template: "%s | Raw Block",
  },
  description:
    "Registro de investigacion de seguridad de Bitcoin con vulnerabilidades, modelos de ataque, supuestos y referencias de politica vs consenso.",
  alternates: {
    canonical: "https://www.rawblock.net/es/research",
    languages: {
      en: "https://www.rawblock.net/research",
      es: "https://www.rawblock.net/es/research",
      "x-default": "https://www.rawblock.net/research",
    },
  },
};

export default function EsResearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Investigacion", path: "/es/research" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Registro de Investigacion Raw Block",
          description:
            "Registros estructurados sobre vulnerabilidades, modelos de ataque, supuestos y politica vs consenso en Bitcoin.",
          path: "/es/research",
        })}
      />
      {children}
    </>
  );
}
