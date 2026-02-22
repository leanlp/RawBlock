"use client";

import { useState } from "react";
import { getGlossary, type GlossaryEntry } from "@/data/glossary";
import { useTranslation } from "@/lib/i18n";

type GlossaryTermProps = {
  entryKey: string;
  label?: string;
};

export default function GlossaryTerm({ entryKey, label }: GlossaryTermProps) {
  const { locale } = useTranslation();
  const entry: GlossaryEntry | undefined = getGlossary(locale)[entryKey];
  const [open, setOpen] = useState(false);

  if (!entry) {
    return <>{label ?? entryKey}</>;
  }

  return (
    <span className="group relative inline-flex align-baseline">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-1 rounded-sm border-b border-dashed border-cyan-500/70 text-inherit"
      >
        <span>{label ?? entry.term}</span>
        <span className="text-[10px] text-cyan-400">ⓘ</span>
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-0 top-[calc(100%+6px)] z-30 w-64 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-left text-xs leading-relaxed text-slate-200 shadow-xl transition-opacity ${open ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          }`}
      >
        <span className="font-semibold text-cyan-300">{entry.term}</span>
        <span className="block mt-1">{entry.definition}</span>
      </span>
    </span>
  );
}
