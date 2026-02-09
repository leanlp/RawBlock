import Link from "next/link";
import { Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full py-6 mt-12 border-t border-slate-800/50">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-slate-500 text-sm">
                    © {new Date().getFullYear()} Raw Block. All rights reserved.
                </p>

                <div className="flex items-center gap-6">
                    <Link
                        href="https://x.com/rawblocknet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 text-sm"
                    >
                        <Twitter size={16} />
                        <span>Twitter</span>
                    </Link>
                    <Link
                        href="https://linkedin.com/company/rawblock"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 text-sm"
                    >
                        <Linkedin size={16} />
                        <span>LinkedIn</span>
                    </Link>
                </div>
            </div>
        </footer>
    );
}
