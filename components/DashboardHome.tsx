"use client";

import { motion } from "framer-motion";
import Link from 'next/link';
import { useState } from "react";
import { Oxanium } from "next/font/google";
import HeroMetrics from "./HeroMetrics";
import Card from "./Card";
import { GUIDED_LESSONS } from "../data/guided-learning";
import { useGuidedLearning } from "./providers/GuidedLearningProvider";
import { CANONICAL_PATH_ID, getCanonicalPath } from "@/lib/graph/pathEngine";

const brandDisplayFont = Oxanium({
    subsets: ["latin"],
    weight: ["700", "800"],
    display: "swap",
});

// Feature categories for organized navigation
const categories = {
    explore: {
        title: "🔬 Explore",
        subtitle: "Real-time blockchain data and network analysis",
        features: [
            {
                title: "Network Monitor",
                description: "Visualize the decentralized P2P topology.",
                href: "/explorer/network",
                color: "from-emerald-400 to-teal-500",
                icon: "🌍"
            },
            {
                title: "Block Explorer",
                description: "Browse the latest blocks and transactions.",
                href: "/explorer/blocks",
                color: "from-slate-600 to-slate-500",
                icon: "📦"
            },
            {
                title: "Transaction Decoder",
                description: "Deep dive into raw hex data and witness scripts.",
                href: "/explorer/decoder",
                color: "from-purple-400 to-indigo-500",
                icon: "🔍"
            },
            {
                title: "Rich List",
                description: "Analyze the richest addresses on the blockchain.",
                href: "/explorer/rich-list",
                color: "from-amber-400 to-orange-500",
                icon: "🐳"
            },
            {
                title: "Protocol Vitals",
                description: "Network Heartbeat: Halving, Difficulty, Node Health.",
                href: "/explorer/vitals",
                color: "from-purple-400 to-indigo-500",
                icon: "🩺"
            }
        ]
    },
    learn: {
        title: "🧪 Learn",
        subtitle: "Interactive tools to understand Bitcoin internals",
        features: [
            {
                title: "Script Lab",
                description: "Visual Debugger for Bitcoin Script (Stack, Alt-Stack, Opcodes).",
                href: "/lab/script",
                color: "from-blue-400 to-indigo-500",
                icon: "⚗️"
            },
            {
                title: "The Key Forge",
                description: "Generate Entropy, Visualize Curves, and Derive Addresses.",
                href: "/lab/keys",
                color: "from-violet-400 to-fuchsia-600",
                icon: "🗝️"
            },
            {
                title: "The Hashing Foundry",
                description: "Brute-force SHA-256 for the Golden Nonce.",
                href: "/lab/hashing",
                color: "from-pink-400 to-rose-600",
                icon: "🔨"
            },
            {
                title: "Taproot Playground",
                description: "Visualize Schnorr Signatures and Key Aggregation.",
                href: "/lab/taproot",
                color: "from-emerald-400 to-teal-500",
                icon: "🌱"
            },
            {
                title: "Lightning Simulator",
                description: "Layer 2 simulator. Channels, Rebalancing, and Multi-Hop HTLCs.",
                href: "/lab/lightning",
                color: "from-yellow-400 to-amber-600",
                icon: "⚡"
            },
            {
                title: "Consensus Debugger",
                description: "Step through block validation. See PoW, merkle roots, and coinbase checks.",
                href: "/lab/consensus",
                color: "from-cyan-400 to-blue-600",
                icon: "⚙️"
            }
        ]
    },
    play: {
        title: "🎮 Play",
        subtitle: "Gamified experiences to master Bitcoin concepts",
        features: [
            {
                title: "Mempool Tetris",
                description: "Gamified block construction. Play the Fee Market.",
                href: "/game/tetris",
                color: "from-orange-400 to-amber-500",
                icon: "🧱"
            },
            {
                title: "Mining Simulator",
                description: "Interactive difficulty adjustment lab. Crash the hashrate!",
                href: "/game/mining",
                color: "from-orange-400 to-amber-600",
                icon: "⛏️"
            }
        ]
    },
    analyze: {
        title: "📊 Analyze",
        subtitle: "Deep insights into blockchain health and trends",
        features: [
            {
                title: "Decentralization Index",
                description: "Comprehensive health audit: Mining, Nodes, and Economy.",
                href: "/analysis/d-index",
                color: "from-teal-400 to-emerald-600",
                icon: "⚖️"
            },
            {
                title: "Chain Evolution",
                description: "Protocol Adoption (SegWit/Taproot) and Economic Inefficiency.",
                href: "/analysis/evolution",
                color: "from-pink-500 to-purple-700",
                icon: "📈"
            },
            {
                title: "Graffiti Wall",
                description: "Decode the hidden layer. Read raw OP_RETURN messages.",
                href: "/analysis/graffiti",
                color: "from-green-500 to-emerald-700",
                icon: "🎨"
            },
            {
                title: "UTXO Set Explorer",
                description: "Visualize all 180M+ unspent outputs by type, value, and age.",
                href: "/analysis/utxo",
                color: "from-amber-400 to-orange-500",
                icon: "🔬"
            },
            {
                title: "Fee Intelligence",
                description: "Real-time fee estimation and 24h market trend analysis.",
                href: "/explorer/fees",
                color: "from-emerald-400 to-cyan-500",
                icon: "💸"
            },
            {
                title: "Miner Forensics",
                description: "Identify mining pools via coinbase signature analysis.",
                href: "/explorer/miners",
                color: "from-rose-400 to-pink-500",
                icon: "⛏️"
            }
        ]
    },
    tools: {
        title: "🛠️ Tools",
        subtitle: "Advanced utilities for power users",
        features: [
            {
                title: "About & Trust",
                description: "Data sources, operator transparency, and responsible-use boundaries.",
                href: "/about",
                color: "from-cyan-500 to-blue-600",
                icon: "ℹ️"
            },
            {
                title: "Node Terminal",
                description: "Interact with your local Bitcoin Core node via RPC.",
                href: "/explorer/rpc",
                color: "from-slate-700 to-slate-500",
                icon: "💻"
            }
        ]
    }
};

