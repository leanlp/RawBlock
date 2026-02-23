import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Vulnerabilities Registry",
  description:
    "Historical Bitcoin vulnerabilities registry with severity, affected versions, mitigations, and links to related protocol concepts.",
  path: "/research/vulnerabilities",
  keywords: ["bitcoin vulnerabilities", "cve", "bitcoin core security", "mitigations"],
});
metadata.alternates = {
  canonical: "https://www.rawblock.net/research/vulnerabilities",
  languages: {
    en: "https://www.rawblock.net/research/vulnerabilities",
    es: "https://www.rawblock.net/es/research/vulnerabilities",
    "x-default": "https://www.rawblock.net/research/vulnerabilities",
  },
};

export default function ResearchVulnerabilitiesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Research", path: "/research" },
          { name: "Vulnerabilities", path: "/research/vulnerabilities" },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: "Vulnerabilities Registry",
          description:
            "Historical Bitcoin vulnerabilities registry with severity, affected versions, mitigations, and related concepts.",
          path: "/research/vulnerabilities",
          about: ["Bitcoin", "Bitcoin Core", "security vulnerabilities", "consensus risk"],
        })}
      />
      {children}
    </>
  );
}
