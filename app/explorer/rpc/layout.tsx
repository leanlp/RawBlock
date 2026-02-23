import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Node Terminal (Read-only RPC)",
  description:
    "Read-only Bitcoin Core JSON-RPC console with safety guidance, command presets, and backend-connected execution for learning and diagnostics.",
  path: "/explorer/rpc",
  keywords: ["bitcoin rpc console", "bitcoin core json-rpc", "read-only rpc"],
});

export default function ExplorerRpcLayout({ children }: { children: ReactNode }) {
  return children;
}

