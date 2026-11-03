import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { GLOSSARY_EN, getGlossary } from "@/data/glossary";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ term: string }> };

export function generateStaticParams() {
  return Object.keys(GLOSSARY_EN).map((term) => ({ term }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { term } = await params;
  const entry = GLOSSARY_EN[term];
  if (!entry) return {};

  return buildPageMetadata({
    title: `${entry.term} — Bitcoin Glossary`,
    description: entry.definition,
    path: `/glossary/${term}`,
    keywords: [entry.term, ...entry.aliases],
    image: "/og/glossary.svg",
  });
}

export default async function GlossaryTermPage({ params }: PageProps) {
  const { term } = await params;
  const entry = getGlossary("en")[term];
  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Glossary", path: "/glossary" },
          { name: entry.term, path: `/glossary/${term}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          name: entry.term,
          description: entry.definition,
          url: `https://www.rawblock.net/glossary/${term}`,
          inDefinedTermSet: {
            "@type": "DefinedTermSet",
            name: "Raw Block Bitcoin Glossary",
            url: "https://www.rawblock.net/glossary",
          },
        }}
      />

      <PageHeader title={entry.term} subtitle="Protocol definition" icon="📖" />

      <Card className="p-6">
        <p className="text-sm leading-relaxed text-slate-300">{entry.definition}</p>
        {entry.aliases.length > 0 ? (
          <p className="mt-4 text-xs text-slate-500">
            Also known as: {entry.aliases.join(", ")}
          </p>
        ) : null}
      </Card>

      <Link href="/glossary" className="text-sm text-cyan-400 hover:underline">
        ← All terms
      </Link>
    </div>
  );
}
