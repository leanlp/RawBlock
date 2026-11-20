import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

type Props = {
  children: ReactNode;
};

function sanitizeBlockIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed) || /^(0|[1-9]\d{0,9})$/.test(trimmed)) {
    return trimmed;
  }
  return "Unknown";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const safeId = sanitizeBlockIdentifier(id);
  return buildPageMetadata({
    // The genesis block is the one block people search for by name.
    title: safeId === "1" ? "The Genesis Block" : `Block ${safeId}`,
    description:
      "Inspect Bitcoin block headers, merkle root/proof visualization, block transaction distribution, and coinbase decoding.",
    path: `/explorer/block/${encodeURIComponent(safeId)}`,
    keywords: ["bitcoin block header", "merkle root", "coinbase transaction", "block explorer"],
  });
}

export default async function ExplorerBlockDetailLayout({
  children,
  params,
}: Props & { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const safeId = sanitizeBlockIdentifier(id);
  const path = `/explorer/block/${encodeURIComponent(safeId)}`;
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Explorer", path: "/explorer/blocks" },
          { name: "Blocks", path: "/explorer/blocks" },
          { name: safeId === "1" ? "The Genesis Block" : `Block ${safeId}`, path },
        ])}
      />
      {children}
    </>
  );
}
