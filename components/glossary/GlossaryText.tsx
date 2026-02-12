"use client";

import { useMemo } from "react";
import { GLOSSARY_ENTRIES } from "@/data/glossary";
import GlossaryTerm from "@/components/glossary/GlossaryTerm";

type GlossaryTextProps = {
  text: string;
  className?: string;
};

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function GlossaryText({ text, className }: GlossaryTextProps) {
  const { pattern, aliasToEntry } = useMemo(() => {
    const aliasPairs: Array<{ alias: string; entryKey: string }> = [];

    GLOSSARY_ENTRIES.forEach((entry) => {
      entry.aliases.forEach((alias) => {
        aliasPairs.push({ alias, entryKey: entry.key });
      });
    });

    aliasPairs.sort((a, b) => b.alias.length - a.alias.length);

    const aliasToEntryMap = new Map<string, string>();
    aliasPairs.forEach(({ alias, entryKey }) => {
      aliasToEntryMap.set(alias.toLowerCase(), entryKey);
    });

    const alternation = aliasPairs.map(({ alias }) => escapeRegex(alias)).join("|");
    const safePattern = alternation.length > 0
      ? new RegExp(`\\b(${alternation})\\b`, "gi")
      : null;

    return {
      pattern: safePattern,
      aliasToEntry: aliasToEntryMap,
    };
  }, []);

  const parts = useMemo(() => {
    if (!pattern) return [text];
    return text.split(pattern);
  }, [pattern, text]);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const entryKey = aliasToEntry.get(part.toLowerCase());
        if (!entryKey) {
          return <span key={`plain-${index}`}>{part}</span>;
        }

        return <GlossaryTerm key={`term-${index}`} entryKey={entryKey} label={part} />;
      })}
    </span>
  );
}
