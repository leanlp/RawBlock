import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import SeoContentSection from "@/components/seo/SeoContentSection";
import {
  buildPageMetadata,
  faqJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";
import { getSeoPageContent } from "@/lib/seo/pageContent";

const seo = getSeoPageContent("decoder");

export const metadata = buildPageMetadata({
  title: "Transaction Decoder",
  description:
    "Decode Bitcoin transactions by txid, address, or raw hex with human-readable fields, raw bytes, scripts, witnesses, and privacy heuristics.",
  path: "/explorer/decoder",
  keywords: ["bitcoin transaction decoder", "raw tx hex", "script disassembly", "segwit witness"],
  image: "/og/decoder.svg",
});

export default function ExplorerDecoderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={faqJsonLd(seo.faqs)} />
      <JsonLd
        data={softwareApplicationJsonLd({
          name: "Raw Block Transaction Decoder",
          description:
            "Decode Bitcoin transactions by txid, address, or raw hex with script and witness inspection.",
          path: "/explorer/decoder",
        })}
      />
      {children}
      <SeoContentSection pageKey="decoder" />
    </>
  );
}
