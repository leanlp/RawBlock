import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Mempool Tetris",
  description:
    "Gamified Bitcoin block assembly experience for learning fee-rate prioritization, block weight constraints, and transaction selection.",
  path: "/game/tetris",
  keywords: ["mempool tetris", "bitcoin game", "block assembly", "fee rate prioritization"],
});

export default function GameTetrisLayout({ children }: { children: ReactNode }) {
  return children;
}

