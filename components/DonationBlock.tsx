"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { Copy, Check, ExternalLink } from "lucide-react";
import {
  DONATION_BIP21_URI,
  DONATION_BTC_ADDRESS,
  DONATION_MEMPOOL_ADDRESS_URL,
} from "@/lib/donation";
import { useTranslation } from "@/lib/i18n";

type DonationBlockProps = {
  variant?: "full" | "compact";
  id?: string;
};

export default function DonationBlock({ variant = "full", id }: DonationBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(DONATION_BTC_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const qrSize = variant === "compact" ? 120 : 200;

  return (
    <section
      id={id}
      className={
        variant === "compact"
          ? "rounded-xl border border-slate-800 bg-slate-900/40 p-4"
          : "rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-950 p-6"
      }
    >
      <div
        className={
          variant === "compact"
            ? "flex flex-col items-center gap-4 sm:flex-row sm:items-start"
            : "flex flex-col gap-6 lg:flex-row lg:items-start"
        }
      >
        <div className="shrink-0 rounded-2xl bg-white p-3 shadow-lg shadow-black/30">
          <QRCode
            value={DONATION_BIP21_URI}
            size={qrSize}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
            aria-label={t.about.donationQrAlt}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div>
            <h2
              className={
                variant === "compact"
                  ? "text-sm font-semibold text-slate-100"
                  : "text-lg font-semibold text-slate-100"
              }
            >
              {t.about.supportTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed">{t.about.supportText}</p>
          </div>

          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
            {t.about.donationWarning}
          </p>

          <p className="break-all font-mono text-xs text-cyan-300 sm:text-sm">{DONATION_BTC_ADDRESS}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={copyAddress}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? t.about.donationCopied : t.about.donationCopy}
            </button>
            <Link
              href={DONATION_MEMPOOL_ADDRESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-cyan-300"
            >
              <ExternalLink size={16} />
              {t.about.donationViewOnMempool}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
