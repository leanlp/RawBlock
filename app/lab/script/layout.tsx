import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import SeoContentSection from "@/components/seo/SeoContentSection";
import {
  buildPageMetadata,
  faqJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";
import { getSeoPageContent } from "@/lib/seo/pageContent";

const seo = getSeoPageContent("scriptLab");

export const metadata = buildPageMetadata({
  title: "Script Lab",
  description:
    "Visual Bitcoin Script interpreter and consensus trace lab with stack stepping, opcode stream inspection, and scenario presets.",
  path: "/lab/script",
  keywords: ["bitcoin script", "script debugger", "opcode stack", "script interpreter"],
  image: "/og/script-lab.svg",
});

export default function LabScriptLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={faqJsonLd(seo.faqs)} />
      <JsonLd
        data={softwareApplicationJsonLd({
          name: "Raw Block Script Lab",
          description:
            "Visual Bitcoin Script interpreter with stack stepping and consensus trace presets.",
          path: "/lab/script",
        })}
      />
      {children}
      <SeoContentSection pageKey="scriptLab" />
    </>
  );
}
