import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "API Docs Redirect",
  description: "Legacy redirect to the Raw Block Node Terminal / RPC explorer route.",
  alternates: {
    canonical: "https://www.rawblock.net/explorer/rpc",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ExplorerApiLayout({ children }: { children: ReactNode }) {
  return children;
}
