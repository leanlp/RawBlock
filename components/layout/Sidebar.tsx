"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Twitter, Linkedin, ChevronLeft, ChevronRight, House } from "lucide-react";
import { useEffect, useState } from "react";
import { GUIDED_LESSONS } from "../../data/guided-learning";
import { useGuidedLearning } from "../providers/GuidedLearningProvider";
import { getCanonicalPath } from "@/lib/graph/pathEngine";

type NavItem = {
    name: string;
    path: string;
    icon: string;
};

type NavSection = {
    category: string;
    items: NavItem[];
};

const NAV_ITEMS: NavSection[] = [
    {
        category: "Start",
        items: [
            { name: "Home", path: "/", icon: "🏠" },
        ]
    },
    {
        category: "Explorer",
        items: [
            { name: "Mempool", path: "/explorer/mempool", icon: "🌊" },
            { name: "Network", path: "/explorer/network", icon: "🌍" },
            { name: "Blocks", path: "/explorer/blocks", icon: "📦" },
            { name: "Decoder", path: "/explorer/decoder", icon: "🔍" },
            { name: "Rich List", path: "/explorer/rich-list", icon: "🐳" },
            { name: "Fees", path: "/explorer/fees", icon: "💸" },
            { name: "Miners", path: "/explorer/miners", icon: "⛏️" },
            { name: "Vitals", path: "/explorer/vitals", icon: "🩺" },
            { name: "RPC Console", path: "/explorer/rpc", icon: "💻" },
            { name: "UTXO Set", path: "/analysis/utxo", icon: "🔬" },
        ]
    },
    {
        category: "Learn",
        items: [
            { name: "Script", path: "/lab/script", icon: "⚗️" },
            { name: "Taproot", path: "/lab/taproot", icon: "🌱" },
            { name: "Keys", path: "/lab/keys", icon: "🗝️" },
            { name: "Hashing", path: "/lab/hashing", icon: "🔨" },
            { name: "Consensus", path: "/lab/consensus", icon: "⚙️" },
        ]
    },
    {
        category: "Analysis",
        items: [
            { name: "Forensics", path: "/analysis/forensics", icon: "🕵️‍♂️" },
            { name: "Evolution", path: "/analysis/evolution", icon: "📈" },
            { name: "D-Index", path: "/analysis/d-index", icon: "⚖️" },
            { name: "Graffiti", path: "/analysis/graffiti", icon: "🎨" },
        ]
    },
    {
        category: "Simulations",
        items: [
            { name: "Mempool Tetris", path: "/game/tetris", icon: "🧱" },
            { name: "Mining Simulator", path: "/game/mining", icon: "⛏️" },
            { name: "Lightning Simulator", path: "/lab/lightning", icon: "⚡" },
        ]
    },
    {
        category: "Knowledge",
        items: [
            { name: "Academy", path: "/academy", icon: "🎓" },
            { name: "Research", path: "/research", icon: "📚" },
            { name: "Vulnerabilities", path: "/research/vulnerabilities", icon: "🛡️" },
            { name: "Attack Models", path: "/research/attacks", icon: "🎯" },
            { name: "Assumptions", path: "/research/assumptions", icon: "📌" },
            { name: "Policy vs Cons.", path: "/research/policy-vs-consensus", icon: "⚖️" },
        ]
    },
];

