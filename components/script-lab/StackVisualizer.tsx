
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Stack } from "./OpcodeEngine";

interface StackVisualizerProps {
    stack: Stack;
    altStack: Stack;
    title?: string;
}

export default function StackVisualizer({ stack, altStack }: StackVisualizerProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Main Stack */}
            <StackColumn items={stack} title="Main Stack" color="blue" />

            {/* Alt Stack */}
            <StackColumn items={altStack} title="Alt Stack" color="purple" />
        </div>
    );
}

function StackColumn({ items, title, color }: { items: Stack; title: string; color: "blue" | "purple" }) {
    const isBlue = color === "blue";

    // Reverse for display so "Top" of stack is visually at the top
    const displayItems = [...items].reverse();

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isBlue ? 'text-blue-400' : 'text-purple-400'}`}>
                {title} <span className="text-slate-600">({items.length})</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {displayItems.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-slate-600 text-xs italic text-center mt-10"
                        >
                            Empty
                        </motion.div>
                    )}

                    {displayItems.map((item, index) => (
                        <motion.div
                            key={`${items.length - 1 - index}-${item}`} // Stable key based on original index
                            layout
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`
                                relative p-3 rounded font-mono text-sm break-all shadow-lg
                                ${isBlue ? 'bg-blue-500/10 border-blue-500/30 text-blue-200' : 'bg-purple-500/10 border-purple-500/30 text-purple-200'}
                                border
                            `}
                        >
                            <span className="absolute -left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 opacity-50 w-4 text-right">
                                {items.length - 1 - index}
                            </span>
                            {item}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-center text-slate-500">
                TOP
            </div>
        </div>
    );
}
