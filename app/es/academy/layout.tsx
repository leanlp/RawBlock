import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Academia Bitcoin",
    template: "%s | Raw Block",
  },
  description:
    "Rutas de aprendizaje y nodos de conceptos sobre validacion, bloques, mempool, consenso, mineria y seguridad de Bitcoin.",
  alternates: {
    canonical: "https://www.rawblock.net/es/academy",
    languages: {
      en: "https://www.rawblock.net/academy",
      es: "https://www.rawblock.net/es/academy",
      "x-default": "https://www.rawblock.net/academy",
    },
  },
};

export default function EsAcademyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Academia", path: "/es/academy" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Academia Bitcoin",
          description:
            "Rutas de aprendizaje y nodos de conceptos de Bitcoin para validacion, bloques, mineria, consenso y seguridad.",
          path: "/es/academy",
        })}
      />
      {children}
    </>
  );
}
