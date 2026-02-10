"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: string | ReactNode;
    actions?: ReactNode;
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
    gradient = "from-cyan-400 to-blue-500"
}: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pb-6 border-b border-slate-800 mb-8"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className={`text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient} flex items-center gap-3`}>
                        {icon && (
                            <span className="text-2xl md:text-3xl">
                                {typeof icon === 'string' ? icon : icon}
                            </span>
                        )}
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-2 text-slate-400 text-sm max-w-2xl truncate md:whitespace-normal md:overflow-visible">
                            {subtitle}
                        </p>
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
