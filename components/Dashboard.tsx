
"use client";

import { useState } from "react";
import Header from "./Header";
import DashboardHome from "./DashboardHome";
import ScriptLab from "./script-lab/ScriptLab";
import KeyAggregator from "./taproot/KeyAggregator"; // Taproot Page Content
import MempoolGame from "./mempool-game/MempoolGame";
import RPCExplorer from "./rpc-explorer/RPCExplorer";
import GraffitiWall from "./graffiti/GraffitiWall";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("home");

    const renderContent = () => {
        switch (activeTab) {
            case "home":
                return <DashboardHome onNavigate={setActiveTab} />;
            case "script":
                return <ScriptLab />;
            case "graffiti":
                return <GraffitiWall />;
            case "taproot":
                return (
                    <div className="space-y-8">
                        <div className="pb-6 border-b border-slate-800">
                            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                                Taproot Playground 🌱
                            </h1>
                            <p className="mt-2 text-slate-400 text-sm">
                                Visualize <strong>Schnorr Signatures</strong> and <strong>Key Aggregation (MuSig)</strong>.
                            </p>
                        </div>
                        <KeyAggregator />
                    </div>
                );
            case "game":
                return (
                    <div className="space-y-6">
                        <div className="pb-6 border-b border-slate-800 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
                                    Mempool Tetris 🧱
                                </h1>
                                <p className="mt-2 text-slate-400 text-sm">
                                    You are the Miner. Assemble the most profitable block before time runs out!
                                </p>
                            </div>
                        </div>
                        <MempoolGame />
                    </div>
                );
            case "rpc":
                return <RPCExplorer />;
            default:
                return <DashboardHome onNavigate={setActiveTab} />;
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono overflow-x-hidden relative">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-80 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col min-h-screen">
                <Header />

                {/* Internal Tab Bar (Only show if not on home) */}
                {activeTab !== "home" && (
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                        <button
                            onClick={() => setActiveTab("home")}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
                        >
                            ← Dashboard
                        </button>
                        <div className="w-px h-6 bg-slate-800 mx-2"></div>
                        {["script", "taproot", "game", "rpc", "graffiti"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all
                                    ${activeTab === tab ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-500 hover:text-slate-300'}
                                `}
                            >
                                {tab === 'game' ? 'Mempool Game' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}
