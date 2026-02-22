"use client";

import { motion } from "framer-motion";
import Link from 'next/link';
import { useState } from "react";
import HeroMetrics from "./HeroMetrics";
import Card from "./Card";
import { useGuidedLearning } from "./providers/GuidedLearningProvider";
import { CANONICAL_PATH_ID, getCanonicalPath } from "@/lib/graph/pathEngine";
import { useTranslation } from "@/lib/i18n";

type FeatureItem = {
    titleKey: string;
    href: string;
    color: string;
    icon: string;
};

type CategoryDef = {
    titleKey: string;
    subtitleKey: string;
    features: FeatureItem[];
};

// Feature categories for organized navigation — use translation keys
const categoriesDef: Record<string, CategoryDef> = {
    explore: {
        titleKey: "explore",
        subtitleKey: "explore",
        features: [
            { titleKey: "networkMonitor", href: "/explorer/network", color: "from-emerald-400 to-teal-500", icon: "🌍" },
            { titleKey: "blockExplorer", href: "/explorer/blocks", color: "from-slate-600 to-slate-500", icon: "📦" },
            { titleKey: "txDecoder", href: "/explorer/decoder", color: "from-purple-400 to-indigo-500", icon: "🔍" },
            { titleKey: "richList", href: "/explorer/rich-list", color: "from-amber-400 to-orange-500", icon: "🐳" },
            { titleKey: "protocolVitals", href: "/explorer/vitals", color: "from-purple-400 to-indigo-500", icon: "🩺" },
        ]
    },
    learn: {
        titleKey: "learn",
        subtitleKey: "learn",
        features: [
            { titleKey: "scriptLab", href: "/lab/script", color: "from-blue-400 to-indigo-500", icon: "⚗️" },
            { titleKey: "keyForge", href: "/lab/keys", color: "from-violet-400 to-fuchsia-600", icon: "🗝️" },
            { titleKey: "hashingFoundry", href: "/lab/hashing", color: "from-pink-400 to-rose-600", icon: "🔨" },
            { titleKey: "taprootPlayground", href: "/lab/taproot", color: "from-emerald-400 to-teal-500", icon: "🌱" },
            { titleKey: "lightningSim", href: "/lab/lightning", color: "from-yellow-400 to-amber-600", icon: "⚡" },
            { titleKey: "consensusDebugger", href: "/lab/consensus", color: "from-cyan-400 to-blue-600", icon: "⚙️" },
        ]
    },
    play: {
        titleKey: "play",
        subtitleKey: "play",
        features: [
            { titleKey: "mempoolTetris", href: "/game/tetris", color: "from-orange-400 to-amber-500", icon: "🧱" },
            { titleKey: "miningSim", href: "/game/mining", color: "from-orange-400 to-amber-600", icon: "⛏️" },
        ]
    },
    analyze: {
        titleKey: "analyze",
        subtitleKey: "analyze",
        features: [
            { titleKey: "dIndex", href: "/analysis/d-index", color: "from-teal-400 to-emerald-600", icon: "⚖️" },
            { titleKey: "chainEvolution", href: "/analysis/evolution", color: "from-pink-500 to-purple-700", icon: "📈" },
            { titleKey: "graffitiWall", href: "/analysis/graffiti", color: "from-green-500 to-emerald-700", icon: "🎨" },
            { titleKey: "utxoExplorer", href: "/analysis/utxo", color: "from-amber-400 to-orange-500", icon: "🔬" },
            { titleKey: "feeIntelligence", href: "/explorer/fees", color: "from-emerald-400 to-cyan-500", icon: "💸" },
            { titleKey: "minerForensics", href: "/explorer/miners", color: "from-rose-400 to-pink-500", icon: "⛏️" },
        ]
    },
    tools: {
        titleKey: "tools",
        subtitleKey: "tools",
        features: [
            { titleKey: "aboutTrust", href: "/about", color: "from-cyan-500 to-blue-600", icon: "ℹ️" },
            { titleKey: "nodeTerminal", href: "/explorer/rpc", color: "from-slate-700 to-slate-500", icon: "💻" },
        ]
    }
};

