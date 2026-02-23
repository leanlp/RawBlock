import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { getPathById } from "@/lib/graph/pathEngine";
import { absoluteUrl, breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

const ES_PATH_TITLE_MAP: Record<string, string> = {
  "bitcoin-foundations": "Fundamentos de Bitcoin",
  "lightning-primer": "Introduccion a Lightning",
  "transaction-lifecycle": "La Vida de una Transaccion",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pathId: string }>;
}): Promise<Metadata> {
  const { pathId } = await params;
  const path = getPathById(pathId);
  const encoded = encodeURIComponent(pathId);

  if (!path) {
    const metadata = buildPageMetadata({
      title: "Ruta de Aprendizaje",
      description: "Ruta estructurada de aprendizaje de Bitcoin en la Academia de Raw Block.",
      path: `/es/paths/${encoded}`,
      keywords: ["ruta de aprendizaje bitcoin", "academia bitcoin", "raw block academy"],
    });
    return {
      ...metadata,
      alternates: {
        canonical: absoluteUrl(`/es/paths/${encoded}`),
        languages: {
          en: absoluteUrl(`/paths/${encoded}`),
          es: absoluteUrl(`/es/paths/${encoded}`),
          "x-default": absoluteUrl(`/paths/${encoded}`),
        },
      },
    };
  }

  const localizedPathTitle = ES_PATH_TITLE_MAP[path.id] ?? path.title;

  const metadata = buildPageMetadata({
    title: `${localizedPathTitle} (Ruta de Aprendizaje)`,
    description: `${localizedPathTitle} en la Academia de Raw Block, cubriendo ${path.orderedNodes.length} conceptos de Bitcoin en secuencia.`,
    path: `/es/paths/${encodeURIComponent(path.id)}`,
    keywords: ["ruta de aprendizaje bitcoin", "academia", path.id, ...path.title.toLowerCase().split(/\s+/).slice(0, 4)],
  });

  return {
    ...metadata,
    alternates: {
      canonical: absoluteUrl(`/es/paths/${encodeURIComponent(path.id)}`),
      languages: {
        en: absoluteUrl(`/paths/${encodeURIComponent(path.id)}`),
        es: absoluteUrl(`/es/paths/${encodeURIComponent(path.id)}`),
        "x-default": absoluteUrl(`/paths/${encodeURIComponent(path.id)}`),
      },
    },
  };
}

export default async function EsLearningPathLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  const path = getPathById(pathId);
  const pathName = (path && ES_PATH_TITLE_MAP[path.id]) ? ES_PATH_TITLE_MAP[path.id] : (path?.title ?? "Ruta de Aprendizaje");
  const routePath = `/es/paths/${encodeURIComponent(pathId)}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Academia", path: "/es/academy" },
          { name: pathName, path: routePath },
        ])}
      />
      {children}
    </>
  );
}
