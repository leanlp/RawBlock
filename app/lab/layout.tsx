import type { ReactNode } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Protocol Labs",
    template: "%s | Raw Block",
  },
  description:
    "Interactive Bitcoin protocol labs for Script, Taproot, keys, hashing, consensus validation, and educational simulations.",
  alternates: {
    canonical: "https://www.rawblock.net/lab",
  },
};

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Labs", path: "/lab/script" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Protocol Labs",
          description:
            "Interactive Bitcoin protocol labs for Script, Taproot, keys, hashing, Lightning concepts, and consensus validation.",
          path: "/lab/script",
        })}
      />
      {children}
    </>
  );
}
