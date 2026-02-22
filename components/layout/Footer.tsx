"use client";

import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="w-full py-6 mt-12 border-t border-slate-800/50">
            <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start gap-1">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Raw Block. {t.footer.allRightsReserved}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {t.footer.mainnetConnected}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                        href="/about"
                        className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-sm min-h-11"
                    >
                        {t.footer.aboutAndTrust}
                    </Link>
                    <Link
                        href="https://github.com/rawblock"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-sm min-h-11"
                    >
                        <Github size={16} />
                        <span>GitHub</span>
                    </Link>
                    <Link
                        href="https://x.com/rawblocknet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-sm min-h-11"
                    >
                        <Twitter size={16} />
                        <span>Twitter</span>
                    </Link>
                    <Link
                        href="https://linkedin.com/company/rawblock"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-sm min-h-11"
                    >
                        <Linkedin size={16} />
                        <span>LinkedIn</span>
                    </Link>
                </div>
            </div>
        </footer>
    );
}
