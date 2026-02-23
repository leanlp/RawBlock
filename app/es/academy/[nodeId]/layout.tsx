import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { getAcademyNodeContent } from "@/lib/content/academy";
import { breadcrumbJsonLd, buildPageMetadata, techArticleJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}): Promise<Metadata> {
  const { nodeId } = await params;
  const node = getAcademyNodeContent(nodeId, "es");
  const metadata = buildPageMetadata({
    title: node ? `${node.title} (Academia)` : `Leccion ${nodeId}`,
    description: node?.summary ?? "Leccion del protocolo Bitcoin en la academia de Raw Block.",
    path: `/es/academy/${encodeURIComponent(nodeId)}`,
    keywords: ["academia bitcoin", "leccion bitcoin", "protocolo bitcoin", nodeId],
  });
  metadata.alternates = {
    canonical: `https://www.rawblock.net/es/academy/${encodeURIComponent(nodeId)}`,
    languages: {
      en: `https://www.rawblock.net/academy/${encodeURIComponent(nodeId)}`,
      es: `https://www.rawblock.net/es/academy/${encodeURIComponent(nodeId)}`,
      "x-default": `https://www.rawblock.net/academy/${encodeURIComponent(nodeId)}`,
    },
  };
  return metadata;
}

export default async function EsAcademyNodeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  const node = getAcademyNodeContent(nodeId, "es");
  const path = `/es/academy/${encodeURIComponent(nodeId)}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Academia", path: "/es/academy" },
          { name: node?.title ?? nodeId, path },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: node ? `${node.title} (Academia)` : `Leccion ${nodeId}`,
          description: node?.summary ?? "Leccion del protocolo Bitcoin en la academia de Raw Block.",
          path,
          dateModified: node?.verifiedAt,
          about: node
            ? ["Bitcoin", "protocolo Bitcoin", node.canonicalLesson, node.type]
            : ["Bitcoin", "protocolo Bitcoin"],
        })}
      />
      {children}
    </>
  );
}

