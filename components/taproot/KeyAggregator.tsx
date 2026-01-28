
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Signer {
    id: number;
    name: string;
    privateKey: number; // Simplified scalar
    publicKey: string;  // Simplified point hex representation
    nonce: number;
}

export default function KeyAggregator() {
    const [signers, setSigners] = useState<Signer[]>([
        { id: 1, name: "Alice", privateKey: 123, publicKey: "Pt(A)", nonce: 5 },
        { id: 2, name: "Bob", privateKey: 456, publicKey: "Pt(B)", nonce: 7 }
    ]);

    const addSigner = () => {
        const id = signers.length + 1;
        const pk = Math.floor(Math.random() * 900) + 100;
        setSigners([...signers, {
            id,
            name: `Signer ${id}`,
            privateKey: pk,
            publicKey: `Pt(${id})`,
            nonce: Math.floor(Math.random() * 10)
        }]);
    };

    const removeSigner = (id: number) => {
        setSigners(signers.filter(s => s.id !== id));
    };

    // --- AGGREGATION LOGIC (Simplified) ---
    // In reality: P_agg = sum(mu_i * P_i)
    // Here we show linear addition for concept: P_agg = P1 + P2...

    // 1. Aggregate Private Keys (x = x1 + x2...)
    const aggPrivateKey = signers.reduce((acc, s) => acc + s.privateKey, 0);

    // 2. Aggregate Public Keys (P = P1 + P2...)
    // Visual string only for educational clarity
    const aggPubString = signers.map(s => s.publicKey).join(" + ");

    // 3. Message
    const message = "Spending 100 BTC";

    // 4. Schnorr Signature S = R + H(P, R, m) * x
    // Simplified: s_agg = sum(s_i)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT: Signers Config */}
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Signers (MuSig)</h3>
                    <button onClick={addSigner} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300">
                        + Add Participant
                    </button>
                </div>

                <div className="space-y-4">
                    <AnimatePresence>
                        {signers.map(s => (
                            <motion.div
                                key={s.id}
                                layout
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-bold text-slate-300">{s.name}</div>
                                    <div className="font-mono text-[10px] text-slate-500 mt-1">
                                        Priv: <span className="text-emerald-500">{s.privateKey}</span> |
                                        Pub: <span className="text-blue-400">{s.publicKey}</span>
                                    </div>
                                </div>
                                <button onClick={() => removeSigner(s.id)} className="text-slate-600 hover:text-red-500">×</button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* RIGHT: Math Visualization */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aggregation Magic</h3>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-8 relative overflow-hidden">

                    {/* Visual Connection Lines would go here with SVG if complex */}

                    {/* Step 1: Key Aggregation */}
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase mb-2">Aggregate Public Key (The Lock)</div>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs break-all text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                            P_agg = {aggPubString}
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500">
                            To the blockchain, this looks like a <strong>single</strong> normal public key.
                            Observers cannot distinguish this Multisig from a singleuser wallet!
                        </p>
                    </div>

                    {/* Step 2: Signature Aggregation */}
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase mb-2">Aggregate Signature (The Key)</div>
                        <div className="bg-emerald-950/30 p-4 rounded-lg font-mono text-xs text-emerald-300 border border-emerald-500/30">
                            <div className="mb-2 opacity-50"># Partial Signatures:</div>
                            {signers.map(s => (
                                <div key={s.id} className="flex justify-between">
                                    <span>s_{s.id} = r_{s.id} + H(...) * x_{s.id}</span>
                                    <span>(Partial)</span>
                                </div>
                            ))}
                            <div className="h-px bg-emerald-500/50 my-2"></div>
                            <div className="flex justify-between font-bold text-emerald-400">
                                <span>S_agg = ∑ s_i</span>
                                <span>(Final Sig)</span>
                            </div>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                        <div className="text-xs text-slate-400">Total Combined Private Scalar</div>
                        <div className="text-2xl font-bold text-white font-mono mt-1">{aggPrivateKey}</div>
                    </div>

                </div>
            </div>

        </div>
    );
}
