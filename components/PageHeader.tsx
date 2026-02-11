"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

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
    const handleCopy = () => {
        if (copyText) {
            navigator.clipboard.writeText(copyText);
            // Optional: You could add a temporary toast here or change icon state
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
                <div>
                    <h1 className={`text-[clamp(1.5rem,2.8vw,2.25rem)] font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient} flex items-center gap-3 leading-tight`}>
                        {icon && (
                            <span className="text-[clamp(1.5rem,2.8vw,2.25rem)]">
                                {typeof icon === 'string' ? icon : icon}
                            </span>
                        )}
                        {title}
                    </h1>
                    {subtitle && (
                        <div className="flex items-center gap-2 mt-2">
                            <p className="text-slate-400 text-sm md:text-base max-w-2xl truncate md:whitespace-normal md:overflow-visible leading-relaxed">
                                {subtitle}
                            </p>
                            {copyText && (
                                <button
                                    onClick={handleCopy}
                                    title="Copy to Clipboard"
                                    className="min-h-11 min-w-11 p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition-colors group inline-flex items-center justify-center"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span className="sr-only">Copy</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
