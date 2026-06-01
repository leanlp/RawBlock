import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, collectionPageJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Product Updates",
  description:
    "Release notes and product updates for Raw Block explorer tools, protocol labs, and educational content.",
  path: "/blog",
  keywords: ["bitcoin explorer updates", "raw block changelog"],
  image: "/og/blog.svg",
});

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Updates", path: "/blog" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Updates",
          description: "Product updates and notes on explorer, lab, and Academy releases.",
          path: "/blog",
        })}
      />
      {children}
    </>
  );
}
