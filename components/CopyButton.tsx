"use client";

import { useEffect, useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
  title?: string;
  className?: string;
};

export default function CopyButton({
  text,
  label,
  title = "Copy to clipboard",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const base =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border transition-colors";
  const style =
    copied
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200";

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied" : title}
      className={`${base} ${style} px-3 py-2 text-xs font-bold ${className}`}
    >
      {copied ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
      {label ? <span>{copied ? "Copied" : label}</span> : <span className="sr-only">Copy</span>}
    </button>
  );
}
