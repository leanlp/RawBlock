import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Mining Simulator",
  description:
    "Bitcoin mining simulation environment for hash rate, luck, block timing, and fee/reward intuition.",
  path: "/game/mining",
  keywords: ["bitcoin mining simulator", "hashrate", "mining luck", "bitcoin education"],
});

export default function GameMiningLayout({ children }: { children: ReactNode }) {
  return children;
}

