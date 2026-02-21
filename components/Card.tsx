"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
    /** Card style variants */
    variant?: 'default' | 'metric' | 'panel';
    /** Accent color for hover effects */
    accent?: 'cyan' | 'orange' | 'blue' | 'violet' | 'emerald' | 'red';
}

const accentColors = {
    cyan: 'hover:border-cyan-500/50 group-hover:text-cyan-400',
    orange: 'hover:border-orange-500/50 group-hover:text-orange-400',
    blue: 'hover:border-blue-500/50 group-hover:text-blue-400',
    violet: 'hover:border-violet-500/50 group-hover:text-violet-400',
    emerald: 'hover:border-emerald-500/50 group-hover:text-emerald-400',
    red: 'hover:border-red-500/50 group-hover:text-red-400',
};

/**
 * Shared Card component for consistent styling across the app.
 * Use for both desktop cards and mobile list items.
 */
export default function Card({
    children,
    className = "",
    onClick,
    hoverable = true,
    variant = 'default',
    accent = 'cyan'
}: CardProps) {
    const baseClasses = `
        bg-slate-900/50 
        border border-slate-800 
        rounded-xl 
        backdrop-blur-sm
        transition-all duration-200
        ${hoverable ? `hover:bg-slate-800/50 hover:border-slate-700 ${accentColors[accent].split(' ')[0]}` : ''}
        ${onClick ? 'cursor-pointer group' : ''}
    `;

    const variantClasses = {
        default: '',
        metric: 'text-center flex flex-col justify-center min-h-28 sm:min-h-32 p-3 sm:p-4 lg:p-5',
        panel: 'p-4',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

/**
 * Metric card content - for stats like block height, hashrate, etc.
 */
export function MetricValue({
    icon,
    value,
    label,
    sublabel,
    accent = 'cyan'
}: {
    icon: string;
    value: ReactNode;
    label: string;
    sublabel?: string;
    accent?: 'cyan' | 'orange' | 'blue' | 'violet' | 'emerald' | 'red';
}) {
    const textColors = {
        cyan: 'group-hover:text-cyan-400',
        orange: 'group-hover:text-orange-400',
        blue: 'group-hover:text-blue-400',
        violet: 'group-hover:text-violet-400',
        emerald: 'group-hover:text-emerald-400',
        red: 'group-hover:text-red-400',
    };

    return (
        <>
            <div className="text-lg sm:text-xl lg:text-2xl mb-1">{icon}</div>
            <div className={`text-[clamp(1.25rem,2.2vw,1.875rem)] font-black text-white mb-1 transition-colors truncate ${textColors[accent]}`}>
                {value}
            </div>
            <div className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 uppercase tracking-wider">{label}</div>
            {sublabel && (
                <div className="text-[9px] text-slate-600 mt-1 hidden lg:block truncate">{sublabel}</div>
            )}
        </>
    );
}

/**
 * Card header with title and optional badge/action
 */
export function CardHeader({
    title,
    subtitle,
    badge,
    action
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    badge?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-200 truncate">{title}</h3>
                    {badge}
                </div>
                {subtitle && (
                    <p className="text-sm text-slate-500 mt-1 truncate">{subtitle}</p>
                )}
            </div>
            {action}
        </div>
    );
}

/**
 * Card row for key-value data display
 */
export function CardRow({
    label,
    value,
    mono = false
}: {
    label: string;
    value: ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-800/50 last:border-0">
            <span className="shrink-0 text-xs text-slate-500 uppercase tracking-wider">{label}</span>
            <span className={`min-w-0 max-w-[65%] break-words text-right text-sm text-slate-300 ${mono ? 'font-mono' : ''}`}>
                {value}
            </span>
        </div>
    );
}

/**
 * Panel header for sections
 */
export function PanelHeader({
    children,
    icon
}: {
    children: ReactNode;
    icon?: ReactNode;
}) {
    return (
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            {icon}
            {children}
        </div>
    );
}
