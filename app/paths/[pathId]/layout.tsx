import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { getPathById } from "@/lib/graph/pathEngine";
import { absoluteUrl, breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pathId: string }>;
}): Promise<Metadata> {
  const { pathId } = await params;
  const path = getPathById(pathId);
  if (!path) {
    const metadata = buildPageMetadata({
      title: "Learning Path",
      description: "Structured Bitcoin learning path in Raw Block Academy.",
      path: `/paths/${encodeURIComponent(pathId)}`,
      keywords: ["bitcoin learning path", "academy path"],
    });
    return {
      ...metadata,
      alternates: {
        canonical: absoluteUrl(`/paths/${encodeURIComponent(pathId)}`),
        languages: {
          en: absoluteUrl(`/paths/${encodeURIComponent(pathId)}`),
          es: absoluteUrl(`/es/paths/${encodeURIComponent(pathId)}`),
          "x-default": absoluteUrl(`/paths/${encodeURIComponent(pathId)}`),
        },
      },
    };
  }

  const metadata = buildPageMetadata({
    title: `${path.title} (Learning Path)`,
    description: `${path.title} in Raw Block Academy, covering ${path.orderedNodes.length} linked Bitcoin concepts in sequence.`,
    path: `/paths/${encodeURIComponent(path.id)}`,
    keywords: ["bitcoin learning path", "academy", path.id, ...path.title.toLowerCase().split(/\s+/).slice(0, 4)],
  });
  return {
    ...metadata,
    alternates: {
      canonical: absoluteUrl(`/paths/${encodeURIComponent(path.id)}`),
      languages: {
        en: absoluteUrl(`/paths/${encodeURIComponent(path.id)}`),
        es: absoluteUrl(`/es/paths/${encodeURIComponent(path.id)}`),
        "x-default": absoluteUrl(`/paths/${encodeURIComponent(path.id)}`),
      },
    },
  };
}

export default async function LearningPathLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  const path = getPathById(pathId);
  const pathName = path?.title ?? "Learning Path";
  const routePath = `/paths/${encodeURIComponent(pathId)}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Academy", path: "/academy" },
          { name: pathName, path: routePath },
        ])}
      />
      {children}
    </>
  );
}