function FeatureCard({ feature }: { feature: FeatureItem }) {
    const { t } = useTranslation();
    const featureData = (t.dashboard.features as Record<string, { title: string; description: string }>)[feature.titleKey];
    const title = featureData?.title ?? feature.titleKey;
    const description = featureData?.description ?? "";

    return (
        <Link href={feature.href} passHref>
            <Card
                className="h-full p-4 lg:p-5 group"
                onClick={() => { }}
                hoverable
            >
                {/* Hover Gradient Glow */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${feature.color} transition-opacity duration-500 rounded-xl`} />

                <div className="flex items-start justify-between mb-3 relative z-10">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10 text-white shadow-lg text-xl`}>
                        {feature.icon}
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-slate-200 mb-1 group-hover:text-white transition-colors">{title}</h3>
                    <p className="text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed text-xs sm:text-sm">
                        {description}
                    </p>
                </div>
            </Card>
        </Link>
    );
}

function CategorySection({ categoryDef, categoryKey }: { categoryDef: CategoryDef, categoryKey: string }) {
    const { t } = useTranslation();
    const catT = (t.dashboard as unknown as Record<string, { title: string; subtitle: string }>)[categoryDef.titleKey];
    const title = catT?.title ?? categoryDef.titleKey;
    const subtitle = catT?.subtitle ?? "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
        >
            <div className="mb-6 border-b border-slate-800/50 pb-4">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
            </div>
            <div className={`grid gap-4 ${categoryKey === 'play' || categoryKey === 'tools'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                {categoryDef.features.map((feature) => (
                    <FeatureCard key={feature.href} feature={feature} />
                ))}
            </div>
        </motion.div>
    );
}

// Primary action card for hero section
function PrimaryActionCard({
    href,
    icon,
    title,
    description,
    actionText,
    color
}: {
    href: string;
    icon: string;
    title: string;
    description: string;
    actionText: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        cyan: 'group-hover:text-cyan-400 text-cyan-500',
        purple: 'group-hover:text-purple-400 text-purple-500',
        blue: 'group-hover:text-blue-400 text-blue-500',
    };

    return (
        <Link href={href}>
            <Card
                className="p-5 lg:p-6 group h-full"
                onClick={() => { }}
                hoverable
            >
                <div className="relative z-10">
                    <div className="text-4xl mb-4">{icon}</div>
                    <h3 className={`text-xl font-bold text-white mb-2 ${colorMap[color]?.split(' ')[0]} transition-colors`}>
                        {title}
                    </h3>
                    <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                        {description}
                    </p>
                    <div className={`mt-4 flex items-center ${colorMap[color]?.split(' ')[1]} text-sm font-medium`}>
                        <span>{actionText}</span>
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

export default function DashboardHome() {
    const {
        currentLessonIndex,
        completedLessons,
        resumedFromSession,
        progressPercent,
        currentLesson,
        maxUnlockedLesson,
        goToLesson,
        markLessonComplete,
        completeAndAdvanceFrom,
        goToNext,
        goToPrevious,
    } = useGuidedLearning();
    const { t } = useTranslation();
    const GUIDED_LESSONS = t.guidedLearning;
    const [lockedLessonPromptIndex, setLockedLessonPromptIndex] = useState<number | null>(null);
    const canonicalPathSteps = getCanonicalPath().orderedNodes.length;
    const hasLockedLessons = maxUnlockedLesson < GUIDED_LESSONS.length - 1;
    const nextLockedLessonIndex = Math.min(maxUnlockedLesson + 1, GUIDED_LESSONS.length - 1);
    const nextLockedLesson = GUIDED_LESSONS[nextLockedLessonIndex];
    const isAtUnlockFrontier = currentLessonIndex === maxUnlockedLesson;
    const lockedLessonPrompt =
        lockedLessonPromptIndex === null ? null : GUIDED_LESSONS[lockedLessonPromptIndex];

    const closeLockedLessonPrompt = () => {
        setLockedLessonPromptIndex(null);
    };

    const requestLockedLessonUnlock = (lessonIndex: number) => {
        setLockedLessonPromptIndex(lessonIndex);
    };

    const unlockNextLesson = () => {
        completeAndAdvanceFrom(maxUnlockedLesson);
        closeLockedLessonPrompt();
    };

    const jumpToCurrentUnlockedLesson = () => {
        goToLesson(maxUnlockedLesson);
        closeLockedLessonPrompt();
    };

    const gl = t.dashboard.guidedLearning;

    return (
        <div className="flex flex-col items-center justify-start py-8 relative z-10 max-w-7xl w-full mx-auto px-3 sm:px-4">
            {/* Hero Title */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-8"
            >
                <h1
                    className="home-brand-title mb-5 !text-[clamp(2.4rem,8vw,5.25rem)] !leading-[0.9] font-extrabold uppercase tracking-[0.06em] select-none"
                >
                    <span className="bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(148,163,184,0.2)]">RAW </span>
                    <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(6,182,212,0.35)]">BLOCK</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
                    {t.dashboard.subtitle} <span className="text-cyan-400 font-medium">{t.dashboard.subtitleHighlight}</span>.
                </p>
            </motion.div>

            {/* Live Metrics Hero */}
            <HeroMetrics />

            {/* ===== PRIMARY ACTIONS ROW ===== */}
            <div className="w-full mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <PrimaryActionCard
                        href="/explorer/blocks"
                        icon="📦"
                        title={t.dashboard.primaryActions.exploreBlocks.title}
                        description={t.dashboard.primaryActions.exploreBlocks.description}
                        actionText={t.dashboard.primaryActions.exploreBlocks.action}
                        color="cyan"
                    />
                    <PrimaryActionCard
                        href="/analysis/forensics"
                        icon="🔍"
                        title={t.dashboard.primaryActions.traceTransaction.title}
                        description={t.dashboard.primaryActions.traceTransaction.description}
                        actionText={t.dashboard.primaryActions.traceTransaction.action}
                        color="purple"
                    />
                    <PrimaryActionCard
                        href="/explorer/network"
                        icon="🌍"
                        title={t.dashboard.primaryActions.networkMonitor.title}
                        description={t.dashboard.primaryActions.networkMonitor.description}
                        actionText={t.dashboard.primaryActions.networkMonitor.action}
                        color="blue"
                    />
                </div>
            </div>

            {/* Guided Learning Mode */}
            <section
                id="guided-learning-mode"
                className="w-full mb-12 rounded-2xl border border-cyan-500/20 bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
            >
                <div className="flex flex-col gap-4 mb-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{gl.title}</h2>
                            <p className="text-sm text-slate-300 mt-1">
                                {gl.subtitle}
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">{gl.progress}</p>
                                <p className="text-lg font-semibold text-cyan-400">{progressPercent}%</p>
                            </div>
                            <Link
                                href={`/paths/${CANONICAL_PATH_ID}`}
                                className="inline-flex min-h-11 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                            >
                                {gl.openCanonicalPath} ({GUIDED_LESSONS.length} {t.nav.lessons} • {canonicalPathSteps} {t.nav.concepts})
                            </Link>
                        </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span>
                            {gl.guidedLesson} {currentLessonIndex + 1} {gl.of} {GUIDED_LESSONS.length} • {gl.canonicalScope}: {canonicalPathSteps} {t.nav.concepts}
                        </span>
                        {resumedFromSession && (
                            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-300">
                                {gl.resumedFromSession}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <aside className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-xs uppercase tracking-widest text-slate-500 px-2 py-1">
                            {gl.journeyMap}
                        </p>
                        <div className="space-y-1 mt-1">
                            {GUIDED_LESSONS.map((lesson, index) => {
                                const isActive = index === currentLessonIndex;
                                const isCompleted = completedLessons.includes(index);
                                const isLocked = index > maxUnlockedLesson;
                                const statusLabel = isCompleted ? gl.done : isLocked ? gl.locked : gl.current;
                                const statusClassName = isCompleted
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                    : isLocked
                                        ? "border-slate-700/60 bg-slate-900/70 text-slate-500"
                                        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";

                                return (
                                    <button
                                        key={lesson.id}
                                        type="button"
                                        onClick={() => (isLocked ? requestLockedLessonUnlock(index) : goToLesson(index))}
                                        aria-haspopup={isLocked ? "dialog" : undefined}
                                        aria-label={`${index + 1}. ${lesson.title} — ${statusLabel}`}
                                        className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${isActive
                                            ? "bg-cyan-500/15 border border-cyan-400/40"
                                            : "border border-transparent"
                                            } ${isLocked
                                                ? "opacity-70 hover:bg-slate-800/40"
                                                : "hover:bg-slate-800/70 cursor-pointer"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm text-slate-100">
                                                {index + 1}. {lesson.title}
                                            </span>
                                            {" "}
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusClassName}`}
                                            >
                                                {statusLabel}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:p-5">
                        <p className="text-xs uppercase tracking-widest text-cyan-300/80 mb-2">
                            {gl.step} {currentLessonIndex + 1}
                        </p>
                        <h3 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h3>
                        <p className="text-sm text-slate-300 mb-5">{currentLesson.summary}</p>

                        <div className="mb-6">
                            <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                                {gl.openRelatedModules}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {currentLesson.modules.map((module) => (
                                    <Link
                                        key={`${currentLesson.id}-${module.href}`}
                                        href={module.href}
                                        className="inline-flex min-h-11 items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/60 hover:text-cyan-300 transition-colors"
                                    >
                                        {module.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {hasLockedLessons && (
                            <div className="mb-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                                <p>
                                    {gl.guidedLesson} {nextLockedLessonIndex + 1} ({nextLockedLesson.title}) {gl.isCurrentlyLocked}{" "}
                                    {gl.completeToUnlock.replace("{0}", String(maxUnlockedLesson + 1))}
                                </p>
                                <div className="mt-3">
                                    {isAtUnlockFrontier ? (
                                        <button
                                            type="button"
                                            onClick={unlockNextLesson}
                                            className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/25 transition-colors"
                                        >
                                            {gl.completeUnlockNext}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => goToLesson(maxUnlockedLesson)}
                                            className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/25 transition-colors"
                                        >
                                            {gl.jumpToCurrentLesson}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={goToPrevious}
                                disabled={currentLessonIndex === 0}
                                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-500 transition-colors"
                            >
                                {gl.previous}
                            </button>
                            <button
                                type="button"
                                onClick={() => markLessonComplete(currentLessonIndex)}
                                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                            >
                                {gl.markComplete}
                            </button>
                            <button
                                type="button"
                                onClick={goToNext}
                                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                            >
                                {currentLessonIndex === GUIDED_LESSONS.length - 1 ? gl.finishJourney : gl.nextLesson}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {lockedLessonPrompt && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
                    <button
                        type="button"
                        aria-label="Close lesson lock dialog"
                        onClick={closeLockedLessonPrompt}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Locked lesson guidance"
                        className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900 p-5 shadow-2xl shadow-cyan-900/20"
                    >
                        <p className="text-xs uppercase tracking-widest text-cyan-300/80">{gl.lessonLocked}</p>
                        <h3 className="mt-2 text-xl font-bold text-white">
                            {lockedLessonPromptIndex !== null ? `${gl.guidedLesson} ${lockedLessonPromptIndex + 1}: ` : ""}
                            {lockedLessonPrompt.title}
                        </h3>
                        <p className="mt-3 text-sm text-slate-300">
                            {gl.lockedMessage.replace("{0}", String(maxUnlockedLesson + 1))}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={jumpToCurrentUnlockedLesson}
                                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:border-cyan-400/60 hover:text-cyan-200 transition-colors"
                            >
                                {gl.goToCurrentLesson}
                            </button>
                            {hasLockedLessons && (
                                <button
                                    type="button"
                                    onClick={unlockNextLesson}
                                    className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25 transition-colors"
                                >
                                    {gl.completeUnlockNextShort}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={closeLockedLessonPrompt}
                                className="rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-300 hover:border-slate-500 transition-colors"
                            >
                                {gl.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simulation Launchpad */}
            <section className="w-full mb-12 rounded-2xl border border-amber-500/20 bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6">
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-white">{t.dashboard.simulations.title}</h2>
                    <p className="text-sm text-slate-300 mt-1">
                        {t.dashboard.simulations.subtitle}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link
                        href="/game/tetris"
                        className="rounded-lg border border-slate-700 bg-slate-950/70 p-4 hover:border-amber-400/60 transition-colors"
                    >
                        <p className="text-base font-semibold text-slate-100">{t.dashboard.simulations.mempoolTetris.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{t.dashboard.simulations.mempoolTetris.description}</p>
                    </Link>
                    <Link
                        href="/game/mining"
                        className="rounded-lg border border-slate-700 bg-slate-950/70 p-4 hover:border-amber-400/60 transition-colors"
                    >
                        <p className="text-base font-semibold text-slate-100">{t.dashboard.simulations.miningSimulator.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{t.dashboard.simulations.miningSimulator.description}</p>
                    </Link>
                    <Link
                        href="/lab/lightning"
                        className="rounded-lg border border-slate-700 bg-slate-950/70 p-4 hover:border-amber-400/60 transition-colors"
                    >
                        <p className="text-base font-semibold text-slate-100">{t.dashboard.simulations.lightningSimulator.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{t.dashboard.simulations.lightningSimulator.description}</p>
                    </Link>
                </div>
            </section>

            {/* Categorized Features */}
            <div className="w-full">
                <CategorySection categoryDef={categoriesDef.explore} categoryKey="explore" />
                <CategorySection categoryDef={categoriesDef.learn} categoryKey="learn" />
                <CategorySection categoryDef={categoriesDef.play} categoryKey="play" />
                <CategorySection categoryDef={categoriesDef.analyze} categoryKey="analyze" />
                <CategorySection categoryDef={categoriesDef.tools} categoryKey="tools" />
            </div>
        </div>
    );
}
