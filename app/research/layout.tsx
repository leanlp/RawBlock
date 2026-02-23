import type { ReactNode } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Research Registry",
    template: "%s | Raw Block",
  },
  description:
    "Structured Bitcoin security research registries for vulnerabilities, attack models, assumptions, and policy-versus-consensus references.",
  alternates: {
    canonical: "https://www.rawblock.net/research",
    languages: {
      en: "https://www.rawblock.net/research",
      es: "https://www.rawblock.net/es/research",
      "x-default": "https://www.rawblock.net/research",
    },
  },
};

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Research", path: "/research" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Research Registry",
          description:
            "Structured Bitcoin research registries for vulnerabilities, attack models, assumptions, and policy-versus-consensus references.",
          path: "/research",
        })}
      />
      {children}
    </>
  );
}
