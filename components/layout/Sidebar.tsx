"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Twitter, Linkedin, ChevronLeft, ChevronRight, House, CheckCircle2, Globe } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useGuidedLearning } from "../providers/GuidedLearningProvider";
import { getCanonicalPath } from "@/lib/graph/pathEngine";
import GlobalSearch from "../explorer/GlobalSearch";
import { useTranslation } from "@/lib/i18n";

type NavItem = {
    nameKey: string;
    path: string;
    icon: string;
};

type NavSection = {
    categoryKey: string;
    items: NavItem[];
};

const NAV_ITEMS: NavSection[] = [
    {
        categoryKey: "start",
        items: [
            { nameKey: "home", path: "/", icon: "🏠" },
        ]
    },
    {
        categoryKey: "explorer",
        items: [
            { nameKey: "mempool", path: "/explorer/mempool", icon: "🌊" },
            { nameKey: "network", path: "/explorer/network", icon: "🌍" },
            { nameKey: "blocks", path: "/explorer/blocks", icon: "📦" },
            { nameKey: "decoder", path: "/explorer/decoder", icon: "🔍" },
            { nameKey: "richList", path: "/explorer/rich-list", icon: "🐳" },
            { nameKey: "fees", path: "/explorer/fees", icon: "💸" },
            { nameKey: "miners", path: "/explorer/miners", icon: "⛏️" },
            { nameKey: "vitals", path: "/explorer/vitals", icon: "🩺" },
            { nameKey: "utxoSet", path: "/analysis/utxo", icon: "🔬" },
        ]
    },
    {
        categoryKey: "learn",
        items: [
            { nameKey: "script", path: "/lab/script", icon: "⚗️" },
            { nameKey: "taproot", path: "/lab/taproot", icon: "🌱" },
            { nameKey: "keys", path: "/lab/keys", icon: "🗝️" },
            { nameKey: "hashing", path: "/lab/hashing", icon: "🔨" },
            { nameKey: "consensus", path: "/lab/consensus", icon: "⚙️" },
            { nameKey: "mempoolSim", path: "/game/mempool", icon: "🧪" },
        ]
    },
    {
        categoryKey: "analysis",
        items: [
            { nameKey: "forensics", path: "/analysis/forensics", icon: "🕵️‍♂️" },
            { nameKey: "evolution", path: "/analysis/evolution", icon: "📈" },
            { nameKey: "dIndex", path: "/analysis/d-index", icon: "⚖️" },
            { nameKey: "graffiti", path: "/analysis/graffiti", icon: "🎨" },
        ]
    },
    {
        categoryKey: "simulations",
        items: [
            { nameKey: "mempoolTetris", path: "/game/tetris", icon: "🧱" },
            { nameKey: "miningSimulator", path: "/game/mining", icon: "⛏️" },
            { nameKey: "lightningSimulator", path: "/lab/lightning", icon: "⚡" },
        ]
    },
    {
        categoryKey: "knowledge",
        items: [
            { nameKey: "nodeTerminal", path: "/explorer/rpc", icon: "💻" },
            { nameKey: "operations", path: "/ops", icon: "🛡️" },
            { nameKey: "about", path: "/about", icon: "ℹ️" },
            { nameKey: "academy", path: "/academy", icon: "🎓" },
            { nameKey: "research", path: "/research", icon: "📚" },
            { nameKey: "vulnerabilities", path: "/research/vulnerabilities", icon: "🛡️" },
            { nameKey: "attackModels", path: "/research/attacks", icon: "🎯" },
            { nameKey: "assumptions", path: "/research/assumptions", icon: "📌" },
            { nameKey: "policyVsCons", path: "/research/policy-vs-consensus", icon: "⚖️" },
        ]
    },
];

