import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import SeoContentSection from "@/components/seo/SeoContentSection";
import { buildPageMetadata, faqJsonLd } from "@/lib/seo";
import { getSeoPageContent } from "@/lib/seo/pageContent";

const seo = getSeoPageContent("mempool");

export const metadata = buildPageMetadata({
  title: "Live Mempool Feed",
  description:
    "Explore live unconfirmed Bitcoin transactions, mempool pressure, fee bands, and streaming transaction telemetry in a visual mempool dashboard.",
  path: "/explorer/mempool",
  keywords: ["bitcoin mempool", "unconfirmed transactions", "mempool explorer"],
});

export default function ExplorerMempoolLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={faqJsonLd(seo.faqs)} />
      {children}
      <SeoContentSection pageKey="mempool" />
    </>
  );
}
