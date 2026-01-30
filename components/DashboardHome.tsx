"use client";

import { motion } from "framer-motion";
import Link from 'next/link';
import HeroMetrics from "./HeroMetrics";

// Feature categories for organized navigation
const categories = {
    explore: {
        title: "🔬 Explore",
        subtitle: "Real-time blockchain data and network analysis",
        features: [
            {
                title: "Live Mempool",
                description: "Real-time transaction feed. Watch blocks fill up live.",
                href: "/explorer/mempool",
                color: "from-blue-500 to-cyan-600",
                icon: "🌊"
            },
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
                title: "Lightning Visualizer",
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
                icon: "🔬"
            }
        ]
    },
    tools: {
        title: "🛠️ Tools",
        subtitle: "Advanced utilities for power users",
        features: [
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

function FeatureCard({ feature, index }: { feature: typeof categories.explore.features[0], index: number }) {
    return (
        <Link href={feature.href} passHref>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -3 }}
                className="cursor-pointer h-full bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 rounded-xl p-5 backdrop-blur-sm transition-all duration-300 relative overflow-hidden group hover:shadow-xl hover:shadow-cyan-900/10"
            >
                {/* Hover Gradient Glow */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${feature.color} transition-opacity duration-500`} />

                <div className="flex items-start justify-between mb-3 relative z-10">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10 text-white shadow-lg text-xl`}>
                        {feature.icon}
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-slate-200 mb-1 group-hover:text-white transition-colors">{feature.title}</h3>
                    <p className="text-slate-500 group-hover:text-slate-400 transition-colors leading-relaxed text-xs">
                        {feature.description}
                    </p>
                </div>
            </motion.div>
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
                <p className="text-sm text-slate-500 mt-1">{category.subtitle}</p>
            </div>
            <div className={`grid gap-4 ${categoryKey === 'play' || categoryKey === 'tools'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
                }`}>
                {category.features.map((feature, i) => (
                    <FeatureCard key={feature.href} feature={feature} index={i} />
                ))}
            </div>
        </motion.div>
    );
}

export default function DashboardHome() {
    return (
        <div className="flex flex-col items-center justify-center py-8 relative z-10 max-w-6xl w-full mx-auto px-4">
            {/* Hero Title */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-8"
            >
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 mb-4 drop-shadow-2xl">
                    RAW BLOCK
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                    Your command center for analyzing the <span className="text-cyan-400 font-medium">Bitcoin P2P network</span>.
                </p>
            </motion.div>

            {/* Live Metrics Hero */}
            <HeroMetrics />

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