function FeatureCard({ feature }: { feature: typeof categories.explore.features[0] }) {
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
                    <h3 className="text-lg font-bold text-slate-200 mb-1 group-hover:text-white transition-colors">{feature.title}</h3>
                    <p className="text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed text-xs sm:text-sm">
                        {feature.description}
                    </p>
                </div>
            </Card>
        </Link>
    );
}

function CategorySection({ category, categoryKey }: { category: typeof categories.explore, categoryKey: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
        >
            <div className="mb-6 border-b border-slate-800/50 pb-4">
                <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                <p className="text-sm text-slate-400 mt-1">{category.subtitle}</p>
            </div>
            <div className={`grid gap-4 ${categoryKey === 'play' || categoryKey === 'tools'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                {category.features.map((feature) => (
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
                    className={`${brandDisplayFont.className} home-brand-title mb-5 !text-[clamp(2.4rem,8vw,5.25rem)] !leading-[0.9] font-extrabold uppercase tracking-[0.06em] select-none`}
                >
                    <span className="bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(148,163,184,0.2)]">RAW </span>
                    <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(6,182,212,0.35)]">BLOCK</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
                    Your command center for analyzing the <span className="text-cyan-400 font-medium">Bitcoin P2P network</span>.
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
                        title="Explore Blocks"
                        description="Browse the latest blocks, transactions, and miners on the network."
                        actionText="Start exploring"
                        color="cyan"
                    />
                    <PrimaryActionCard
                        href="/analysis/forensics"
                        icon="🔍"
                        title="Trace Transaction"
                        description="Follow the money flow with our forensic analysis workbench."
                        actionText="Open forensics"
                        color="purple"
                    />
                    <PrimaryActionCard
                        href="/explorer/network"
                        icon="🌍"
                        title="Network Monitor"
                        description="Track peer topology and node distribution in real time."
                        actionText="Open network"
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
                            <h2 className="text-2xl font-bold text-white">Guided Learning Mode</h2>
                            <p className="text-sm text-slate-300 mt-1">
                                Follow a step-by-step journey to deeply understand Bitcoin.
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">Progress</p>
                                <p className="text-lg font-semibold text-cyan-400">{progressPercent}%</p>
                            </div>
                            <Link
                                href={`/paths/${CANONICAL_PATH_ID}`}
                                className="inline-flex rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                            >
                                Open Canonical Path ({GUIDED_LESSONS.length} lessons • {canonicalPathSteps} concepts)
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
                            Guided lesson {currentLessonIndex + 1} of {GUIDED_LESSONS.length} • Canonical scope: {canonicalPathSteps} concepts
                        </span>
                        {resumedFromSession && (
                            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-300">
                                Resumed from last session
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <aside className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-xs uppercase tracking-widest text-slate-500 px-2 py-1">
                            Journey Map
                        </p>
                        <div className="space-y-1 mt-1">
                            {GUIDED_LESSONS.map((lesson, index) => {
                                const isActive = index === currentLessonIndex;
                                const isCompleted = completedLessons.includes(index);
                                const isLocked = index > maxUnlockedLesson;
                                const statusLabel = isCompleted ? "Done" : isLocked ? "Locked" : "Current";
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
                                        aria-disabled={isLocked}
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
                            Step {currentLessonIndex + 1}
                        </p>
                        <h3 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h3>
                        <p className="text-sm text-slate-300 mb-5">{currentLesson.summary}</p>

                        <div className="mb-6">
                            <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                                Open Related Modules
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {currentLesson.modules.map((module) => (
                                    <Link
                                        key={`${currentLesson.id}-${module.href}`}
                                        href={module.href}
                                        className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-cyan-400/60 hover:text-cyan-300 transition-colors"
                                    >
                                        {module.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {hasLockedLessons && (
                            <div className="mb-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                                <p>
                                    Lesson {nextLockedLessonIndex + 1} ({nextLockedLesson.title}) is currently locked.
                                    Complete lesson {maxUnlockedLesson + 1} to unlock it. Progress is saved in your browser.
                                </p>
                                <div className="mt-3">
                                    {isAtUnlockFrontier ? (
                                        <button
                                            type="button"
                                            onClick={unlockNextLesson}
                                            className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/25 transition-colors"
                                        >
                                            Complete & Unlock Next Lesson
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => goToLesson(maxUnlockedLesson)}
                                            className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/25 transition-colors"
                                        >
                                            Jump to Current Lesson
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
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => markLessonComplete(currentLessonIndex)}
                                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                            >
                                Mark Complete
                            </button>
                            <button
                                type="button"
                                onClick={goToNext}
                                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                            >
                                {currentLessonIndex === GUIDED_LESSONS.length - 1 ? "Finish Journey" : "Next Lesson"}
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
                        <p className="text-xs uppercase tracking-widest text-cyan-300/80">Lesson Locked</p>
                        <h3 className="mt-2 text-xl font-bold text-white">
                            {lockedLessonPromptIndex !== null ? `Lesson ${lockedLessonPromptIndex + 1}: ` : ""}
                            {lockedLessonPrompt.title}
                        </h3>
                        <p className="mt-3 text-sm text-slate-300">
                            Complete lesson {maxUnlockedLesson + 1} first to unlock this lesson.
                            Progress is stored locally in this browser session.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={jumpToCurrentUnlockedLesson}
                                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:border-cyan-400/60 hover:text-cyan-200 transition-colors"
                            >
                                Go to Current Lesson
                            </button>
                            {hasLockedLessons && (
                                <button
                                    type="button"
                                    onClick={unlockNextLesson}
                                    className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25 transition-colors"
                                >
                                    Complete & Unlock Next
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={closeLockedLessonPrompt}
                                className="rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-300 hover:border-slate-500 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simulation Launchpad */}
            <section className="w-full mb-12 rounded-2xl border border-amber-500/20 bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6">
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-white">Simulations</h2>
                    <p className="text-sm text-slate-300 mt-1">
                        Learn by doing: launch interactive Bitcoin simulations and games.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link
                        href="/game/tetris"
                        className="rounded-lg border border-slate-700 bg-slate-950/70 p-4 hover:border-amber-400/60 transition-colors"
                    >
                        <p className="text-base font-semibold text-slate-100">🧱 Mempool Tetris</p>
                        <p className="text-xs text-slate-400 mt-1">Build profitable blocks and learn fee-market strategy.</p>
                    </Link>
                    <Link
                        href="/game/mining"
                        className="rounded-lg border border-slate-700 bg-slate-950/70 p-4 hover:border-amber-400/60 transition-colors"
                    >
                        <p className="text-base font-semibold text-slate-100">⛏️ Mining Simulator</p>
                        <p className="text-xs text-slate-400 mt-1">Test hashrate shocks and difficulty retarget behavior.</p>
                    </Link>
                    <Link
                        href="/lab/lightning"
                        className="rounded-lg border border-slate-700 bg-slate-950/70 p-4 hover:border-amber-400/60 transition-colors"
                    >
                        <p className="text-base font-semibold text-slate-100">⚡ Lightning Simulator</p>
                        <p className="text-xs text-slate-400 mt-1">Explore channels, routing, and payment trade-offs.</p>
                    </Link>
                </div>
            </section>

            {/* Categorized Features */}
            <div className="w-full">
                <CategorySection category={categories.explore} categoryKey="explore" />
                <CategorySection category={categories.learn} categoryKey="learn" />
                <CategorySection category={categories.play} categoryKey="play" />
                <CategorySection category={categories.analyze} categoryKey="analyze" />
                <CategorySection category={categories.tools} categoryKey="tools" />
            </div>
        </div>
    );
}
