import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Key Forge",
  description:
    "Generate and inspect Bitcoin keys and address formats in-browser with educational safety warnings and secp256k1 math breakdowns.",
  path: "/lab/keys",
  keywords: ["bitcoin keys", "secp256k1", "bech32", "taproot address", "bitcoin education"],
});

export default function LabKeysLayout({ children }: { children: ReactNode }) {
  return children;
}

