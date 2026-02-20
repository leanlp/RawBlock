"use client";

import { useMemo, useState } from "react";

const OPCODES: Record<number, string> = {
    0x00: "OP_0",
    0x4c: "OP_PUSHDATA1",
    0x4d: "OP_PUSHDATA2",
    0x4e: "OP_PUSHDATA4",
    0x4f: "OP_1NEGATE",
    0x51: "OP_1",
    0x52: "OP_2",
    0x53: "OP_3",
    0x54: "OP_4",
    0x55: "OP_5",
    0x56: "OP_6",
    0x57: "OP_7",
    0x58: "OP_8",
    0x59: "OP_9",
    0x5a: "OP_10",
    0x5b: "OP_11",
    0x5c: "OP_12",
    0x5d: "OP_13",
    0x5e: "OP_14",
    0x5f: "OP_15",
    0x60: "OP_16",
    0x63: "OP_IF",
    0x64: "OP_NOTIF",
    0x67: "OP_ELSE",
    0x68: "OP_ENDIF",
    0x69: "OP_VERIFY",
    0x6a: "OP_RETURN",
    0x73: "OP_IFDUP",
    0x74: "OP_DEPTH",
    0x75: "OP_DROP",
    0x76: "OP_DUP",
    0x77: "OP_NIP",
    0x78: "OP_OVER",
    0x79: "OP_PICK",
    0x7a: "OP_ROLL",
    0x82: "OP_SIZE",
    0x87: "OP_EQUAL",
    0x88: "OP_EQUALVERIFY",
    0x8b: "OP_1ADD",
    0x8c: "OP_1SUB",
    0x8f: "OP_NEGATE",
    0x90: "OP_ABS",
    0x93: "OP_ADD",
    0x94: "OP_SUB",
    0x9a: "OP_BOOLAND",
    0x9b: "OP_BOOLOR",
    0x9c: "OP_NUMEQUAL",
    0x9d: "OP_NUMEQUALVERIFY",
    0x9e: "OP_NUMNOTEQUAL",
    0xa6: "OP_RIPEMD160",
    0xa7: "OP_SHA1",
    0xa8: "OP_SHA256",
    0xa9: "OP_HASH160",
    0xaa: "OP_HASH256",
    0xab: "OP_CODESEPARATOR",
    0xac: "OP_CHECKSIG",
    0xad: "OP_CHECKSIGVERIFY",
    0xae: "OP_CHECKMULTISIG",
    0xaf: "OP_CHECKMULTISIGVERIFY",
    0xb0: "OP_NOP1",
    0xb1: "OP_CHECKLOCKTIMEVERIFY",
    0xb2: "OP_CHECKSEQUENCEVERIFY",
};

type SegmentKind =
    | "header"
    | "count"
    | "input"
    | "script"
    | "output"
    | "witness"
    | "locktime"
    | "error";

interface TxHexSegment {
    label: string;
    start: number;
    end: number;
    byteLength: number;
    hex: string;
    kind: SegmentKind;
    note?: string;
}

interface ParsedTxHex {
    segments: TxHexSegment[];
    isSegwit: boolean;
    parseError: string | null;
    byteLength: number;
}

interface TxInput {
    txid?: string;
    vout?: number;
    scriptSig?: { asm: string; hex: string };
    sequence: number;
    coinbase?: string;
    txinwitness?: string[];
    prevout?: {
        value?: number;
    };
}

interface TxOutput {
    value: number;
    n: number;
    scriptPubKey: { asm: string; hex: string; address?: string };
}

interface TxData {
    txid: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    fee?: number;
    hex?: string;
    vin: TxInput[];
    vout: TxOutput[];
}

interface TxHexWorkbenchProps {
    tx: TxData;
}

function hexToBytes(hex: string): Uint8Array {
    const clean = hex.trim().toLowerCase();
    if (!/^[0-9a-f]+$/.test(clean) || clean.length % 2 !== 0) {
        throw new Error("Invalid raw hex payload");
    }
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
        out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }
    return out;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function littleEndianToNumber(bytes: Uint8Array): number {
    let value = 0;
    for (let i = 0; i < bytes.length; i += 1) {
        value += bytes[i] * 2 ** (8 * i);
    }
    return value;
}

