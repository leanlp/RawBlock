"use client";

import { ReactNode, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";

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
        ${hoverable || onClick ? 'group' : ''}
        ${onClick ? 'cursor-pointer' : ''}
    `;

    const variantClasses = {
        default: '',
        metric: 'text-center flex flex-col justify-center min-h-28 sm:min-h-32 p-3 sm:p-4 lg:p-5',
        panel: 'p-4',
    };

    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!hoverable) return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;

        const width = rect.width;
        const height = rect.height;

        const clientXRel = e.clientX - rect.left;
        const clientYRel = e.clientY - rect.top;

        mouseX.set(clientXRel);
        mouseY.set(clientYRel);

        const xPct = clientXRel / width - 0.5;
        const yPct = clientYRel / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        if (!hoverable) return;
        x.set(0);
        y.set(0);
    };

    const glowColors = {
        cyan: 'rgba(13, 204, 242, 0.15)',
        orange: 'rgba(249, 115, 22, 0.15)',
        blue: 'rgba(59, 130, 246, 0.15)',
        violet: 'rgba(139, 92, 246, 0.15)',
        emerald: 'rgba(16, 185, 129, 0.15)',
        red: 'rgba(239, 68, 68, 0.15)',
    };

    return (
        <div style={{ perspective: 1200 }} className={`h-full ${className.includes('w-full') ? 'w-full' : ''}`}>
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                style={{
                    rotateX: hoverable ? rotateX : 0,
                    rotateY: hoverable ? rotateY : 0,
                    transformStyle: "preserve-3d"
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                whileHover={hoverable ? { scale: 1.02 } : {}}
                className={`${baseClasses} ${variantClasses[variant]} ${className} relative h-full shadow-xl ${hoverable ? 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : ''}`}
                onClick={onClick}
            >
                {/* Background Glow Layer */}
                {hoverable && (
                    <div
                        className="absolute inset-0 pointer-events-none transition duration-500 opacity-0 group-hover:opacity-100 rounded-xl overflow-hidden"
                        style={{ transform: "translateZ(0px)" }}
                    >
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background: useMotionTemplate`
                                    radial-gradient(
                                        400px circle at ${mouseX}px ${mouseY}px,
                                        ${glowColors[accent]},
                                        transparent 80%
                                    )
                                `,
                            }}
                        />
                    </div>
                )}

                <div
                    className="relative z-10 flex flex-col h-full pointer-events-none transition-transform duration-300"
                    style={{ transform: hoverable ? "translateZ(40px)" : "none", transformStyle: "preserve-3d" }}
                >
                    <div className="pointer-events-auto h-full w-full flex flex-col justify-center">
                        {children}
                    </div>
                </div>
            </motion.div>
        </div>
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
