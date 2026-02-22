"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Shared empty state component with clear CTAs
 */
export default function EmptyState({
    icon = "📭",
    title,
    description,
    action,
    secondaryAction
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
            )}

            <div className="flex gap-3">
                {action && (
                    <button
                        onClick={action.onClick}
                        className="btn-accent px-4 py-2 text-sm"
                    >
                        {action.label}
                    </button>
                )}
                {secondaryAction && (
                    <button
                        onClick={secondaryAction.onClick}
                        className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                        {secondaryAction.label}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

/**
 * Loading state with optional message
 */
export function LoadingState({ message }: { message?: string }) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm">{message ?? t.common.loading}</p>
        </div>
    );
}

/**
 * Error state with retry action
 */
export function ErrorState({
    message,
    onRetry
}: {
    message?: string;
    onRetry?: () => void;
}) {
    const { t } = useTranslation();
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    return (
        <EmptyState
            icon="⚠️"
            title={t.common.connectionError}
            description={message ?? t.common.somethingWentWrong}
            action={onRetry ? { label: t.common.tryAgain, onClick: onRetry } : undefined}
            secondaryAction={
                apiUrl
                    ? {
                        label: t.common.checkNode,
                        onClick: () => window.open(apiUrl, "_blank")
                    }
                    : undefined
            }
        />
    );
}
