import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Taproot Playground",
  description:
    "Experiment with Schnorr signatures, key aggregation concepts, and Taproot-related primitives in an interactive educational playground.",
  path: "/lab/taproot",
  keywords: ["taproot", "schnorr", "muSig", "bitcoin cryptography"],
});

export default function LabTaprootLayout({ children }: { children: ReactNode }) {
  return children;
}

