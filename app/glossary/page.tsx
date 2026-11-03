import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { getGlossaryEntries } from "@/data/glossary";

export default function GlossaryIndexPage() {
  const entries = getGlossaryEntries("en").sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Bitcoin Protocol Glossary"
        subtitle="Short definitions for terms referenced across explorer views, labs, and Academy nodes."
        icon="📖"
        gradient="from-violet-300 via-purple-400 to-fuchsia-500"
      />

      <Card className="p-4">
        <ul className="grid gap-2 sm:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.key}>
              <Link
                href={`/glossary/${entry.key}`}
                className="block rounded-lg px-3 py-2 text-sm text-cyan-300 hover:bg-slate-800/60"
              >
                {entry.term}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
