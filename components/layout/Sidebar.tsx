"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Twitter, Linkedin } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
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
        category: "Lab",
        items: [
            { name: "Script", path: "/lab/script", icon: "⚗️" },
            { name: "Taproot", path: "/lab/taproot", icon: "🌱" },
            { name: "Keys", path: "/lab/keys", icon: "🗝️" },
            { name: "Lightning", path: "/lab/lightning", icon: "⚡" },
            { name: "Hashing", path: "/lab/hashing", icon: "🔨" },
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
        category: "Arcade",
        items: [
            { name: "Tetris", path: "/game/tetris", icon: "🧱" },
            { name: "Mining Sim", path: "/game/mining", icon: "⚡" },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center justify-center border-b border-slate-800/50">
                <div onClick={() => setCollapsed(!collapsed)} className="cursor-pointer flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <span className="text-white font-bold">R</span>
                    </div>
                    {!collapsed && (
                        <h1 className="font-bold text-slate-200 tracking-tight">
                            Raw<span className="text-cyan-400">Block</span>
                        </h1>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
                {NAV_ITEMS.map((section, idx) => (
                    <div key={idx}>
                        {!collapsed && (
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-3">
                                {section.category}
                            </h3>
                        )}
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
                                        <span className="text-lg flex-shrink-0">{item.icon}</span>
                                        {!collapsed && (
                                            <span className="text-sm font-medium truncate">{item.name}</span>
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
            {!collapsed && (
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
                    <p className="text-[10px] text-slate-600 text-center">
                        © 2026 Raw Block
                    </p>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden fixed top-4 left-4 z-[60] w-11 h-11 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-colors"
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
                        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
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
                        className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-950/98 backdrop-blur-xl border-r border-slate-900 flex flex-col"
                    >
                        <SidebarContent />
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
                    ${collapsed ? "w-20" : "w-64"}
                    hidden md:flex flex-col
                `}
            >
                <SidebarContent />
            </motion.aside>
        </>
    );
}