function parseVarInt(bytes: Uint8Array, offset: number): { value: number; size: number } {
    if (offset >= bytes.length) {
        throw new Error("Unexpected end while reading varint");
    }
    const first = bytes[offset];
    if (first < 0xfd) {
        return { value: first, size: 1 };
    }
    if (first === 0xfd) {
        if (offset + 3 > bytes.length) throw new Error("Unexpected end while reading varint(0xfd)");
        return { value: littleEndianToNumber(bytes.slice(offset + 1, offset + 3)), size: 3 };
    }
    if (first === 0xfe) {
        if (offset + 5 > bytes.length) throw new Error("Unexpected end while reading varint(0xfe)");
        return { value: littleEndianToNumber(bytes.slice(offset + 1, offset + 5)), size: 5 };
    }
    if (offset + 9 > bytes.length) throw new Error("Unexpected end while reading varint(0xff)");
    const value = littleEndianToNumber(bytes.slice(offset + 1, offset + 9));
    return { value, size: 9 };
}

function parseTransactionHex(rawHex?: string): ParsedTxHex | null {
    if (!rawHex || rawHex.trim().length === 0) return null;

    const bytes = hexToBytes(rawHex);
    const segments: TxHexSegment[] = [];
    let cursor = 0;
    let isSegwit = false;

    const pushSegment = (label: string, length: number, kind: SegmentKind, note?: string): Uint8Array => {
        const start = cursor;
        const end = cursor + length;
        if (end > bytes.length) {
            throw new Error(`Out-of-bounds segment for ${label}`);
        }
        const slice = bytes.slice(start, end);
        segments.push({
            label,
            start,
            end: length > 0 ? end - 1 : start,
            byteLength: length,
            hex: bytesToHex(slice),
            kind,
            note,
        });
        cursor = end;
        return slice;
    };

    const pushVarInt = (label: string, kind: SegmentKind, note?: string): number => {
        const parsed = parseVarInt(bytes, cursor);
        pushSegment(label, parsed.size, kind, note);
        return parsed.value;
    };

    try {
        pushSegment("version", 4, "header", "little-endian int32");

        if (cursor + 2 <= bytes.length && bytes[cursor] === 0x00 && bytes[cursor + 1] !== 0x00) {
            isSegwit = true;
            pushSegment("segwit.marker_flag", 2, "header", "marker=00, flag=01");
        }

        const vinCount = pushVarInt("vin.count", "count");
        for (let i = 0; i < vinCount; i += 1) {
            pushSegment(`vin[${i}].prev_txid`, 32, "input");
            pushSegment(`vin[${i}].prev_vout`, 4, "input");
            const scriptLen = pushVarInt(`vin[${i}].scriptSig.length`, "script");
            pushSegment(`vin[${i}].scriptSig`, scriptLen, "script");
            pushSegment(`vin[${i}].sequence`, 4, "input");
        }

        const voutCount = pushVarInt("vout.count", "count");
        for (let i = 0; i < voutCount; i += 1) {
            pushSegment(`vout[${i}].value`, 8, "output", "little-endian sats");
            const scriptLen = pushVarInt(`vout[${i}].scriptPubKey.length`, "script");
            pushSegment(`vout[${i}].scriptPubKey`, scriptLen, "script");
        }

        if (isSegwit) {
            for (let i = 0; i < vinCount; i += 1) {
                const stackItems = pushVarInt(`vin[${i}].witness.count`, "witness");
                for (let w = 0; w < stackItems; w += 1) {
                    const itemLen = pushVarInt(`vin[${i}].witness[${w}].length`, "witness");
                    pushSegment(`vin[${i}].witness[${w}]`, itemLen, "witness");
                }
            }
        }

        pushSegment("locktime", 4, "locktime");
        if (cursor < bytes.length) {
            pushSegment("trailing_bytes", bytes.length - cursor, "error", "Unexpected trailing bytes");
        }

        return {
            segments,
            isSegwit,
            parseError: null,
            byteLength: bytes.length,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to parse raw transaction hex";
        return {
            segments,
            isSegwit,
            parseError: message,
            byteLength: bytes.length,
        };
    }
}

function disassembleScript(scriptHex: string): string[] {
    if (!scriptHex || scriptHex.length === 0) return ["<empty script>"];
    const bytes = hexToBytes(scriptHex);
    const tokens: string[] = [];
    let cursor = 0;

    while (cursor < bytes.length) {
        const opcode = bytes[cursor];
        cursor += 1;

        if (opcode >= 0x01 && opcode <= 0x4b) {
            const pushLen = opcode;
            const pushData = bytes.slice(cursor, cursor + pushLen);
            tokens.push(`PUSHDATA(${pushLen}) ${bytesToHex(pushData)}`);
            cursor += pushLen;
            continue;
        }

        if (opcode === 0x4c || opcode === 0x4d || opcode === 0x4e) {
            const lengthBytes = opcode === 0x4c ? 1 : opcode === 0x4d ? 2 : 4;
            const sizeData = bytes.slice(cursor, cursor + lengthBytes);
            const pushLen = littleEndianToNumber(sizeData);
            cursor += lengthBytes;
            const pushData = bytes.slice(cursor, cursor + pushLen);
            tokens.push(`${OPCODES[opcode]}(${pushLen}) ${bytesToHex(pushData)}`);
            cursor += pushLen;
            continue;
        }

        tokens.push(OPCODES[opcode] ?? `0x${opcode.toString(16).padStart(2, "0")}`);
    }

    return tokens;
}

function classifyWitnessItem(itemHex: string): string {
    const bytes = itemHex.length / 2;
    if (/^30[0-9a-f]/i.test(itemHex) && bytes >= 70 && bytes <= 74) {
        return "DER signature";
    }
    if (/^(02|03)[0-9a-f]{64}$/i.test(itemHex)) {
        return "Compressed pubkey";
    }
    if (/^04[0-9a-f]{128}$/i.test(itemHex)) {
        return "Uncompressed pubkey";
    }
    if (bytes === 64 || bytes === 65) {
        return "Schnorr/compact signature";
    }
    return "Witness data";
}

type CheckStatus = "pass" | "warn" | "fail" | "info";

interface SanityCheck {
    label: string;
    status: CheckStatus;
    detail: string;
}

function checkStatusClasses(status: CheckStatus): string {
    if (status === "pass") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    if (status === "fail") return "border-red-500/40 bg-red-500/10 text-red-200";
    if (status === "warn") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    return "border-slate-700 bg-slate-900/50 text-slate-300";
}

function formatSegmentRange(segment: TxHexSegment): string {
    if (segment.byteLength === 0) {
        return `${segment.start} (0 bytes)`;
    }
    return `${segment.start}-${segment.end}`;
}

function buildSanityChecks(tx: TxData, parsed: ParsedTxHex | null): SanityCheck[] {
    const checks: SanityCheck[] = [];

    if (parsed) {
        if (parsed.byteLength === tx.size) {
            checks.push({
                label: "Serialized size",
                status: "pass",
                detail: `Hex bytes = ${parsed.byteLength} matches reported size = ${tx.size}`,
            });
        } else {
            checks.push({
                label: "Serialized size",
                status: "fail",
                detail: `Hex bytes = ${parsed.byteLength} but reported size = ${tx.size}`,
            });
        }
    } else {
        checks.push({
            label: "Serialized size",
            status: "info",
            detail: "Raw hex not available from backend.",
        });
    }

    const expectedVsize = Math.ceil(tx.weight / 4);
    if (expectedVsize === tx.vsize) {
        checks.push({
            label: "Weight/vsize",
            status: "pass",
            detail: `ceil(${tx.weight}/4) = ${expectedVsize} vB`,
        });
    } else {
        checks.push({
            label: "Weight/vsize",
            status: "warn",
            detail: `Expected vsize ${expectedVsize}, got ${tx.vsize}`,
        });
    }

    const witnessSeen = tx.vin.some((vin) => (vin.txinwitness?.length ?? 0) > 0);
    if (parsed) {
        checks.push({
            label: "SegWit marker/flag",
            status: witnessSeen === parsed.isSegwit ? "pass" : "warn",
            detail: `vin witness detected=${witnessSeen ? "yes" : "no"} | marker+flag=${parsed.isSegwit ? "yes" : "no"}`,
        });
    }

    const outputSats = tx.vout.reduce((sum, vout) => sum + Math.round(vout.value * 100_000_000), 0);
    const inputValues = tx.vin
        .map((vin) => vin.prevout?.value)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const inputSats = inputValues.length > 0 ? Math.round(inputValues.reduce((sum, value) => sum + value, 0)) : null;
    const explicitFee = typeof tx.fee === "number" && Number.isFinite(tx.fee) ? Math.round(tx.fee) : null;
    const derivedFee = inputSats !== null ? inputSats - outputSats : null;

    if (derivedFee !== null && explicitFee !== null) {
        const delta = Math.abs(derivedFee - explicitFee);
        checks.push({
            label: "Fee consistency",
            status: delta <= 2 ? "pass" : "warn",
            detail: `Derived fee=${derivedFee} sats | reported fee=${explicitFee} sats`,
        });
    } else if (derivedFee !== null) {
        checks.push({
            label: "Fee consistency",
            status: derivedFee >= 0 ? "pass" : "warn",
            detail: `Derived fee from prevouts=${derivedFee} sats`,
        });
    } else if (explicitFee !== null) {
        checks.push({
            label: "Fee consistency",
            status: explicitFee >= 0 ? "pass" : "warn",
            detail: `Reported fee=${explicitFee} sats (input prevout values unavailable)`,
        });
    } else {
        checks.push({
            label: "Fee consistency",
            status: "info",
            detail: "No fee or prevout data available to validate.",
        });
    }

    return checks;
}

export default function TxHexWorkbench({ tx }: TxHexWorkbenchProps) {
    const [viewMode, setViewMode] = useState<"split" | "human" | "raw">("split");
    const parsed = useMemo(() => parseTransactionHex(tx.hex), [tx.hex]);
    const checks = useMemo(() => buildSanityChecks(tx, parsed), [parsed, tx]);
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);

    const selectedSegment =
        parsed && parsed.segments.length > 0
            ? parsed.segments[Math.min(selectedSegmentIndex, parsed.segments.length - 1)]
            : null;

    const hasWitness = tx.vin.some((vin) => (vin.txinwitness?.length ?? 0) > 0);
    const humanColumn = (
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-300">Human Decode</h3>
                <div className="flex gap-2 text-[11px]">
                    <span className={`rounded-full px-2 py-0.5 ${hasWitness ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>
                        {hasWitness ? "SegWit tx" : "Legacy tx"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {checks.map((check) => (
                    <div key={check.label} className={`rounded border px-3 py-2 text-xs ${checkStatusClasses(check.status)}`}>
                        <div className="font-semibold">{check.label}</div>
                        <div className="mt-1 opacity-90">{check.detail}</div>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-500">Inputs ({tx.vin.length})</div>
                {tx.vin.map((vin, index) => (
                    <div key={`vin-${index}`} className="rounded border border-slate-800 bg-slate-900/60 p-3 text-xs">
                        <div className="mb-1 text-slate-400">#{index} {vin.coinbase ? "(coinbase)" : ""}</div>
                        {!vin.coinbase ? (
                            <>
                                <div className="font-mono text-cyan-300 break-all">{vin.txid}:{vin.vout}</div>
                                <div className="mt-2 text-slate-500">scriptSig disassembly:</div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {disassembleScript(vin.scriptSig?.hex ?? "").slice(0, 12).map((token) => (
                                        <span key={`${index}-${token}`} className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                                            {token}
                                        </span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="break-all font-mono text-amber-300">{vin.coinbase}</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-500">Outputs ({tx.vout.length})</div>
                {tx.vout.map((vout) => (
                    <div key={`vout-${vout.n}`} className="rounded border border-slate-800 bg-slate-900/60 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-slate-400">#{vout.n}</div>
                            <div className="font-semibold text-emerald-300">{vout.value.toFixed(8)} BTC</div>
                        </div>
                        <div className="mt-1 break-all font-mono text-cyan-300">{vout.scriptPubKey.address ?? "Non-standard output"}</div>
                        <div className="mt-2 text-slate-500">scriptPubKey disassembly:</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {disassembleScript(vout.scriptPubKey.hex).slice(0, 12).map((token) => (
                                <span key={`${vout.n}-${token}`} className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                                    {token}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {hasWitness ? (
                <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.15em] text-slate-500">Witness Breakdown</div>
                    {tx.vin.map((vin, index) => (
                        <div key={`witness-${index}`} className="rounded border border-slate-800 bg-slate-900/60 p-3 text-xs">
                            <div className="mb-2 text-slate-400">Input #{index}</div>
                            {(vin.txinwitness ?? []).length === 0 ? (
                                <div className="text-slate-500">No witness stack items.</div>
                            ) : (
                                <div className="space-y-2">
                                    {(vin.txinwitness ?? []).map((item, wIndex) => (
                                        <div key={`w-${index}-${wIndex}`} className="rounded border border-slate-800 bg-slate-950/60 p-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
                                                <span>Item #{wIndex}</span>
                                                <span>{item.length / 2} bytes · {classifyWitnessItem(item)}</span>
                                            </div>
                                            <div className="mt-1 break-all font-mono text-cyan-300">{item}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );

    const rawColumn = (
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-violet-300">Raw Hex Segments</h3>
            {!parsed ? (
                <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                    Raw hex is unavailable in this response. Decode using txid with live backend or fallback mode to inspect byte segmentation.
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded border border-slate-700 px-2 py-0.5 text-slate-300">{parsed.byteLength} bytes</span>
                        <span className={`rounded border px-2 py-0.5 ${parsed.isSegwit ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-slate-700 text-slate-300"}`}>
                            marker+flag {parsed.isSegwit ? "present" : "absent"}
                        </span>
                        {parsed.parseError ? (
                            <span className="rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-red-200">{parsed.parseError}</span>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-[78px_1fr] gap-1 rounded border border-slate-800 bg-slate-900/60 p-2 text-[11px]">
                        {parsed.segments.map((segment, index) => {
                            const active = index === selectedSegmentIndex;
                            const range = formatSegmentRange(segment);
                            return (
                                <button
                                    key={`${segment.label}-${segment.start}`}
                                    type="button"
                                    onClick={() => setSelectedSegmentIndex(index)}
                                    className={`contents text-left ${active ? "font-semibold" : ""}`}
                                >
                                    <span
                                        className={`rounded px-2 py-1 font-mono ${active
                                            ? "bg-cyan-500/20 text-cyan-200"
                                            : "bg-slate-950/60 text-slate-400"
                                            }`}
                                    >
                                        {range}
                                    </span>
                                    <span
                                        className={`rounded px-2 py-1 ${active
                                            ? "bg-cyan-500/15 text-cyan-100"
                                            : segment.label.includes("marker_flag")
                                                ? "bg-amber-500/10 text-amber-200"
                                                : "bg-slate-950/40 text-slate-300"
                                            }`}
                                    >
                                        {segment.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedSegment ? (
                        <div className="rounded border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-xs text-slate-500">Selected segment</div>
                            <div className="font-semibold text-cyan-200">{selectedSegment.label}</div>
                            <div className="mt-2 text-xs text-slate-400">offset {formatSegmentRange(selectedSegment)}</div>
                            {selectedSegment.note ? <div className="mt-1 text-xs text-slate-400">{selectedSegment.note}</div> : null}
                            <div className="mt-2 max-h-32 overflow-y-auto break-all rounded border border-slate-800 bg-slate-950/70 p-2 font-mono text-[11px] text-violet-200">
                                {selectedSegment.hex || "<empty>"}
                            </div>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );

    return (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold text-cyan-300">Deep Transaction Hex Decoder</h2>
                    <p className="text-xs text-slate-400">
                        Human-readable interpretation and byte-level serialization mapped side-by-side.
                    </p>
                </div>
                <div className="flex gap-2">
                    {(["split", "human", "raw"] as const).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setViewMode(mode)}
                            className={`rounded border px-3 py-2 text-xs uppercase tracking-[0.15em] ${viewMode === mode
                                ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-200"
                                : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-600"
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {viewMode === "human" ? (
                humanColumn
            ) : viewMode === "raw" ? (
                rawColumn
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {humanColumn}
                    {rawColumn}
                </div>
            )}
        </section>
    );
}