const ORDERED_MENU_PATHS = NAV_ITEMS.flatMap((section) => section.items.map((item) => item.path));

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isScrollingDown, setIsScrollingDown] = useState(false);
    const { progressPercent, currentLessonIndex, completedLessons } = useGuidedLearning();
    const { t, locale, setLocale } = useTranslation();
    const GUIDED_LESSONS = t.guidedLearning;

    const lessonNumber = Math.min(currentLessonIndex + 1, GUIDED_LESSONS.length);
    const currentLessonTitle = GUIDED_LESSONS[lessonNumber - 1]?.title ?? GUIDED_LESSONS[0].title;
    const canonicalConceptCount = getCanonicalPath().orderedNodes.length;
    const showLearningJourney = pathname !== "/";

    const completedPaths = useMemo(() => {
        const paths = new Set<string>();
        completedLessons.forEach(idx => {
            const lesson = GUIDED_LESSONS[idx];
            if (lesson) {
                lesson.modules.forEach(m => paths.add(m.href));
            }
        });
        return paths;
    }, [completedLessons, GUIDED_LESSONS]);

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

    useEffect(() => {
        if (!mobileOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMobileOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mobileOpen]);

    const getCategoryName = (key: string) => {
        return (t.nav.categories as Record<string, string>)[key] ?? key;
    };

    const getItemName = (key: string) => {
        return (t.nav.items as Record<string, string>)[key] ?? key;
    };

    const toggleLocale = () => {
        setLocale(locale === "en" ? "es" : "en");
    };

    const sidebarContent = (
        <>
            <div className="p-3 border-b border-slate-800/50">
                <GlobalSearch />
            </div>
            {showLearningJourney && (
                <div className="border-b border-slate-800/50 px-3 py-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">{t.nav.learningJourney}</p>
                        <p className="text-xs text-slate-300 mt-1">
                            {t.nav.guidedLesson} {lessonNumber}/{GUIDED_LESSONS.length}: {currentLessonTitle}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            {t.nav.pathScope}: {GUIDED_LESSONS.length} {t.nav.lessons} • {canonicalConceptCount} {t.nav.concepts}
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-2">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-cyan-300">{progressPercent}% {t.nav.complete}</span>
                            <Link
                                href="/#guided-learning-mode"
                                onClick={() => setMobileOpen(false)}
                                className="inline-flex min-h-11 items-center rounded-md border border-slate-700/60 bg-slate-950/40 px-3 text-[11px] text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                            >
                                {t.nav.resume}
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
                {NAV_ITEMS.map((section, idx) => (
                    <div key={idx}>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-3">
                            {getCategoryName(section.categoryKey)}
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
                                        <span className="truncate text-[13px] font-medium leading-5 tracking-[0.01em]">{getItemName(item.nameKey)}</span>
                                        {completedPaths.has(item.path) && (
                                            <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500 flex-shrink-0" />
                                        )}
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
                {/* Language Toggle */}
                <div className="flex justify-center">
                    <button
                        onClick={toggleLocale}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                        aria-label="Toggle language"
                    >
                        <span>🌐</span>
                        <span className={`px-1.5 py-0.5 rounded ${locale === "en" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>EN</span>
                        <span className="text-slate-600">|</span>
                        <span className={`px-1.5 py-0.5 rounded ${locale === "es" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>ES</span>
                    </button>
                </div>
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
            {/* Mobile Bottom Navigation Bar */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-slate-950/95 backdrop-blur-xl border-t border-slate-900 flex items-center justify-between px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] transition-transform duration-300 ${isScrollingDown && !mobileOpen ? 'translate-y-full' : 'translate-y-0'}`}>
                <div className="flex items-center gap-2">
                    {/* Hamburger Toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                        <span className="text-[10px] font-medium tracking-wide">{t.nav.menu}</span>
                    </button>

                    {/* Language Toggle */}
                    <button
                        onClick={toggleLocale}
                        className="flex min-h-11 min-w-11 flex-col items-center justify-center px-2 py-1 text-slate-400 hover:text-cyan-400 transition-colors"
                        aria-label="Toggle Language"
                    >
                        <Globe size={24} className="mb-1" />
                        <span className="text-[10px] font-medium tracking-wide uppercase">{locale === "en" ? "EN" : "ES"}</span>
                    </button>
                </div>

                {/* Quick Routes inside bottom bar */}
                <div className="flex items-center gap-6">
                    <Link
                        href={previousPath}
                        className="flex min-h-11 min-w-11 flex-col items-center justify-center px-2 py-2 text-slate-400 hover:text-cyan-400 transition-colors"
                        aria-label="Previous menu page"
                    >
                        <ChevronLeft size={24} className="mb-1" />
                        <span className="text-[10px] font-medium tracking-wide">{t.nav.prev}</span>
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center justify-center -mt-6 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 w-12 h-12 rounded-full shadow-lg shadow-cyan-500/20"
                        aria-label="Go home"
                    >
                        <House size={20} />
                    </Link>

                    <Link
                        href={nextPath}
                        className="flex min-h-11 min-w-11 flex-col items-center justify-center px-2 py-2 text-slate-400 hover:text-cyan-400 transition-colors"
                        aria-label="Next menu page"
                    >
                        <ChevronRight size={24} className="mb-1" />
                        <span className="text-[10px] font-medium tracking-wide">{t.nav.next}</span>
                    </Link>
                </div>
            </div>

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
