"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { useTranslation } from "@/lib/i18n";

const API_GATEWAY_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const CONTACTS = [
  { label: "X (Twitter)", href: "https://x.com/rawblocknet" },
  { label: "LinkedIn", href: "https://linkedin.com/company/rawblock" },
];

const DATA_STACK = [
  {
    label: "Bitcoin Core (self-hosted full node)",
    href: "https://bitcoincore.org/en/download/",
    notesKey: "bitcoinCoreNotes",
  },
  {
    label: "electrs (self-hosted indexer, rolling out)",
    href: "https://github.com/romanz/electrs",
    notesKey: "electrsNotes",
  },
  {
    label: "Rawblock API (our node gateway)",
    href: `${API_GATEWAY_BASE_URL}/api/network-stats`,
    notesKey: "rawblockApiNotes",
  },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={t.about.title}
        subtitle={t.about.intro}
        icon="ℹ️"
        gradient="from-cyan-300 via-blue-400 to-indigo-500"
      />

      {/* Mission */}
      <Card className="p-6" onClick={() => { }}>
        <h2 className="text-lg font-semibold text-slate-100">{t.about.ourMission}</h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {t.about.missionText}
        </p>
      </Card>

      {/* Open Source */}
      <Card className="p-6" onClick={() => { }}>
        <h2 className="text-lg font-semibold text-slate-100">{t.about.openSourceTransparency}</h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {t.about.openSourceText}
        </p>
        <div className="mt-3">
          <Link
            href="https://github.com/rawblock"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cyan-400 text-sm hover:underline"
          >
            {t.about.viewGitHub} →
          </Link>
        </div>
      </Card>

      {/* Operator Model */}
      <Card className="p-6" onClick={() => { }}>
        <h2 className="text-lg font-semibold text-slate-100">{t.about.operatorModel}</h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {t.about.operatorText}
        </p>
        <div className="flex gap-3 mt-4">
          {CONTACTS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </Card>

      {/* Data Stack */}
      <Card className="p-6" onClick={() => { }}>
        <h2 className="text-lg font-semibold text-slate-100">{t.about.dataStack}</h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {t.about.dataStackText}
        </p>
        <div className="mt-4 space-y-3">
          {DATA_STACK.map((source) => (
            <div key={source.href} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <Link
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-400 hover:underline font-medium"
              >
                {source.label}
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* Fallback Policy */}
      <Card className="p-6" onClick={() => { }}>
        <h2 className="text-lg font-semibold text-slate-100">{t.about.fallbackPolicy}</h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {t.about.fallbackText}
        </p>
      </Card>

      {/* RPC Security */}
      <Card className="p-6" onClick={() => { }}>
        <h2 className="text-lg font-semibold text-slate-100">{t.about.rpcSecurity}</h2>
        <ul className="mt-3 space-y-2">
          {t.about.rpcTips.map((tip, idx) => (
            <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      {/* Known Limits */}
      <Card className="p-6" onClick={() => { }}>
        <h2 className="text-lg font-semibold text-slate-100">{t.about.knownLimits}</h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {t.about.knownLimitsText}
        </p>
      </Card>

      {/* Roadmap */}
      <Card className="p-6" onClick={() => { }}>
        <h2 className="text-lg font-semibold text-slate-100">{t.about.projectRoadmap}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <strong className="text-sm text-cyan-300">{t.about.phase1}</strong>
            <p className="mt-1 text-slate-400 text-sm">{t.about.phase1Text}</p>
          </div>
          <div>
            <strong className="text-sm text-cyan-300">{t.about.phase2}</strong>
            <p className="mt-1 text-slate-400 text-sm">{t.about.phase2Text}</p>
          </div>
          <div>
            <strong className="text-sm text-cyan-300">{t.about.phase3}</strong>
            <p className="mt-1 text-slate-400 text-sm">{t.about.phase3Text}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
