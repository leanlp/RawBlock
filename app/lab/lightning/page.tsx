"use client";

import { useState } from "react";
import Header from "../../../components/Header";
import { motion, AnimatePresence } from "framer-motion";

export default function LightningPage() {
    // Channel State
    const capacity = 1000000; // 1M sats
    const [aliceBal, setAliceBal] = useState(500000); // 500k sats
    const [bobBal, setBobBal] = useState(500000);     // 500k sats
    const [history, setHistory] = useState<Array<{ id: string, msg: string }>>([]);

    // Routing State
    const [packetPos, setPacketPos] = useState<'A' | 'B' | 'C' | null>(null);
    const [packetStatus, setPacketStatus] = useState<'idle' | 'htlc' | 'settle'>('idle');

    // Action: Pay Button
    const payBob = (amount: number) => {
        if (aliceBal >= amount) {
            setAliceBal(p => p - amount);
            setBobBal(p => p + amount);
            setHistory(prev => [{ id: `${Date.now()}-${Math.random()}`, msg: `Alice sent ${amount} sats to Bob via Channel Update #${prev.length + 1}` }, ...prev]);
        }
    };

    const payAlice = (amount: number) => {
        if (bobBal >= amount) {
            setBobBal(p => p - amount);
            setAliceBal(p => p + amount);
            setHistory(prev => [{ id: `${Date.now()}-${Math.random()}`, msg: `Bob sent ${amount} sats to Alice via Channel Update #${prev.length + 1}` }, ...prev]);
        }
    };

    // Action: Route to Charlie
    const routePayment = async () => {
        if (packetStatus !== 'idle') return;

        // Step 1: HTLC from Alice to Bob
        setPacketStatus('htlc');
        setPacketPos('A');
        await new Promise(r => setTimeout(r, 800));
        setPacketPos('B');
        await new Promise(r => setTimeout(r, 800));
        setPacketPos('C'); // Reached Charlie
        await new Promise(r => setTimeout(r, 500));

        // Step 2: Settle (Preimage Reveal) backwards
        setPacketStatus('settle');
        await new Promise(r => setTimeout(r, 800));
        setPacketPos('B');
        await new Promise(r => setTimeout(r, 800));
        setPacketPos('A');
        await new Promise(r => setTimeout(r, 500));

        setPacketStatus('idle');
        setPacketPos(null);
        setHistory(prev => [{ id: `${Date.now()}-${Math.random()}`, msg: `Alice routed Payment to Charlie (hops: 2). Preimage revealed.` }, ...prev]);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                            Lightning Visualizer ⚡
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">
                            Production-ready Layer 2 for instant, low-fee payments: channels, routing, and settlement.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                    <h2 className="text-slate-300 text-sm font-bold mb-3 uppercase tracking-widest">Lightning Status (2026)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2 text-slate-300">
                            <p>
                                Lightning is no longer experimental. It is production-ready and broadly used for fast Bitcoin payments.
                            </p>
                            <p>
                                Major exchanges and platforms support Lightning, including <span className="text-white font-semibold">Coinbase</span>,{" "}
                                <span className="text-white font-semibold">Kraken</span>, <span className="text-white font-semibold">Binance</span>, and{" "}
                                <span className="text-white font-semibold">Bitfinex</span>.
                            </p>
                        </div>
                        <div className="space-y-2 text-slate-300">
                            <p>
                                Best fit: small and medium payments with instant UX and low fees.
                            </p>
                            <p>
                                Trade-off: large/high-assurance settlement is still often finalized on-chain for maximum finality.
                            </p>
                            <p className="text-xs text-slate-400">
                                Security best practices: use watchtowers, keep channels well-managed, monitor liquidity, and rebalance routes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* LEFT: Channel Simulator */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">⚡</div>

                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Single Channel State</h3>

                        {/* Balance Bar */}
                        <div className="relative h-16 bg-slate-800 rounded-xl overflow-hidden flex mb-8 border border-slate-700">
                            <motion.div
                                className="h-full bg-blue-500 flex items-center justify-start px-4 text-blue-950 font-bold"
                                animate={{ width: `${(aliceBal / capacity) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            >
                                <span className="whitespace-nowrap">Alice: {aliceBal.toLocaleString()}</span>
                            </motion.div>
                            <motion.div
                                className="h-full bg-emerald-500 flex items-center justify-end px-4 text-emerald-950 font-bold flex-1"
                                animate={{ width: `${(bobBal / capacity) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            >
                                <span className="whitespace-nowrap">Bob: {bobBal.toLocaleString()}</span>
                            </motion.div>

                            {/* Capacity Marker */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-950/80 px-2 py-0.5 text-[10px] rounded-b text-slate-400">
                                Cap: 1.0M sats
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-between gap-4">
                            <div className="space-y-2">
                                <button onClick={() => payBob(10000)} className="block w-full px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded border border-blue-500/50 text-sm">
                                    Send 10k ➔
                                </button>
                                <button onClick={() => payBob(100000)} className="block w-full px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded border border-blue-500/50 text-sm">
                                    Send 100k ➔
                                </button>
                            </div>
                            <div className="space-y-2">
                                <button onClick={() => payAlice(10000)} className="block w-full px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded border border-emerald-500/50 text-sm">
                                    ⬅ Send 10k
                                </button>
                                <button onClick={() => payAlice(100000)} className="block w-full px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded border border-emerald-500/50 text-sm">
                                    ⬅ Send 100k
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-slate-950 rounded border border-slate-800 text-xs font-mono h-32 overflow-y-auto">
                            {history.length === 0 ? <span className="text-slate-600">Channel Activity Log...</span> : history.map((h, i) => (
                                <div key={h.id} className="mb-1 text-slate-400">
                                    <span className="text-slate-600">[{i}]</span> {h.msg}
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* RIGHT: Routing Visualizer */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col">
                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Multi-Hop Routing</h3>

                        <div className="flex-1 flex items-center justify-between px-8 relative">
                            {/* Nodes */}
                            <div className="z-10 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold border-4 border-slate-950 shadow-xl shadow-blue-500/20">A</div>
                                <div className="text-xs text-slate-400">Alice</div>
                            </div>

                            <div className="h-2 flex-1 bg-slate-800 mx-2 rounded relative">
                                {/* Packet */}
                                {packetPos !== null && (
                                    <motion.div
                                        className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20 ${packetStatus === 'htlc' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                        initial={false}
                                        animate={{
                                            left: packetPos === 'A' ? '0%' : packetPos === 'B' ? '50%' : '100%',
                                            marginLeft: packetPos === 'A' ? 0 : packetPos === 'B' ? '-12px' : '-24px' // Adjust center
                                        }}
                                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    />
                                )}
                            </div>

                            <div className="z-10 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold border-4 border-slate-950">B</div>
                                <div className="text-xs text-slate-400">Bob (Router)</div>
                            </div>

                            <div className="h-2 flex-1 bg-slate-800 mx-2 rounded relative"></div>

                            <div className="z-10 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-2xl font-bold border-4 border-slate-950 shadow-xl shadow-purple-500/20">C</div>
                                <div className="text-xs text-slate-400">Charlie</div>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={routePayment}
                                disabled={packetStatus !== 'idle'}
                                className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {packetStatus === 'idle' ? "Route Payment (A -> C)" : packetStatus === 'htlc' ? "Locking HTLC..." : "Settling..."}
                            </button>
                            <p className="mt-4 text-xs text-slate-500 max-w-sm mx-auto">
                                Alice has no channel with Charlie. She routes the payment through Bob.
                                <br />
                                <span className="text-amber-500">Yellow = HTLC (Promised)</span> | <span className="text-emerald-500">Green = Settlement (Final)</span>
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
