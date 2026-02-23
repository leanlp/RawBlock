"use client";

import type { ReactNode } from "react";
import { LanguageProvider, type Locale } from "@/lib/i18n";

export default function ForcedLanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>;
}

