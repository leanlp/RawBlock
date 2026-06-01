import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildPageMetadata, collectionPageJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Bitcoin Protocol Glossary",
  description:
    "Definitions for UTXO, mempool, SegWit, Taproot, consensus rules, and other core Bitcoin protocol terms used across Raw Block tools.",
  path: "/glossary",
  keywords: ["bitcoin glossary", "utxo definition", "mempool definition", "taproot glossary"],
  image: "/og/glossary.svg",
});

export default function GlossaryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Glossary", path: "/glossary" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Bitcoin Glossary",
          description: "Protocol term definitions linked from explorer, lab, and Academy modules.",
          path: "/glossary",
        })}
      />
      {children}
    </>
  );
}
