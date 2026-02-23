import type { ReactNode } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    default: "Simulations & Games",
    template: "%s | Raw Block",
  },
  description:
    "Interactive Bitcoin simulations and games for mempool pressure, mining, and transaction selection behavior.",
  alternates: {
    canonical: "https://www.rawblock.net/game",
  },
};

export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Simulations", path: "/game/mempool" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Raw Block Simulations & Games",
          description:
            "Interactive Bitcoin simulations and games for mempool behavior, mining intuition, and transaction selection.",
          path: "/game/mempool",
        })}
      />
      {children}
    </>
  );
}
