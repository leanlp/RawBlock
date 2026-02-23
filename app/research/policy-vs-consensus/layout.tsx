import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Policy vs Consensus (Legacy Route)",
  description:
    "Legacy route for Raw Block policy-versus-consensus references. Prefer the canonical policy guide page.",
  alternates: {
    canonical: "https://www.rawblock.net/research/policy",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResearchPolicyVsConsensusLegacyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