const ORDERED_MENU_PATHS = NAV_ITEMS.flatMap((section) => section.items.map((item) => item.path));

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isScrollingDown, setIsScrollingDown] = useState(false);
    const { progressPercent, currentLessonIndex } = useGuidedLearning();
    const lessonNumber = Math.min(currentLessonIndex + 1, GUIDED_LESSONS.length);
    const currentLessonTitle = GUIDED_LESSONS[lessonNumber - 1]?.title ?? GUIDED_LESSONS[0].title;
    const canonicalConceptCount = getCanonicalPath().orderedNodes.length;

    const activeIndex = (() => {
        const candidates = ORDERED_MENU_PATHS
            .map((path, index) => ({ path, index }))
            .filter(({ path }) => path === "/" ? pathname === "/" : pathname.startsWith(path))
            .sort((a, b) => b.path.length - a.path.length);
        return candidates[0]?.index ?? 0;
    })();
    const previousPath = ORDERED_MENU_PATHS[(activeIndex - 1 + ORDERED_MENU_PATHS.length) % ORDERED_MENU_PATHS.length];
    const nextPath = ORDERED_MENU_PATHS[(activeIndex + 1) % ORDERED_MENU_PATHS.length];

    useEffect(() => {
        let lastY = window.scrollY;

        const handleScroll = () => {
            const currentY = window.scrollY;
            setIsScrolled(currentY > 16);
            setIsScrollingDown(currentY > lastY + 2 && currentY > 48);
            lastY = currentY;
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!mobileOpen) return;

        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style;
        const scrollY = window.scrollY;

        const previousBody = {
            overflow: bodyStyle.overflow,
            position: bodyStyle.position,
            top: bodyStyle.top,
            width: bodyStyle.width,
            overscrollBehavior: bodyStyle.overscrollBehavior,
        };
        const previousHtml = {
            overscrollBehavior: htmlStyle.overscrollBehavior,
        };

        // Freeze document scroll while the mobile drawer is open.
        bodyStyle.overflow = "hidden";
        bodyStyle.position = "fixed";
        bodyStyle.top = `-${scrollY}px`;
        bodyStyle.width = "100%";
        bodyStyle.overscrollBehavior = "none";
        htmlStyle.overscrollBehavior = "none";

        return () => {
            bodyStyle.overflow = previousBody.overflow;
            bodyStyle.position = previousBody.position;
            bodyStyle.top = previousBody.top;
            bodyStyle.width = previousBody.width;
            bodyStyle.overscrollBehavior = previousBody.overscrollBehavior;
            htmlStyle.overscrollBehavior = previousHtml.overscrollBehavior;
            window.scrollTo(0, scrollY);
        };
    }, [mobileOpen]);

    const sidebarContent = (
        <>
            <div className="border-b border-slate-800/50 px-3 py-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Learning Journey</p>
                    <p className="text-xs text-slate-300 mt-1">
                        Guided Lesson {lessonNumber}/{GUIDED_LESSONS.length}: {currentLessonTitle}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                        Path scope: {GUIDED_LESSONS.length} lessons • {canonicalConceptCount} concepts
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-2">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-cyan-300">{progressPercent}% complete</span>
                        <Link
                            href="/#guided-learning-mode"
                            onClick={() => setMobileOpen(false)}
                            className="text-[11px] text-slate-300 hover:text-cyan-300 transition-colors"
                        >
                            Resume
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
                {NAV_ITEMS.map((section, idx) => (
                    <div key={idx}>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-3">
                            {section.category}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.path ||
                                    (item.path !== "/" && pathname.startsWith(item.path));

                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        onClick={() => setMobileOpen(false)}
                                    className={`
                                            group relative flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-lg
                                            transition-all duration-200
                                            ${isActive
                                                ? 'bg-cyan-500/10 text-cyan-400'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                            }
                                        `}
                                    >
                                        <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center text-base leading-none">{item.icon}</span>
                                        <span className="truncate text-[13px] font-medium leading-5 tracking-[0.01em]">{item.name}</span>
                                        {isActive && (
                                            <motion.div
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full"
                                                layoutId="activeIndicator"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800/50 flex flex-col gap-4">
                <div className="flex justify-center gap-4">
                    <Link
                        href="https://x.com/rawblocknet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center justify-center min-h-11 min-w-11"
                    >
                        <Twitter size={16} />
                    </Link>
                    <Link
                        href="https://linkedin.com/company/rawblock"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center justify-center min-h-11 min-w-11"
                    >
                        <Linkedin size={16} />
                    </Link>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Quick Route Controls (Mobile) */}
            <div className={`md:hidden fixed top-4 left-16 z-[79] ${mobileOpen ? "hidden" : "flex"} flex-row gap-2 transition-all duration-300 ${isScrollingDown ? "opacity-55" : isScrolled ? "opacity-80" : "opacity-100"}`}>
                <Link
                    href={previousPath}
                    className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-300 shadow-lg shadow-black/20 transition-all duration-300 hover:text-cyan-300 ${isScrollingDown ? "border border-slate-700/50 bg-slate-900/35 backdrop-blur-[2px]" : isScrolled ? "border border-slate-700/70 bg-slate-900/60 backdrop-blur-sm" : "border border-slate-800 bg-slate-900/85 backdrop-blur-sm"}`}
                    aria-label="Previous menu page"
                    title="Previous"
                >
                    <ChevronLeft size={14} />
                </Link>
                <Link
                    href="/"
                    className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-300 shadow-lg shadow-black/20 transition-all duration-300 hover:text-cyan-300 ${isScrollingDown ? "border border-slate-700/50 bg-slate-900/35 backdrop-blur-[2px]" : isScrolled ? "border border-slate-700/70 bg-slate-900/60 backdrop-blur-sm" : "border border-slate-800 bg-slate-900/85 backdrop-blur-sm"}`}
                    aria-label="Go home"
                    title="Home"
                >
                    <House size={14} />
                </Link>
                <Link
                    href={nextPath}
                    className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-300 shadow-lg shadow-black/20 transition-all duration-300 hover:text-cyan-300 ${isScrollingDown ? "border border-slate-700/50 bg-slate-900/35 backdrop-blur-[2px]" : isScrolled ? "border border-slate-700/70 bg-slate-900/60 backdrop-blur-sm" : "border border-slate-800 bg-slate-900/85 backdrop-blur-sm"}`}
                    aria-label="Next menu page"
                    title="Next"
                >
                    <ChevronRight size={14} />
                </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`md:hidden fixed top-4 left-4 z-[80] flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-all duration-300 hover:text-cyan-400 ${isScrollingDown ? "border border-slate-700/50 bg-slate-900/35 backdrop-blur-[2px]" : isScrolled ? "border border-slate-700/70 bg-slate-900/60 backdrop-blur-sm" : "border border-slate-800 bg-slate-900/90 backdrop-blur-sm"}`}
                aria-label="Toggle menu"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="md:hidden fixed left-0 top-0 bottom-0 z-[80] w-64 bg-slate-950/98 backdrop-blur-xl border-r border-slate-900 flex flex-col"
                    >
                        {sidebarContent}
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`
                    fixed left-0 top-0 bottom-0 z-30
                    bg-slate-950/95 backdrop-blur-xl border-r border-slate-900
                    transition-all duration-300 ease-in-out
                    w-64
                    hidden md:flex flex-col
                `}
            >
                {sidebarContent}
            </motion.aside>
        </>
    );
}
