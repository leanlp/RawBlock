import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Transaction Decoder",
  description:
    "Decode Bitcoin transactions by txid, address, or raw hex with human-readable fields, raw bytes, scripts, witnesses, and privacy heuristics.",
  path: "/explorer/decoder",
  keywords: ["bitcoin transaction decoder", "raw tx hex", "script disassembly", "segwit witness"],
});

export default function ExplorerDecoderLayout({ children }: { children: ReactNode }) {
  return children;
}

