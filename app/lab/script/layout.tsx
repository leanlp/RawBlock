import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Script Lab",
  description:
    "Visual Bitcoin Script interpreter and consensus trace lab with stack stepping, opcode stream inspection, and scenario presets.",
  path: "/lab/script",
  keywords: ["bitcoin script", "script debugger", "opcode stack", "script interpreter"],
});

export default function LabScriptLayout({ children }: { children: ReactNode }) {
  return children;
}

