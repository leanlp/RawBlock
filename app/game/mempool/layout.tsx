import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Mempool Simulator",
  description:
    "Simulate Bitcoin mempool pressure, RBF/CPFP fee bumping, and inclusion outcomes with an interactive educational model.",
  path: "/game/mempool",
  keywords: ["mempool simulator", "rbf", "cpfp", "bitcoin fee bumping"],
});

export default function GameMempoolLayout({ children }: { children: ReactNode }) {
  return children;
}

