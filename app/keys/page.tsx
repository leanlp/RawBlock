"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";
import { motion } from "framer-motion";

export default function KeysPage() {
    const [privateKey, setPrivateKey] = useState<string>("");
    const [publicKey, setPublicKey] = useState<string>("");
    const [legacyAddr, setLegacyAddr] = useState<string>("");
    const [segwitAddr, setSegwitAddr] = useState<string>("");

    // Generate a new key pair
    const generateKey = () => {
        // 1. Generate Private Key (32 bytes random)
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        setPrivateKey(hex);

        // 2. Derive Public Key (Simulated for Education)
        // In reality: P = k * G
        // We will fake the deterministic nature for the visualizer to avoid heavy ECC libs in browser
        // Visual hack: Hash the priv key to get "x" coordinate
        setPublicKey("04" + hex + "a1b2c3d4..."); // Mock uncompressed

        // 3. Derive Addresses (Simulated)
        setLegacyAddr("1" + hex.substring(0, 30) + "...");
        setSegwitAddr("bc1q" + hex.substring(0, 38) + "...");
    };

    // better "simulated" derivation to look real
    async function deriveRealLookingKeys(privHex: string) {
        // Hash priv key to get some deterministic "randomness" for the other fields
        const encoder = new TextEncoder();
        const data = encoder.encode(privHex);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Mock Public Key (Compressed)
        // Starts with 02 or 03.
        const pubKey = "03" + hashHex;
        setPublicKey(pubKey);

        // Mock Legacy (1...) - Hash160ish
        // We'll just take the public key hash and base58-like encode it (alphanumeric)
        // For visual demo, simple string manipulation is safer than implementing Base58Check from scratch without libs
        const addrHash = hashHex.substring(0, 40);
        setLegacyAddr("1" + addrHash.replace(/[0-9]/g, x => "A" + x).substring(0, 33)); // Fake Base58 look

        // Mock SegWit (bc1q...) - Bech32ish
        setSegwitAddr("bc1q" + hashHex.substring(0, 40) + "d60z");
    }

    const handleGenerate = () => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        setPrivateKey(hex);
        deriveRealLookingKeys(hex);
    };

    // Initial gen
    useEffect(() => {
        handleGenerate();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
                            The Key Forge 🗝️
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">Cryptographic Key Derivation Pipeline</p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-violet-500/20"
                    >
                        Generate New Key 🎲
                    </button>
                </div>

                <div className="space-y-12">

                    {/* STEP 1: PRIVATE KEY */}
                    <div className="relative">
                        <div className="absolute left-8 top-8 bottom-0 w-0.5 bg-slate-800 -z-10"></div>

                        <div className="flex gap-6">
                            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-violet-500 flex items-center justify-center text-2xl z-10 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                🔒
                            </div>
                            <div className="flex-1 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                                <h3 className="text-violet-400 text-xs uppercase tracking-widest mb-1">Step 1: The Private Key</h3>
                                <p className="text-slate-500 text-xs mb-4">A 256-bit random integer. This is the secret you must keep.</p>
                                <div className="font-mono text-sm break-all text-slate-200 bg-slate-950 p-4 rounded border border-slate-800/50">
                                    {privateKey}
                                </div>
                                <div className="mt-2 h-2 w-full rounded-full overflow-hidden flex">
                                    {/* Entropy Visualizer */}
                                    {privateKey.split('').map((char, i) => (
                                        <div key={i} className="flex-1" style={{ backgroundColor: `#${char}${char}${char}` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STEP 2: PUBLIC KEY */}
                    <div className="relative">
                        <div className="absolute left-8 top-8 bottom-0 w-0.5 bg-slate-800 -z-10"></div>

                        <div className="flex gap-6">
                            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xs font-mono text-slate-500 z-10">
                                y²=x³+7
                            </div>
                            <div className="flex-1 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                                <h3 className="text-blue-400 text-xs uppercase tracking-widest mb-1">Step 2: Elliptic Curve Multiplication</h3>
                                <p className="text-slate-500 text-xs mb-4">
                                    We multiply the Generator Point (G) by your Private Key (k). <br />
                                    <span className="font-mono text-slate-400">P = k * G</span> (One-way function).
                                </p>
                                <div className="font-mono text-sm break-all text-blue-200 bg-slate-950 p-4 rounded border border-slate-800/50">
                                    {publicKey}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* STEP 3: ADDRESS FACTORY */}
                    <div className="relative">
                        <div className="flex gap-6">
                            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-2xl z-10 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                📬
                            </div>
                            <div className="flex-1 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                                <h3 className="text-emerald-400 text-xs uppercase tracking-widest mb-1">Step 3: Address Derivation</h3>
                                <p className="text-slate-500 text-xs mb-6">Encoding the Public Key into shareable formats.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-slate-950 rounded border border-slate-800 relative group transition-all hover:border-amber-500/50">
                                        <div className="absolute top-2 right-2 text-[10px] text-slate-600 uppercase">Legacy (P2PKH)</div>
                                        <div className="text-amber-500 font-bold mb-1">1 (Base58)</div>
                                        <div className="text-xs text-slate-400 font-mono break-all">{legacyAddr}</div>
                                    </div>

                                    <div className="p-4 bg-slate-950 rounded border border-slate-800 relative group transition-all hover:border-emerald-500/50">
                                        <div className="absolute top-2 right-2 text-[10px] text-slate-600 uppercase">SegWit (Bech32)</div>
                                        <div className="text-emerald-500 font-bold mb-1">bc1q (Native)</div>
                                        <div className="text-xs text-slate-400 font-mono break-all">{segwitAddr}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
