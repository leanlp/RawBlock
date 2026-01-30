"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { motion } from "framer-motion";
import {
    generateFullKeyDerivation,
    deriveFromPrivateKey,
    CURVE,
    type DerivedKeys
} from "../../../utils/bitcoin-crypto";

export default function KeysPage() {
    const [keys, setKeys] = useState<DerivedKeys | null>(null);
    const [customPrivKey, setCustomPrivKey] = useState<string>("");
    const [showMath, setShowMath] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate new key pair with real ECDSA
    const handleGenerate = () => {
        try {
            setError(null);
            const derivation = generateFullKeyDerivation();
            setKeys(derivation);
            setCustomPrivKey("");
        } catch (err) {
            setError("Key generation failed");
            console.error(err);
        }
    };

    // Derive from custom private key
    const handleDeriveCustom = () => {
        if (customPrivKey.length !== 64) {
            setError("Private key must be 64 hex characters (256 bits)");
            return;
        }
        try {
            setError(null);
            const derivation = deriveFromPrivateKey(customPrivKey);
            setKeys(derivation);
        } catch (err) {
            setError("Invalid private key");
            console.error(err);
        }
    };

    // Initial generation
    useEffect(() => {
        handleGenerate();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-6xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
                            The Key Forge 🗝️
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">
                            Real ECDSA Key Derivation on secp256k1
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                                ✓ Real Cryptography
                            </span>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                                @noble/secp256k1
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button
                            onClick={() => setShowMath(!showMath)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm rounded-lg border border-slate-700"
                        >
                            {showMath ? 'Hide' : 'Show'} Math
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-violet-500/20"
                        >
                            Generate New Key 🎲
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Custom Private Key Input */}
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                    <label className="block text-xs text-slate-500 uppercase mb-2">
                        Or Import Your Own Private Key (64 hex chars)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customPrivKey}
                            onChange={(e) => setCustomPrivKey(e.target.value.replace(/[^0-9a-fA-F]/g, ''))}
                            placeholder="Enter 256-bit private key in hex..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            maxLength={64}
                        />
                        <button
                            onClick={handleDeriveCustom}
                            disabled={customPrivKey.length !== 64}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
                        >
                            Derive
                        </button>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                        {customPrivKey.length}/64 characters
                    </div>
                </div>

                {keys && (
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
                                    <p className="text-slate-500 text-xs mb-4">
                                        A 256-bit random integer. This is the secret you must protect forever.
                                    </p>
                                    <div className="font-mono text-sm break-all text-slate-200 bg-slate-950 p-4 rounded border border-slate-800/50">
                                        {keys.privateKey}
                                    </div>
                                    <div className="mt-2 h-2 w-full rounded-full overflow-hidden flex">
                                        {keys.privateKey.split('').map((char, i) => (
                                            <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${parseInt(char, 16) * 22}, 70%, 50%)` }}></div>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-600">
                                        Entropy: 256 bits = 2^256 possibilities ≈ 10^77 (more than atoms in universe)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2: PUBLIC KEY */}
                        <div className="relative">
                            <div className="absolute left-8 top-8 bottom-0 w-0.5 bg-slate-800 -z-10"></div>

                            <div className="flex gap-6">
                                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center text-xs font-mono text-blue-400 z-10 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                    y²=x³+7
                                </div>
                                <div className="flex-1 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                                    <h3 className="text-blue-400 text-xs uppercase tracking-widest mb-1">Step 2: Elliptic Curve Multiplication</h3>
                                    <p className="text-slate-500 text-xs mb-4">
                                        Real ECDSA: We multiply the Generator Point (G) by your Private Key (k). <br />
                                        <span className="font-mono text-slate-400">P = k × G</span> (One-way function on secp256k1)
                                    </p>

                                    {showMath && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mb-4 p-4 bg-slate-950 rounded-xl border border-blue-500/20 text-xs space-y-2"
                                        >
                                            <div className="text-blue-400 font-bold">secp256k1 Curve Parameters:</div>
                                            <div><span className="text-slate-500">Equation:</span> y² = x³ + 7 (mod p)</div>
                                            <div className="break-all"><span className="text-slate-500">Prime p:</span> <span className="text-slate-400">{CURVE.p.toString(16).substring(0, 40)}...</span></div>
                                            <div className="break-all"><span className="text-slate-500">Order n:</span> <span className="text-slate-400">{CURVE.n.toString(16).substring(0, 40)}...</span></div>
                                            <div className="break-all"><span className="text-slate-500">Generator G.x:</span> <span className="text-slate-400">{CURVE.G.x.toString(16).substring(0, 40)}...</span></div>
                                        </motion.div>
                                    )}

                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-[10px] text-slate-600 uppercase mb-1">Compressed (33 bytes)</div>
                                            <div className="font-mono text-xs break-all text-blue-200 bg-slate-950 p-3 rounded border border-slate-800/50">
                                                <span className="text-emerald-400">{keys.publicKeyCompressed.substring(0, 2)}</span>
                                                {keys.publicKeyCompressed.substring(2)}
                                            </div>
                                            <div className="text-[10px] text-slate-600 mt-1">
                                                Prefix <span className="text-emerald-400">{keys.publicKeyCompressed.substring(0, 2)}</span> = even/odd y-coordinate
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-[10px] text-slate-600 uppercase mb-1">X-Only (32 bytes) - Taproot/Schnorr</div>
                                            <div className="font-mono text-xs break-all text-violet-200 bg-slate-950 p-3 rounded border border-slate-800/50">
                                                {keys.xOnlyPubKey}
                                            </div>
                                        </div>
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
                                    <p className="text-slate-500 text-xs mb-6">
                                        Real Bitcoin addresses with proper checksums. These can receive actual Bitcoin!
                                    </p>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Legacy */}
                                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 relative group transition-all hover:border-amber-500/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-amber-500 font-bold">Legacy (P2PKH)</div>
                                                    <div className="text-[10px] text-slate-600">Base58Check • Version 0x00</div>
                                                </div>
                                                <div className="text-[10px] text-amber-500/50 uppercase">Starts with 1</div>
                                            </div>
                                            <div className="font-mono text-sm text-amber-200 break-all bg-slate-900/50 p-3 rounded">
                                                {keys.legacyAddress}
                                            </div>
                                            {showMath && (
                                                <div className="mt-2 text-[10px] text-slate-600">
                                                    = Base58Check(0x00 || RIPEMD160(SHA256(pubkey)))
                                                </div>
                                            )}
                                        </div>

                                        {/* SegWit */}
                                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 relative group transition-all hover:border-emerald-500/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-emerald-500 font-bold">Native SegWit (P2WPKH)</div>
                                                    <div className="text-[10px] text-slate-600">Bech32 • Witness v0</div>
                                                </div>
                                                <div className="text-[10px] text-emerald-500/50 uppercase">Starts with bc1q</div>
                                            </div>
                                            <div className="font-mono text-sm text-emerald-200 break-all bg-slate-900/50 p-3 rounded">
                                                {keys.segwitAddress}
                                            </div>
                                            {showMath && (
                                                <div className="mt-2 text-[10px] text-slate-600">
                                                    = Bech32(&quot;bc&quot;, 0 || HASH160(pubkey))
                                                </div>
                                            )}
                                        </div>

                                        {/* Taproot */}
                                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 relative group transition-all hover:border-violet-500/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-violet-500 font-bold">Taproot (P2TR)</div>
                                                    <div className="text-[10px] text-slate-600">Bech32m • Witness v1</div>
                                                </div>
                                                <div className="text-[10px] text-violet-500/50 uppercase">Starts with bc1p</div>
                                            </div>
                                            <div className="font-mono text-sm text-violet-200 break-all bg-slate-900/50 p-3 rounded">
                                                {keys.taprootAddress}
                                            </div>
                                            {showMath && (
                                                <div className="mt-2 text-[10px] text-slate-600">
                                                    = Bech32m(&quot;bc&quot;, 1 || x-only-pubkey)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Educational Footer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <h4 className="font-bold text-white text-sm mb-2">🔐 Security</h4>
                        <p className="text-xs text-slate-400">
                            Private keys generated using <code className="text-violet-400">crypto.getRandomValues()</code> -
                            cryptographically secure randomness from your browser.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <h4 className="font-bold text-white text-sm mb-2">📐 Real Math</h4>
                        <p className="text-xs text-slate-400">
                            Uses <code className="text-blue-400">@noble/secp256k1</code> - an audited,
                            production-grade elliptic curve library.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <h4 className="font-bold text-white text-sm mb-2">⚠️ Caution</h4>
                        <p className="text-xs text-slate-400">
                            Never use keys generated on a website for real funds!
                            Use hardware wallets or offline generation for real Bitcoin.
                        </p>
                    </div>
                </div>

            </div>
        </main>
    );
}
