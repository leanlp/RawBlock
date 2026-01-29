"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import { motion } from "framer-motion";

export default function HashingPage() {
    // Block Header Fields
    const [version, setVersion] = useState(536870912); // Standard Version
    const [prevHash, setPrevHash] = useState("0000000000000000000320283a032748cef8227873ffede9153fa18dd87028e0");
    const [merkleRoot, setMerkleRoot] = useState("87175866e6145244e46e28d003a36a5a0cb7235072714249a56a6327e5623086");
    const [timestamp, setTimestamp] = useState(1705689000);
    const [bits, setBits] = useState(486604799); // Compact difficulty
    const [nonce, setNonce] = useState(0);

    // Mining State
    const [isMining, setIsMining] = useState(false);
    const [hashrate, setHashrate] = useState(0);
    const [targetZeros, setTargetZeros] = useState(3); // Difficulty (Leading zeros)

    // Output
    const [blockHash, setBlockHash] = useState("");
    const [valid, setValid] = useState(false);

    // Refs for mining loop
    const nonceRef = useRef(nonce);
    const miningRef = useRef(false);

    // Crypto Helpers
    async function calculateHash(v: number, p: string, m: string, t: number, b: number, n: number) {
        // Construct simulated header string (pseudo-header for viz)
        // In reality, this is Little Endian binary data.
        // For educational clarity, we'll hash the generic string representation unless requested otherwise.
        // But to be "Professional", let's try to mimic the data structure or just use a consistent string.
        // Let's use a simple string concatenation for speed and clarity in this web demo.
        const data = `${v}${p}${m}${t}${b}${n}`;

        const encoder = new TextEncoder();
        const msgBuffer = encoder.encode(data);

        // Double SHA-256
        const hashBuffer1 = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashBuffer2 = await crypto.subtle.digest('SHA-256', hashBuffer1);

        const hashArray = Array.from(new Uint8Array(hashBuffer2));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex;
    }

    // Effect: Update Hash when fields change (if not auto-mining)
    useEffect(() => {
        if (!isMining) {
            calculateHash(version, prevHash, merkleRoot, timestamp, bits, nonce).then(h => {
                setBlockHash(h);
                checkValidity(h, targetZeros);
            });
        }
    }, [version, prevHash, merkleRoot, timestamp, bits, nonce, isMining, targetZeros]);

    const checkValidity = (hash: string, zeros: number) => {
        const prefix = "0".repeat(zeros);
        setValid(hash.startsWith(prefix));
    };

    // Mining Loop
    const startMining = () => {
        if (!isMining) {
            setIsMining(true);
            miningRef.current = true;
            nonceRef.current = nonce;
            mineLoop();
        } else {
            setIsMining(false);
            miningRef.current = false;
        }
    };

    const mineLoop = async () => {
        let localNonce = nonceRef.current;
        const startTime = Date.now();
        let hashes = 0;

        // Run in chunks to allow UI render
        while (miningRef.current) {
            localNonce++;
            hashes++;

            // For speed, we might want to simplify the hash function in the tight loop or minimize overhead
            // But let's adhere to the "Real" algo
            const h = await calculateHash(version, prevHash, merkleRoot, timestamp, bits, localNonce);

            if (h.startsWith("0".repeat(targetZeros))) {
                // FOUND!
                setNonce(localNonce);
                setBlockHash(h);
                setValid(true);
                setIsMining(false);
                miningRef.current = false;
                break;
            }

            // Update UI every 1000 iterations
            if (hashes % 4321 === 0) {
                setNonce(localNonce);
                setBlockHash(h);
                setHashrate(Math.round(hashes / ((Date.now() - startTime) / 1000)));
                await new Promise(r => setTimeout(r, 0)); // Yield
            }
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono">
            <div className="max-w-5xl mx-auto space-y-8">
                <Header />

                <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">
                            The Foundry 🔨
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">Manual Proof-of-Work Simulator. Forge the block.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Target Difficulty</div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setTargetZeros(Math.max(1, targetZeros - 1))} className="text-slate-500 hover:text-white">-</button>
                                <span className="font-bold text-xl text-rose-500">{targetZeros} Zeros</span>
                                <button onClick={() => setTargetZeros(Math.min(64, targetZeros + 1))} className="text-slate-500 hover:text-white">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* INPUTS */}
                    <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">Version</label>
                                <input type="number" value={version} onChange={e => setVersion(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm font-mono text-blue-400" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">Timestamp</label>
                                <input type="number" value={timestamp} onChange={e => setTimestamp(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm font-mono text-purple-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase mb-1">Previous Block Hash</label>
                            <input type="text" value={prevHash} onChange={e => setPrevHash(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-400" />
                        </div>

                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase mb-1">Merkle Root</label>
                            <input type="text" value={merkleRoot} onChange={e => setMerkleRoot(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-400" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">Bits (Diff)</label>
                                <input type="number" value={bits} onChange={e => setBits(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm font-mono text-slate-400" />
                            </div>
                            <div className="relative">
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">Nonce (The Key)</label>
                                <input type="number" value={nonce} onChange={e => setNonce(parseInt(e.target.value))} className="w-full bg-slate-950 border border-rose-500/50 rounded p-2 text-sm font-mono text-rose-400 font-bold" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
                            <div className="text-xs text-slate-500">
                                {isMining ? <span className="text-emerald-400 animate-pulse">Running: {hashrate} H/s</span> : "Idle"}
                            </div>
                            <button
                                onClick={startMining}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${isMining ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                            >
                                {isMining ? "STOP MINING" : "START MINING ⛏️"}
                            </button>
                        </div>
                    </div>

                    {/* OUTPUT */}
                    <div className="flex flex-col gap-6">
                        <div className={`flex-1 p-6 rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden ${valid ? 'bg-emerald-500/10 border-emerald-500 shadow-2xl shadow-emerald-500/20' : 'bg-slate-900/50 border-slate-800'}`}>

                            <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-4">Block Hash Result</h2>

                            <div className="font-mono text-sm break-all text-center max-w-full px-4 relative z-10">
                                <span className={valid ? "text-emerald-400 font-bold" : "text-slate-600"}>
                                    {blockHash.slice(0, targetZeros)}
                                </span>
                                <span className={valid ? "text-emerald-200" : "text-slate-500"}>
                                    {blockHash.slice(targetZeros)}
                                </span>
                            </div>

                            {valid && (
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"
                                >
                                    <div className="text-9xl">✅</div>
                                </motion.div>
                            )}

                            {!valid && !isMining && (
                                <div className="mt-8 text-xs text-rose-500 bg-rose-500/10 px-3 py-1 rounded">
                                    Invalid Proof of Work. Hash must start with {targetZeros} zeros.
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
                            <h3 className="text-slate-400 text-sm font-bold mb-2">How it works</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Bitcoin uses <strong>Double SHA-256</strong>. Miners take the block header and hash it repeatedly, incrementing the <strong>Nonce</strong> each time.
                            </p>
                            <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800 fontFamily-mono text-[10px] text-slate-400">
                                SHA256(SHA256(Ver + Prev + Root + Time + Bits + <span className="text-rose-500">Nonce</span>))
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
