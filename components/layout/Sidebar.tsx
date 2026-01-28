"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
            { name: "Blocks", path: "/explorer/block", icon: "📦" }, // Base path check?
            { name: "Decoder", path: "/explorer/decoder", icon: "🔍" },
            { name: "Rich List", path: "/explorer/rich-list", icon: "🐳" },
            { name: "Fees", path: "/explorer/fees", icon: "💸" },
            { name: "Miners", path: "/explorer/miners", icon: "⛏️" },
            { name: "Vitals", path: "/explorer/vitals", icon: "🩺" },
            { name: "RPC Console", path: "/explorer/rpc", icon: "💻" },
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

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`
                fixed left-0 top-0 bottom-0 z-50
                bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50
                transition-all duration-300 ease-in-out
                ${collapsed ? "w-20" : "w-64"}
                hidden md:flex flex-col
            `}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-center border-b border-slate-800/50">
                <div onClick={() => setCollapsed(!collapsed)} className="cursor-pointer flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <span className="text-white font-bold">M</span>
                    </div>
                    {!collapsed && (
                        <h1 className="font-bold text-slate-200 tracking-tight">
                            Mempool<span className="text-cyan-400">Viz</span>
                        </h1>
                    )}
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 custom-scrollbar">
                {NAV_ITEMS.map((section, idx) => (
                    <div key={idx}>
                        {!collapsed && (
                            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 px-3">
                                {section.category}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`
                                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                                            relative group overflow-hidden
                                            ${isActive
                                                ? "text-cyan-400 bg-cyan-950/30 border border-cyan-900/50"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                                            }
                                        `}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-cyan-500/5"
                                            />
                                        )}
                                        <span className="text-lg">{item.icon}</span>
                                        {!collapsed && (
                                            <span className="font-medium">{item.name}</span>
                                        )}

                                        {/* Hover Tooltip for Collapsed Mode */}
                                        {collapsed && (
                                            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none border border-slate-700">
                                                {item.name}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Status */}
            <div className="p-4 border-t border-slate-800/50">
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    {!collapsed && (
                        <div className="text-xs text-slate-500 flex flex-col">
                            <span className="font-bold text-slate-300">Local Node</span>
                            <span className="text-[10px]">Height: Synced</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}
