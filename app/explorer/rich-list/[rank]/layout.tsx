import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rank: string }>;
}): Promise<Metadata> {
  const { rank } = await params;
  return buildPageMetadata({
    title: `Whale #${rank}`,
    description:
      "Inspect a rich-list address UTXO distribution, scan height, balance, and unspent outputs timeline in Raw Block Whale Watch.",
    path: `/explorer/rich-list/${encodeURIComponent(rank)}`,
    keywords: ["bitcoin whale", "utxo distribution", "rich list address"],
  });
}

export default async function ExplorerWhaleDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ rank: string }>;
}) {
  const { rank } = await params;
  const path = `/explorer/rich-list/${encodeURIComponent(rank)}`;
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Explorer", path: "/explorer/rich-list" },
          { name: "Rich List", path: "/explorer/rich-list" },
          { name: `Whale #${rank}`, path },
        ])}
      />
      {children}
    </>
  );
}
