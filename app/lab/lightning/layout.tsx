import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Lightning Simulator",
  description:
    "Interactive Lightning Network education module for payment channels, routing concepts, and settlement tradeoffs.",
  path: "/lab/lightning",
  keywords: ["lightning network simulator", "bitcoin lightning education", "payment channels"],
});

export default function LabLightningLayout({ children }: { children: ReactNode }) {
  return children;
}

