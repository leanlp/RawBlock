"use client";

import { useMemo, useState } from "react";
import { calculateDifficulty, nbitsToTarget } from "@/utils/consensus-rules";

type HeaderFieldKey = "version" | "bits" | "nonce" | "time" | "merkleroot" | "previousblockhash";

export interface BlockHeaderData {
    version?: number;
    bits?: string;
    nonce?: number;
    time: number;
    mediantime?: number;
    merkleroot?: string;
    previousblockhash?: string;
    hash: string;
    height: number;
    txCount: number;
}

interface BlockHeaderInspectorProps {
    header: BlockHeaderData;
    computedMerkleRoot: string | null;
    onOpenMerklePanel: () => void;
}

const fieldDescriptions: Record<HeaderFieldKey, string> = {
    version:
        "Signals consensus upgrades and feature flags. Version bits are how miners indicate readiness for soft-fork deployments.",
    bits:
        "Compact encoding (nBits) of the PoW target. Lower target means higher difficulty and more hash work required.",
    nonce:
        "32-bit field miners mutate per hash attempt. Exhausted nonce space pushes extra nonce updates in coinbase and header rewrites.",
    time:
        "Header timestamp used in median-time-past validation and difficulty adjustment cadence. Must stay within consensus bounds.",
    merkleroot:
        "Commitment to every transaction in the block. A single byte change in any tx rewrites this root.",
    previousblockhash:
        "Links this block to its parent, extending the most-work chain and preserving historical immutability.",
};

function shortHash(value?: string): string {
    if (!value) return "Unavailable";
    if (value.length <= 20) return value;
    return `${value.slice(0, 14)}...${value.slice(-10)}`;
}

function formatBits(bits?: string): string {
    if (!bits) return "Unavailable";
    const clean = bits.trim().toLowerCase();
    if (clean.startsWith("0x")) return clean;
    return `0x${clean}`;
}

function readVersionSignals(version?: number): string {
    if (typeof version !== "number") return "Unavailable";
    const top = (version >>> 29) & 0x07;
    const signaling = version & 0x1fffffff;
    const enabledBits: number[] = [];
    for (let i = 0; i < 29; i += 1) {
        if ((signaling & (1 << i)) !== 0) {
            enabledBits.push(i);
        }
    }
    return `top=${top.toString(2).padStart(3, "0")} | signal bits: ${enabledBits.length > 0 ? enabledBits.slice(0, 8).join(", ") : "none"}`;
}

export default function BlockHeaderInspector({
    header,
    computedMerkleRoot,
    onOpenMerklePanel,
}: BlockHeaderInspectorProps) {
    const [selectedField, setSelectedField] = useState<HeaderFieldKey>("version");

    const derived = useMemo(() => {
        const difficulty =
            header.bits && /^[0-9a-fA-F]+$/.test(header.bits)
                ? calculateDifficulty(header.bits).toLocaleString()
                : "Unavailable";
        const target =
            header.bits && /^[0-9a-fA-F]+$/.test(header.bits)
                ? nbitsToTarget(header.bits)
                : "";

        return {
            versionHex: typeof header.version === "number" ? `0x${header.version.toString(16)}` : "Unavailable",
            difficulty,
            targetPreview: target ? `${target.slice(0, 16)}...${target.slice(-16)}` : "Unavailable",
            versionSignals: readVersionSignals(header.version),
            merkleMatch:
                header.merkleroot && computedMerkleRoot
                    ? header.merkleroot.toLowerCase() === computedMerkleRoot.toLowerCase()
                    : null,
        };
    }, [computedMerkleRoot, header.bits, header.merkleroot, header.version]);

    const cards: Array<{
        key: HeaderFieldKey;
        label: string;
        value: string;
        extra?: string;
        action?: "open-merkle";
    }> = [
            {
                key: "version",
                label: "Version",
                value: typeof header.version === "number" ? `${header.version} (${derived.versionHex})` : "Unavailable",
                extra: derived.versionSignals,
            },
            {
                key: "bits",
                label: "Bits / Target",
                value: formatBits(header.bits),
                extra: `Difficulty: ${derived.difficulty}`,
            },
            {
                key: "nonce",
                label: "Nonce",
                value: typeof header.nonce === "number" ? `${header.nonce} (0x${header.nonce.toString(16)})` : "Unavailable",
                extra: "32-bit mining iteration field",
            },
            {
                key: "time",
                label: "Timestamp",
                value: new Date(header.time * 1000).toLocaleString(),
                extra: header.mediantime ? `Median Time: ${new Date(header.mediantime * 1000).toLocaleString()}` : undefined,
            },
            {
                key: "merkleroot",
                label: "Merkle Root",
                value: shortHash(header.merkleroot ?? computedMerkleRoot ?? undefined),
                extra:
                    derived.merkleMatch === null
                        ? "Header root unavailable from API"
                        : derived.merkleMatch
                            ? "Matches computed tx tree root"
                            : "Header root mismatch with computed tx tree",
                action: "open-merkle",
            },
            {
                key: "previousblockhash",
                label: "Previous Block Hash",
                value: shortHash(header.previousblockhash),
                extra: `Height #${header.height.toLocaleString()} commits to parent chainwork`,
            },
        ];

    return (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-cyan-300">Interactive Block Header Parser</h2>
                    <p className="text-xs text-slate-400">
                        Inspect consensus-critical header fields and derived metadata before diving into merkle proof paths.
                    </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                    <div className="text-slate-500">Header Hash</div>
                    <div className="font-mono">{shortHash(header.hash)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                    <button
                        type="button"
                        key={card.key}
                        onClick={() => {
                            setSelectedField(card.key);
                            if (card.action === "open-merkle") {
                                onOpenMerklePanel();
                            }
                        }}
                        className={`rounded-lg border p-3 text-left transition ${selectedField === card.key
                            ? "border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(6,182,212,0.25)]"
                            : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                            }`}
                    >
                        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{card.label}</div>
                        <div className="mt-1 break-all font-mono text-sm text-slate-100">{card.value}</div>
                        {card.extra ? <div className="mt-1 text-xs text-slate-400">{card.extra}</div> : null}
                    </button>
                ))}
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-500">Field Drill-Down</div>
                <div className="text-sm text-slate-200">{fieldDescriptions[selectedField]}</div>
                {selectedField === "bits" ? (
                    <div className="mt-3 rounded border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300">
                        <div>Target preview: <span className="font-mono text-cyan-300">{derived.targetPreview}</span></div>
                        <div className="mt-1">Difficulty: <span className="font-semibold text-emerald-300">{derived.difficulty}</span></div>
                    </div>
                ) : null}
                {selectedField === "merkleroot" ? (
                    <button
                        type="button"
                        onClick={onOpenMerklePanel}
                        className="mt-3 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                    >
                        Open Merkle Tree & Inclusion Path
                    </button>
                ) : null}
            </div>
        </section>
    );
}
