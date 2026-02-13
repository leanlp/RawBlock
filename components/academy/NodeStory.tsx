import type { AcademyNodeContent } from "@/lib/content/schema";
import GlossaryText from "@/components/glossary/GlossaryText";

export default function NodeStory({ content }: { content: AcademyNodeContent }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-lg font-semibold">Story</h2>
      <p className="text-sm leading-7 text-slate-300">
        <GlossaryText text={content.story} />
      </p>
    </section>
  );
}
