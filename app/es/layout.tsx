import type { Metadata } from "next";
import type { ReactNode } from "react";
import ForcedLanguageProvider from "@/components/providers/ForcedLanguageProvider";

export const metadata: Metadata = {
  title: {
    default: "Raw Block (ES)",
    template: "%s | Raw Block",
  },
  alternates: {
    canonical: "https://www.rawblock.net/es",
    languages: {
      en: "https://www.rawblock.net/",
      es: "https://www.rawblock.net/es",
      "x-default": "https://www.rawblock.net/",
    },
  },
};

export default function SpanishRootLayout({ children }: { children: ReactNode }) {
  return <ForcedLanguageProvider locale="es">{children}</ForcedLanguageProvider>;
}
