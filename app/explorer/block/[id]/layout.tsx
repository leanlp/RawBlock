import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

type Props = {
  children: ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildPageMetadata({
    title: `Block ${id}`,
    description:
      "Inspect Bitcoin block headers, merkle root/proof visualization, block transaction distribution, and coinbase decoding.",
    path: `/explorer/block/${encodeURIComponent(id)}`,
    keywords: ["bitcoin block header", "merkle root", "coinbase transaction", "block explorer"],
  });
}

export default async function ExplorerBlockDetailLayout({
  children,
  params,
}: Props & { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const path = `/explorer/block/${encodeURIComponent(id)}`;
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Explorer", path: "/explorer/blocks" },
          { name: "Blocks", path: "/explorer/blocks" },
          { name: `Block ${id}`, path },
        ])}
      />
      {children}
    </>
  );
}
