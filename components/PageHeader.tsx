"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: string | ReactNode;
    actions?: ReactNode;
    copyText?: string;
    gradient?: string;
}

/**
 * Shared PageHeader component for consistent section headers across pages.
 * Usage: <PageHeader title="Page Title" subtitle="Description" icon="📦" />
 */
export default function PageHeader({
    title,
    subtitle,
    icon,
    actions,
    copyText,
    gradient = "from-cyan-400 to-blue-500"
}: PageHeaderProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1200);
        return () => clearTimeout(t);
    }, [copied]);

    const handleCopy = async () => {
        if (copyText) {
            try {
                await navigator.clipboard.writeText(copyText);
                setCopied(true);
            } catch {
                setCopied(false);
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pb-6 border-b border-slate-800 mb-8"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-center md:text-left">
                    <h1 className={`mx-auto block max-w-[92vw] break-words text-[clamp(1.25rem,5.2vw,2.25rem)] font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r ${gradient} md:mx-0 md:max-w-none`}>
                        {icon && (
                            <span className="mb-1 hidden align-middle text-[clamp(1.2rem,2.4vw,2rem)] sm:mb-0 sm:mr-2 sm:inline-flex">
                                {typeof icon === 'string' ? icon : icon}
                            </span>
                        )}
                        <span className="align-middle [text-wrap:balance]">{title}</span>
                    </h1>
                    {subtitle && (
                        <div className="mt-2 flex items-center justify-center gap-2 md:justify-start">
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
                                {subtitle}
                            </p>
                            {copyText && (
                                <button
                                    onClick={handleCopy}
                                    title={copied ? "Copied" : "Copy to Clipboard"}
                                    className={`min-h-11 min-w-11 p-1.5 rounded-lg transition-all group inline-flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${copied ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/40' : 'hover:bg-slate-800 text-slate-500 hover:text-cyan-400'}`}
                                >
                                    {copied ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                    <span className="sr-only">Copy</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center justify-center gap-2 flex-shrink-0 md:justify-start">
                        {actions}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
