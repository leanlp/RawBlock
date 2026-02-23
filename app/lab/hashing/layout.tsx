import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Hashing Foundry",
  description:
    "Manual proof-of-work simulator for Bitcoin block headers with nonce search, target difficulty controls, and hash output visualization.",
  path: "/lab/hashing",
  keywords: ["bitcoin proof of work", "nonce mining simulator", "sha256"],
});

export default function LabHashingLayout({ children }: { children: ReactNode }) {
  return children;
}

