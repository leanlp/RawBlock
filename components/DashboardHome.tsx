"use client";

import { motion } from "framer-motion";
import Link from 'next/link';

export default function DashboardHome() {
    const features = [
        {
            title: "Script Lab",
            description: "Visual Debugger for Bitcoin Script (Stack, Alt-Stack, Opcodes).",
            href: "/lab/script",
            color: "from-blue-400 to-indigo-500",
            icon: (
                <span className="text-2xl">⚗️</span>
            )
        },
        {
            title: "Node Terminal",
            description: "Interact with your local Bitcoin Core node via RPC.",
            href: "/explorer/rpc",
            color: "from-slate-700 to-slate-500",
            icon: (
                <span className="text-2xl">💻</span>
            )
        },
        {
            title: "Taproot Playground",
            description: "Visualize Schnorr Signatures and Key Aggregation.",
            href: "/lab/taproot",
            color: "from-emerald-400 to-teal-500",
            icon: (
                <span className="text-2xl">🌱</span>
            )
        },
        {
            title: "Live Mempool",
            description: "Real-time transaction feed. Watch blocks fill up live.",
            href: "/explorer/mempool",
            color: "from-blue-500 to-cyan-600",
            icon: <span className="text-2xl">🌊</span>
        },
        {
            title: "Mempool Tetris",
            description: "Gamified block construction. Play the Fee Market.",
            href: "/game/tetris",
            color: "from-orange-400 to-amber-500",
            icon: (
                <span className="text-2xl">🧱</span>
            )
        },
        {
            title: "Transaction Decoder",
            description: "Deep dive into raw hex data and witness scripts.",
            href: "/explorer/decoder",
            color: "from-purple-400 to-indigo-500",
            icon: <span className="text-2xl">🔍</span>
        },
        {
            title: "Network Monitor",
            description: "Visualize the decentralized P2P topology.",
            href: "/explorer/network",
            color: "from-emerald-400 to-teal-500",
            icon: <span className="text-2xl">🌍</span>
        },
        {
            title: "Rich List",
            description: "Analyze the richest addresses on the blockchain.",
            href: "/explorer/rich-list",
            color: "from-amber-400 to-orange-500",
            icon: <span className="text-2xl">🐳</span>
        },
        {
            title: "Miner Forensics",
            description: "Identify mining pools via coinbase signature analysis.",
            href: "/explorer/miners",
            color: "from-rose-400 to-pink-500",
            icon: <span className="text-2xl">⛏️</span>
        },
        {
            title: "Fee Intelligence",
            description: "Real-time fee estimation and 24h market trend analysis.",
            href: "/explorer/fees",
            color: "from-emerald-400 to-cyan-500",
            icon: <span className="text-2xl">💸</span>
        },
        {
            title: "Protocol Vitals",
            description: "Monitor Network Heartbeat: Halving Countdown, Difficulty, and Node Health.",
            href: "/explorer/vitals",
            color: "from-purple-400 to-indigo-500",
            icon: <span className="text-2xl">🩺</span>
        },
        {
            title: "Graffiti Wall",
            description: "Decode the hidden layer. Read raw OP_RETURN messages.",
            href: "/analysis/graffiti",
            color: "from-green-500 to-emerald-700",
            icon: <span className="text-2xl">🎨</span>
        },
        {
            title: "Chain Evolution",
            description: "Analyze Protocol Adoption (SegWit/Taproot) and Economic Inefficiency.",
            href: "/analysis/evolution",
            color: "from-pink-500 to-purple-700",
            icon: <span className="text-2xl">📈</span>
        },
        {
            title: "Decentralization Index",
            description: "Comprehensive health audit: Mining, Nodes, and Economy.",
            href: "/analysis/d-index",
            color: "from-teal-400 to-emerald-600",
            icon: <span className="text-2xl">⚖️</span>
        },
        {
            title: "Mining Simulator",
            description: "Interactive difficulty adjustment lab. Crash the hashrate!",
            href: "/game/mining",
            color: "from-orange-400 to-amber-600",
            icon: <span className="text-2xl">⚡</span>
        },
        {
            title: "The Hashing Foundry",
            description: "Pro-level mining lab. Brute-force SHA-256 for the Golden Nonce.",
            href: "/lab/hashing",
            color: "from-pink-400 to-rose-600",
            icon: <span className="text-2xl">🔨</span>
        },
        {
            title: "Lightning Visualizer",
            description: "Layer 2 simulator. Channels, Rebalancing, and Multi-Hop HTLCs.",
            href: "/lab/lightning",
            color: "from-yellow-400 to-amber-600",
            icon: <span className="text-2xl">⚡</span>
        },
        {
            title: "The Key Forge",
            description: "Crypto Lab. Generate Entropy, Visualize Curves, and Derive Addresses.",
            href: "/lab/keys",
            color: "from-violet-400 to-fuchsia-600",
            icon: <span className="text-2xl">🗝️</span>
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center py-12 relative z-10 max-w-6xl w-full mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
            >
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 mb-6 drop-shadow-2xl">
                    RAW BLOCK
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                    Your command center for analyzing the <span className="text-cyan-400 font-medium">Bitcoin P2P network</span>.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4">
                {features.map((feature, i) => (
                    <Link
                        key={i}
                        href={feature.href}
                        passHref
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className="cursor-pointer h-full bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 rounded-2xl p-8 backdrop-blur-sm transition-all duration-300 relative overflow-hidden group hover:shadow-2xl hover:shadow-cyan-900/20"
                        >
                            {/* Hover Gradient Glow */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${feature.color} transition-opacity duration-500`} />

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-10 text-white shadow-lg`}>
                                    {feature.icon}
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                    App
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">{feature.title}</h3>
                                <p className="text-slate-500 group-hover:text-slate-400 transition-colors leading-relaxed font-light text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
