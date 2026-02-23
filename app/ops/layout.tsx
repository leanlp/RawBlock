import type { ReactNode } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Operations Guides",
    template: "%s | Raw Block",
  },
  description:
    "Operational guidance for running and hardening Bitcoin infrastructure, including node practices, safety, and data provenance notes.",
  alternates: {
    canonical: "https://www.rawblock.net/ops",
  },
};

export default function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Operations", path: "/ops" },
        ])}
      />
      {children}
    </>
  );
}
