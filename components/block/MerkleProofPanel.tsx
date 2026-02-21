"use client";

import { useEffect, useMemo, useState } from "react";
import { buildMerkleProof, computeMerkleRoot, MerkleProofResult } from "@/utils/merkle";

interface MerkleProofPanelProps {
    txids: string[];
    headerMerkleRoot?: string;
    isOpen: boolean;
    onClose: () => void;
}

function shortenHash(hash: string): string {
    if (hash.length < 20) return hash;
    return `${hash.slice(0, 16)}...${hash.slice(-12)}`;
}

function renderStatus(isMatch: boolean | null) {
    if (isMatch === null) {
        return <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">Header root unavailable</span>;
    }
    if (isMatch) {
        return <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">Proof root matches header</span>;
    }
    return <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300">Proof root mismatch</span>;
}

export default function MerkleProofPanel({ txids, headerMerkleRoot, isOpen, onClose }: MerkleProofPanelProps) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [proof, setProof] = useState<MerkleProofResult | null>(null);
    const [computedRoot, setComputedRoot] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || txids.length === 0) return;

        let cancelled = false;
        Promise.all([computeMerkleRoot(txids), buildMerkleProof(txids, selectedIndex)])
            .then(([root, proofResult]) => {
                if (cancelled) return;
                setComputedRoot(root);
                setProof(proofResult);
                setError(null);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : "Failed to build merkle path.";
                setError(message);
                setProof(null);
                setComputedRoot(null);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, selectedIndex, txids]);

    const filteredTxids = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return txids.slice(0, 250);
        return txids
            .map((txid, index) => ({ txid, index }))
            .filter((entry) => entry.txid.toLowerCase().includes(normalized))
            .slice(0, 250);
    }, [query, txids]);

    const selectedTxid = txids[selectedIndex] ?? "";
    const rootMatch =
        headerMerkleRoot && computedRoot
            ? headerMerkleRoot.toLowerCase() === computedRoot.toLowerCase()
            : null;

    if (!isOpen) {
        return null;
    }

    return (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-emerald-300">Merkle Tree Visualizer</h3>
                    <p className="text-xs text-slate-400">
                        Select any transaction and inspect the sibling path used to prove inclusion inside this block.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 hover:border-slate-600"
                >
                    Close Panel
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Inclusion Proof Path</div>
                        {renderStatus(rootMatch)}
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <div className="rounded border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-[11px] uppercase text-slate-500">Leaf Tx</div>
                            <div className="mt-1 font-mono text-xs text-cyan-300">{shortenHash(selectedTxid)}</div>
                        </div>
                        <div className="rounded border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-[11px] uppercase text-slate-500">Header Root</div>
                            <div className="mt-1 font-mono text-xs text-slate-300">{shortenHash(headerMerkleRoot ?? "Unavailable")}</div>
                        </div>
                        <div className="rounded border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-[11px] uppercase text-slate-500">Computed Root</div>
                            <div className="mt-1 font-mono text-xs text-emerald-300">{shortenHash(computedRoot ?? "Computing...")}</div>
                        </div>
                    </div>

                    {!proof && !error ? (
                        <div className="rounded border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-400">
                            Rebuilding merkle layers and proof path...
                        </div>
                    ) : null}

                    {error ? (
                        <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
                    ) : null}

                    {proof ? (
                        <div className="space-y-2">
                            {proof.path.map((step) => (
                                <div key={`${step.level}-${step.sibling}`} className="rounded border border-slate-800 bg-slate-900/60 p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <span className="text-slate-300">Level {step.level}</span>
                                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                                            sibling on {step.siblingPosition}
                                        </span>
                                    </div>
                                    <div className="mt-1 break-all font-mono text-xs text-cyan-300">{step.sibling}</div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Pick Transaction</div>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Filter txid..."
                        className="w-full rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                    <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                        {filteredTxids.map((entry) => {
                            const txid = typeof entry === "string" ? entry : entry.txid;
                            const index = typeof entry === "string" ? txids.indexOf(entry) : entry.index;
                            const selected = index === selectedIndex;
                            return (
                                <button
                                    key={`${index}-${txid}`}
                                    type="button"
                                    onClick={() => setSelectedIndex(index)}
                                    className={`w-full rounded border px-2 py-2 text-left text-xs font-mono transition ${
                                        selected
                                            ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-200"
                                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                                    }`}
                                >
                                    <div className="text-[10px] text-slate-500">#{index}</div>
                                    <div className="break-all">{txid}</div>
                                </button>
                            );
                        })}
                        {filteredTxids.length === 0 ? (
                            <div className="rounded border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-400">
                                No transactions match your filter.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}
