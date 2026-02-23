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
  const node = getAcademyNodeContent(nodeId, "en");
  if (!node) {
    return buildPageMetadata({
      title: `Academy Lesson ${nodeId}`,
      description: "Bitcoin protocol lesson in the Raw Block Academy knowledge graph.",
      path: `/academy/${encodeURIComponent(nodeId)}`,
      keywords: ["bitcoin academy", "bitcoin lesson"],
    });
  }

  const metadata = buildPageMetadata({
    title: `${node.title} (Academy)`,
    description: node.summary,
    path: `/academy/${encodeURIComponent(nodeId)}`,
    keywords: [
      "bitcoin academy",
      "bitcoin protocol lesson",
      node.type,
      node.canonicalLesson,
      ...node.pathMappings.slice(0, 3),
    ],
  });
  metadata.alternates = {
    canonical: `https://www.rawblock.net/academy/${encodeURIComponent(nodeId)}`,
    languages: {
      en: `https://www.rawblock.net/academy/${encodeURIComponent(nodeId)}`,
      es: `https://www.rawblock.net/es/academy/${encodeURIComponent(nodeId)}`,
      "x-default": `https://www.rawblock.net/academy/${encodeURIComponent(nodeId)}`,
    },
  };
  return metadata;
}

export default async function AcademyNodeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  const node = getAcademyNodeContent(nodeId, "en");
  const title = node ? `${node.title} (Academy)` : `Academy Lesson ${nodeId}`;
  const description =
    node?.summary ?? "Bitcoin protocol lesson in the Raw Block Academy knowledge graph.";
  const path = `/academy/${encodeURIComponent(nodeId)}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Academy", path: "/academy" },
          { name: node?.title ?? nodeId, path },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: title,
          description,
          path,
          dateModified: node?.verifiedAt,
          about: node
            ? [
                "Bitcoin",
                "Bitcoin protocol",
                node.canonicalLesson,
                node.type,
                ...node.pathMappings.slice(0, 2),
              ]
            : ["Bitcoin", "Bitcoin protocol"],
        })}
      />
      {children}
    </>
  );
}
