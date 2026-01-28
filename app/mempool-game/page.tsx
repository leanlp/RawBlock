
"use client";

import Header from "../../components/Header";
import MempoolGame from "../../components/mempool-game/MempoolGame";

export default function MempoolGamePage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-7xl mx-auto space-y-6">
                <Header />

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                        <h3 className="text-white font-bold text-sm mb-2">How to Play</h3>
                        <ul className="text-xs text-slate-400 list-disc pl-4 space-y-1">
                            <li>Transactions arrive in the <strong>Mempool Queue</strong> (Left).</li>
                            <li>Click a transaction to add it to your <strong>Candidate Block</strong> (Right).</li>
                            <li>High Fee Rate txs (Orange/Yellow) pay more per byte!</li>
                            <li>Don't exceed the Block Weight Limit.</li>
                            <li>Miner collects all fees when the timer hits zero.</li>
                        </ul>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                        <h3 className="text-white font-bold text-sm mb-2">Why it matters</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Miners are profit-driven. They prioritize transactions that pay the highest <strong>Fee Rate (sat/vByte)</strong>, not necessarily the total amount. This economic game theory secures the network and creates a fee market for block space.
                        </p>
                    </div>
                </div>

            </div>
        </main>
    );
}
