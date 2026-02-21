export type MerkleSiblingPosition = "left" | "right";

export interface MerkleProofStep {
    level: number;
    sibling: string;
    siblingPosition: MerkleSiblingPosition;
}

export interface MerkleProofResult {
    txid: string;
    txIndex: number;
    leafCount: number;
    root: string;
    path: MerkleProofStep[];
}

function assertHex32(value: string) {
    if (!/^[0-9a-fA-F]{64}$/.test(value)) {
        throw new Error(`Invalid txid/hash encountered: ${value}`);
    }
}

function hexToBytes(hex: string): Uint8Array {
    const clean = hex.trim().toLowerCase();
    if (clean.length % 2 !== 0 || !/^[0-9a-f]+$/.test(clean)) {
        throw new Error(`Invalid hex payload: ${hex}`);
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

function reverseBytes(bytes: Uint8Array): Uint8Array {
    const reversed = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) {
        reversed[i] = bytes[bytes.length - 1 - i];
    }
    return reversed;
}

function concatBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
    const out = new Uint8Array(left.length + right.length);
    out.set(left, 0);
    out.set(right, left.length);
    return out;
}

async function sha256(payload: Uint8Array): Promise<Uint8Array> {
    const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(payload).buffer);
    return new Uint8Array(digest);
}

async function sha256d(payload: Uint8Array): Promise<Uint8Array> {
    const first = await sha256(payload);
    return sha256(first);
}

function toInternalHash(hashHex: string): Uint8Array {
    assertHex32(hashHex);
    return reverseBytes(hexToBytes(hashHex));
}

function fromInternalHash(internal: Uint8Array): string {
    return bytesToHex(reverseBytes(internal));
}

export async function computeMerkleRoot(txids: string[]): Promise<string> {
    if (txids.length === 0) {
        throw new Error("Cannot build merkle root with zero txids");
    }

    let layer = txids.map(toInternalHash);
    while (layer.length > 1) {
        const working = [...layer];
        if (working.length % 2 !== 0) {
            working.push(working[working.length - 1]);
        }
        const nextLayer: Uint8Array[] = [];
        for (let i = 0; i < working.length; i += 2) {
            const parent = await sha256d(concatBytes(working[i], working[i + 1]));
            nextLayer.push(parent);
        }
        layer = nextLayer;
    }

    return fromInternalHash(layer[0]);
}

export async function buildMerkleProof(txids: string[], txIndex: number): Promise<MerkleProofResult> {
    if (txids.length === 0) {
        throw new Error("Cannot build proof without txids");
    }
    if (txIndex < 0 || txIndex >= txids.length) {
        throw new Error(`Transaction index out of range: ${txIndex}`);
    }

    const path: MerkleProofStep[] = [];
    let layer = txids.map(toInternalHash);
    let index = txIndex;
    let level = 0;

    while (layer.length > 1) {
        const working = [...layer];
        if (working.length % 2 !== 0) {
            working.push(working[working.length - 1]);
        }

        const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
        const sibling = working[siblingIndex];
        path.push({
            level,
            sibling: fromInternalHash(sibling),
            siblingPosition: index % 2 === 0 ? "right" : "left",
        });

        const nextLayer: Uint8Array[] = [];
        for (let i = 0; i < working.length; i += 2) {
            const parent = await sha256d(concatBytes(working[i], working[i + 1]));
            nextLayer.push(parent);
        }
        layer = nextLayer;
        index = Math.floor(index / 2);
        level += 1;
    }

    return {
        txid: txids[txIndex],
        txIndex,
        leafCount: txids.length,
        root: fromInternalHash(layer[0]),
        path,
    };
}
