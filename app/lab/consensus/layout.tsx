import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Consensus Debugger",
  description:
    "Step through Bitcoin block validation and consensus checks with a visual debugger for proof-of-work, timestamps, and rule-by-rule verification.",
  path: "/lab/consensus",
  keywords: ["bitcoin consensus", "block validation", "consensus debugger"],
});

export default function LabConsensusLayout({ children }: { children: ReactNode }) {
  return children;
}

