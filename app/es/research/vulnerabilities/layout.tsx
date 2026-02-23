import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Registro de Vulnerabilidades",
    description:
      "Registro historico de vulnerabilidades de Bitcoin con severidad, versiones afectadas, mitigaciones y conceptos relacionados.",
    path: "/es/research/vulnerabilities",
    keywords: ["vulnerabilidades bitcoin", "seguridad bitcoin", "bitcoin core"],
  }),
  alternates: {
    canonical: "https://www.rawblock.net/es/research/vulnerabilities",
    languages: {
      en: "https://www.rawblock.net/research/vulnerabilities",
      es: "https://www.rawblock.net/es/research/vulnerabilities",
      "x-default": "https://www.rawblock.net/research/vulnerabilities",
    },
  },
};

export default function EsResearchVulnerabilitiesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Investigacion", path: "/es/research" },
          { name: "Vulnerabilidades", path: "/es/research/vulnerabilities" },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: "Registro de Vulnerabilidades",
          description:
            "Registro historico de vulnerabilidades de Bitcoin con severidad, versiones afectadas y mitigaciones.",
          path: "/es/research/vulnerabilities",
          about: ["Bitcoin", "vulnerabilidades", "Bitcoin Core", "seguridad"],
        })}
      />
      {children}
    </>
  );
}

