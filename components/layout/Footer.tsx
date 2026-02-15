import Link from "next/link";
import { Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full py-6 mt-12 border-t border-slate-800/50">
            <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-slate-500 text-sm">
                    © {new Date().getFullYear()} Raw Block. All rights reserved.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                        href="/about"
                        className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-sm min-h-11"
                    >
                        About & Trust
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
