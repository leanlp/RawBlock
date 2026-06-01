import RelatedTools from "@/components/seo/RelatedTools";
import {
  getSeoPageContent,
  type SeoPageKey,
} from "@/lib/seo/pageContent";

type SeoContentSectionProps = {
  pageKey: SeoPageKey;
  locale?: "en" | "es";
  className?: string;
};

export default function SeoContentSection({
  pageKey,
  locale = "en",
  className = "",
}: SeoContentSectionProps) {
  const content = getSeoPageContent(pageKey, locale);

  return (
    <section
      className={`mx-auto w-full max-w-5xl border-t border-slate-800/60 px-4 py-10 sm:px-6 ${className}`}
      aria-labelledby={`seo-${pageKey}-heading`}
    >
      <h2
        id={`seo-${pageKey}-heading`}
        className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl"
      >
        {content.h1}
      </h2>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300 sm:text-base">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>

      {content.faqs.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Frequently asked questions
          </h2>
          <ul className="mt-3 space-y-2">
            {content.faqs.map((faq) => (
              <li key={faq.question}>
                <details className="group rounded-lg border border-slate-800/80 bg-slate-950/40">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-100 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-2">
                      {faq.question}
                      <span
                        className="text-slate-500 transition group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="border-t border-slate-800/60 px-4 py-3 text-sm leading-relaxed text-slate-400">
                    {faq.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <RelatedTools links={content.relatedLinks} />
    </section>
  );
}
