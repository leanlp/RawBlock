import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Protocol Vitals",
  description:
    "Monitor Bitcoin protocol vital signs including block height, hashrate, fee recommendations, and halving countdown with provenance badges.",
  path: "/explorer/vitals",
  keywords: ["bitcoin hashrate", "halving countdown", "bitcoin protocol vitals"],
});

export default function ExplorerVitalsLayout({ children }: { children: ReactNode }) {
  return children;
}

