"use client";

import type { AcademyNodeContent } from "@/lib/content/schema";
import GlossaryText from "@/components/glossary/GlossaryText";
import { useTranslation } from "@/lib/i18n";

export default function NodeStory({ content }: { content: AcademyNodeContent }) {
  const { locale } = useTranslation();
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-lg font-semibold">{locale === "es" ? "Historia" : "Story"}</h2>
      <p className="text-sm leading-7 text-slate-300">
        <GlossaryText text={content.story} />
      </p>
    </section>
  );
}
