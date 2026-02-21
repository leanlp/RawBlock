"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import en, { type TranslationKeys } from "./en";
import es from "./es";

export type Locale = "en" | "es";

const dictionaries: Record<Locale, TranslationKeys> = { en, es };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

const STORAGE_KEY = "rawblock-locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  // Read stored locale on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "en" || stored === "es") {
        setLocaleState(stored);
      }
    } catch {
      // localStorage unavailable — keep default
    }
    setMounted(true);
  }, []);

  // Update <html lang> and persist
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const t = dictionaries[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

export { LanguageContext };
