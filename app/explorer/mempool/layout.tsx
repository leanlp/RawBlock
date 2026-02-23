import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Live Mempool Feed",
  description:
    "Explore live unconfirmed Bitcoin transactions, mempool pressure, fee bands, and streaming transaction telemetry in a visual mempool dashboard.",
  path: "/explorer/mempool",
  keywords: ["bitcoin mempool", "unconfirmed transactions", "mempool explorer"],
});

export default function ExplorerMempoolLayout({ children }: { children: ReactNode }) {
  return children;
}

