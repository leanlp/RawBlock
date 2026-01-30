"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    generatePrivateKey,
    getPublicKey,
    getXOnlyPubKey,
    signSchnorr,
    verifySchnorr,
    aggregatePublicKeys,
    bytesToHex,
    hexToBytes,
    hash256,
    CURVE,
    type SchnorrSignature
} from "../../utils/bitcoin-crypto";

interface Signer {
    id: number;
    name: string;
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    xOnlyPubKey: Uint8Array;
    signature?: SchnorrSignature;
}

export default function KeyAggregator() {
    const [signers, setSigners] = useState<Signer[]>([]);
    const [message, setMessage] = useState("Hello, Taproot!");
    const [messageHash, setMessageHash] = useState<Uint8Array | null>(null);
    const [aggregatedPubKey, setAggregatedPubKey] = useState<Uint8Array | null>(null);
    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
    const [isSigningAll, setIsSigningAll] = useState(false);

    // Initialize with two signers
    useEffect(() => {
        const alice = createSigner(1, "Alice");
        const bob = createSigner(2, "Bob");
        setSigners([alice, bob]);
    }, []);

    // Update message hash when message changes
    useEffect(() => {
        const msgBytes = new TextEncoder().encode(message);
        setMessageHash(hash256(msgBytes));
    }, [message]);

    // Update aggregated key when signers change
    useEffect(() => {
        if (signers.length > 0) {
            try {
                const pubKeys = signers.map(s => s.publicKey);
                const aggKey = aggregatePublicKeys(pubKeys);
                setAggregatedPubKey(aggKey);
            } catch (err) {
                console.error("Aggregation error:", err);
            }
        }
    }, [signers]);

    const createSigner = (id: number, name: string): Signer => {
        const privKey = generatePrivateKey();
        const pubKey = getPublicKey(privKey, true);
        const xOnlyPubKey = getXOnlyPubKey(privKey);
        return {
            id,
            name,
            privateKey: privKey,
            publicKey: pubKey,
            xOnlyPubKey
        };
    };

    const addSigner = () => {
        const id = signers.length + 1;
        const names = ["Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
        const name = names[(id - 1) % names.length] || `Signer ${id}`;
        setSigners([...signers, createSigner(id, name)]);
    };

    const removeSigner = (id: number) => {
        setSigners(signers.filter(s => s.id !== id));
    };

    // Sign message with a specific signer
    const signWithSigner = useCallback(async (signerId: number) => {
        if (!messageHash) return;

        const signer = signers.find(s => s.id === signerId);
        if (!signer) return;

        try {
            const sig = await signSchnorr(messageHash, signer.privateKey);
            setSigners(prev => prev.map(s =>
                s.id === signerId ? { ...s, signature: sig } : s
            ));
        } catch (err) {
            console.error("Signing error:", err);
        }
    }, [messageHash, signers]);

    // Sign with all signers
    const signWithAll = async () => {
        if (!messageHash) return;
        setIsSigningAll(true);

        for (const signer of signers) {
            await signWithSigner(signer.id);
            await new Promise(r => setTimeout(r, 300)); // Visual delay
        }

        setIsSigningAll(false);
    };

    // Verify a signature
    const verifySig = async (signer: Signer) => {
        if (!messageHash || !signer.signature) return;

        try {
            const isValid = await verifySchnorr(
                signer.signature.full,
                messageHash,
                signer.xOnlyPubKey
            );
            setVerificationResult(isValid);
        } catch (err) {
            console.error("Verification error:", err);
            setVerificationResult(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT: Signers Config */}
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Signers (Real Keys)</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                                ✓ Real secp256k1
                            </span>
                        </div>
                    </div>
                    <button onClick={addSigner} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300">
                        + Add Participant
                    </button>
                </div>

                <div className="space-y-3">
                    <AnimatePresence>
                        {signers.map(s => (
                            <motion.div
                                key={s.id}
                                layout
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-slate-300">{s.name}</div>
                                    <div className="flex items-center gap-2">
                                        {s.signature && (
                                            <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                                                ✓ Signed
                                            </span>
                                        )}
                                        <button onClick={() => removeSigner(s.id)} className="text-slate-600 hover:text-red-500">×</button>
                                    </div>
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 space-y-1">
                                    <div>
                                        <span className="text-slate-600">Priv:</span>{' '}
                                        <span className="text-violet-400">{bytesToHex(s.privateKey).substring(0, 16)}...</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Pub:</span>{' '}
                                        <span className="text-blue-400">{bytesToHex(s.publicKey).substring(0, 20)}...</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">x-only:</span>{' '}
                                        <span className="text-emerald-400">{bytesToHex(s.xOnlyPubKey).substring(0, 16)}...</span>
                                    </div>
                                    {s.signature && (
                                        <div className="mt-2 pt-2 border-t border-slate-800">
                                            <span className="text-slate-600">Sig R:</span>{' '}
                                            <span className="text-amber-400">{bytesToHex(s.signature.r).substring(0, 16)}...</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Message Input */}
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                    <label className="block text-xs text-slate-500 uppercase mb-2">Message to Sign</label>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {messageHash && (
                        <div className="mt-2 text-[10px] text-slate-600">
                            SHA256: {bytesToHex(messageHash).substring(0, 32)}...
                        </div>
                    )}
                </div>

                {/* Sign All Button */}
                <button
                    onClick={signWithAll}
                    disabled={isSigningAll}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                >
                    {isSigningAll ? "Signing..." : "✍️ Sign with All Participants"}
                </button>
            </div>

            {/* RIGHT: Math Visualization */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Schnorr Math (BIP340)</h3>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 relative overflow-hidden">

                    {/* Key Aggregation */}
                    <div>
                        <div className="text-[10px] text-cyan-400 uppercase mb-2 font-bold">📐 Key Aggregation</div>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs break-all text-blue-300 border border-blue-500/30">
                            P_agg = {signers.map(s => `P_${s.name.charAt(0)}`).join(' + ')}
                        </div>
                        {aggregatedPubKey && (
                            <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                Result: {bytesToHex(aggregatedPubKey).substring(0, 32)}...
                            </div>
                        )}
                        <p className="mt-2 text-[10px] text-slate-500">
                            Linear property: combined key looks like a single normal key on-chain!
                        </p>
                    </div>

                    {/* Schnorr Signature Equation */}
                    <div>
                        <div className="text-[10px] text-emerald-400 uppercase mb-2 font-bold">✍️ Schnorr Signature</div>
                        <div className="bg-emerald-950/30 p-4 rounded-lg font-mono text-xs text-emerald-300 border border-emerald-500/30 space-y-2">
                            <div className="opacity-70"># For each signer i:</div>
                            <div>s_i = k_i + H(R || P || m) × x_i</div>
                            <div className="h-px bg-emerald-500/30 my-2"></div>
                            <div className="opacity-70"># Where:</div>
                            <div className="text-[10px] text-slate-400">
                                k = random nonce<br />
                                R = k × G (nonce point)<br />
                                P = public key<br />
                                m = message<br />
                                x = private key
                            </div>
                        </div>
                    </div>

                    {/* Verification Equation */}
                    <div>
                        <div className="text-[10px] text-violet-400 uppercase mb-2 font-bold">✅ Verification</div>
                        <div className="bg-violet-950/30 p-4 rounded-lg font-mono text-xs text-violet-300 border border-violet-500/30">
                            <div>s × G = R + H(R || P || m) × P</div>
                            <div className="mt-2 text-[10px] text-slate-400">
                                Verifier checks if the equation holds without knowing the private key!
                            </div>
                        </div>
                    </div>

                    {/* Verification Result */}
                    {verificationResult !== null && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-xl text-center ${verificationResult
                                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                                }`}
                        >
                            {verificationResult ? '✅ Signature Verified!' : '❌ Verification Failed'}
                        </motion.div>
                    )}

                    {/* Verify Button */}
                    {signers.some(s => s.signature) && (
                        <button
                            onClick={() => {
                                const signedSigner = signers.find(s => s.signature);
                                if (signedSigner) verifySig(signedSigner);
                            }}
                            className="w-full py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 font-medium rounded-lg border border-violet-500/30 transition-all"
                        >
                            Verify First Signature
                        </button>
                    )}

                </div>

                {/* Why Schnorr */}
                <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700">
                    <h4 className="font-bold text-white text-sm mb-2">Why Schnorr over ECDSA?</h4>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li>✓ <strong>Linearity:</strong> Signatures can be aggregated (MuSig)</li>
                        <li>✓ <strong>Non-malleable:</strong> Cannot be modified without invalidating</li>
                        <li>✓ <strong>Privacy:</strong> n-of-n multisig looks like single-sig</li>
                        <li>✓ <strong>Simpler:</strong> Provably secure with random oracle model</li>
                    </ul>
                </div>
            </div>

        </div>
    );
}
