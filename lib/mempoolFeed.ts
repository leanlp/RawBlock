export const MEMPOOL_STREAM_LEASE_MS = 100_000;

const FUTURE_SKEW_MS = 30_000;
const MAX_ROWS = 500;
const MAX_CHANGES = 5_000;
const TOMBSTONE_RETENTION_MS = 5 * 60_000;
const SATS_PER_BTC = 100_000_000;

export type MempoolTransaction = {
    txid: string;
    feeSats: number | null;
    size: number | null;
    time: number | null;
};

export type MempoolSnapshot = {
    rows: MempoolTransaction[];
    source: "node" | "public" | "unknown";
    observedAt: number | null;
};

export type MempoolChange = {
    txid: string;
    sequence: number;
    observedAt: number;
    transaction: MempoolTransaction | null;
    replacedBy: string | null;
};

type StreamFrame =
    | { kind: "heartbeat"; observedAt: number; txCount: number }
    | { kind: "change"; observedAt: number; change: MempoolChange };

function asObject(value: unknown): Record<string, unknown> | null {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

function txidFrom(value: unknown): string | null {
    return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
}

function integerFrom(value: unknown, minimum = 0): number | null {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum ? value : null;
}

function feeToSats(value: unknown, unit: "btc" | "sat"): number | null {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
    return integerFrom(unit === "btc" ? Math.round(value * SATS_PER_BTC) : value);
}

function unixMillis(value: unknown): number | null {
    const seconds = integerFrom(value, 1);
    return seconds !== null && seconds <= 8_640_000_000_000 ? seconds * 1000 : null;
}

export function parseSnapshotObservation(value: string | null, receivedAt: number): number | null {
    if (!value) return null;
    const observedAt = Date.parse(value);
    return Number.isFinite(observedAt) && observedAt <= receivedAt + FUTURE_SKEW_MS ? observedAt : null;
}

export function parseMempoolRows(body: unknown, feeUnit: "btc" | "sat"): MempoolTransaction[] | null {
    if (!Array.isArray(body)) return null;
    const transactions = new Map<string, MempoolTransaction>();

    for (const value of body) {
        const row = asObject(value);
        const txid = txidFrom(row?.txid);
        if (!row || !txid || transactions.has(txid)) continue;
        transactions.set(txid, {
            txid,
            feeSats: feeToSats(row.fee, feeUnit),
            size: integerFrom(feeUnit === "btc" ? row.size : row.vsize, 1),
            time: unixMillis(row.time),
        });
        if (transactions.size >= MAX_ROWS) break;
    }

    // An empty result is valid. A nonempty payload of invalid rows is a failure.
    return body.length > 0 && transactions.size === 0 ? null : [...transactions.values()];
}

export function parseMempoolStreamFrame(data: unknown, receivedAt: number): StreamFrame | null {
    if (typeof data !== "string") return null;
    let envelope: Record<string, unknown> | null;
    try {
        envelope = asObject(JSON.parse(data));
    } catch {
        return null;
    }

    const payload = asObject(envelope?.payload);
    const observedAt = unixMillis(payload?.timestamp);
    if (!payload || observedAt === null || observedAt > receivedAt + FUTURE_SKEW_MS
        || receivedAt - observedAt >= MEMPOOL_STREAM_LEASE_MS) return null;

    if (envelope?.type === "fee:regime") {
        const txCount = integerFrom(payload.txCount);
        return txCount === null ? null : { kind: "heartbeat", observedAt, txCount };
    }

    if (envelope?.type !== "mempool:lifecycle") return null;
    const sequence = integerFrom(payload.seq, 1);
    const txid = txidFrom(payload.txid);
    if (sequence === null || txid === null) return null;

    if (payload.type === "added") {
        const feeSats = feeToSats(payload.feeBTC, "btc");
        const size = integerFrom(payload.vsize, 1);
        if (feeSats === null || size === null) return null;
        const time = unixMillis(payload.firstSeen);
        const transaction = { txid, feeSats, size, time: time !== null && time <= observedAt ? time : null };
        return { kind: "change", observedAt, change: { txid, sequence, observedAt, transaction, replacedBy: null } };
    }

    if (payload.type !== "removed" && payload.type !== "confirmed" && payload.type !== "replacement") return null;
    const replacedBy = payload.type === "replacement" ? txidFrom(payload.replacedBy) : null;
    return { kind: "change", observedAt, change: { txid, sequence, observedAt, transaction: null, replacedBy } };
}

export function applyMempoolChange(
    changes: Map<string, MempoolChange>,
    change: MempoolChange,
    snapshot: MempoolSnapshot | null = null,
): number | null {
    changes.delete(change.txid);
    changes.set(change.txid, change);
    if (changes.size > MAX_CHANGES) {
        // A delta masking a row in the current base must survive eviction.
        // The base contains at most MAX_ROWS, leaving bounded eviction capacity.
        const snapshotTxids = new Set(snapshot?.rows.slice(0, MAX_ROWS).map(tx => tx.txid));
        for (const [txid, evicted] of changes) {
            if (snapshotTxids.has(txid)) continue;
            changes.delete(txid);
            return evicted.observedAt;
        }
    }
    return null;
}

export function reconcileMempoolRows(
    snapshot: MempoolSnapshot | null,
    changes: Map<string, MempoolChange>,
): MempoolTransaction[] {
    const rows = new Map(snapshot?.rows.map((tx) => [tx.txid, tx]));
    for (const [txid, change] of changes) {
        // Tracker timestamps have one-second precision. Only retire an overlay
        // when a later local capture agrees with it or supersedes an addition.
        const localObservedAt = snapshot?.source === "node" ? snapshot.observedAt : null;
        const localCaptureAfterChange = localObservedAt !== null && localObservedAt >= change.observedAt + 1000;
        const acknowledgedRemoval = localCaptureAfterChange && !rows.has(txid)
            && localObservedAt - change.observedAt > TOMBSTONE_RETENTION_MS;
        if (localCaptureAfterChange && (change.transaction !== null || acknowledgedRemoval)) {
            changes.delete(txid);
            continue;
        }
        if (change.transaction) rows.set(txid, change.transaction);
        else rows.delete(txid);
    }

    return [...rows.values()].sort((a, b) => (b.time ?? 0) - (a.time ?? 0)).slice(0, MAX_ROWS);
}
