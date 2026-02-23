import type { ReactNode } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Explorer",
    template: "%s | Raw Block",
  },
  description:
    "Live Bitcoin explorer modules for mempool, network topology, blocks, decoder, fee market, miners, rich list, vitals, and RPC read-only tools.",
  alternates: {
    canonical: "https://www.rawblock.net/explorer",
  },
};

export default function ExplorerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Explorer", path: "/explorer/mempool" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Explorer",
          description:
            "Collection of live Bitcoin explorer dashboards including mempool, network, blocks, decoder, fees, miners, rich list, vitals, and RPC tools.",
          path: "/explorer/mempool",
        })}
      />
      {children}
    </>
  );
}
