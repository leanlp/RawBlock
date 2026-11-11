import assert from "node:assert/strict";
import {
    applyMempoolChange,
    parseMempoolRows,
    parseMempoolStreamFrame,
    parseSnapshotObservation,
    reconcileMempoolRows,
    type MempoolChange,
    type MempoolSnapshot,
} from "../lib/mempoolFeed";

const now = 1_790_000_000_000;
const seconds = now / 1000;
const addedTxid = "a1".repeat(32);
const removedTxid = "b2".repeat(32);
const replacementTxid = "c3".repeat(32);
const add = { seq: 1, type: "added", txid: addedTxid, timestamp: seconds, vsize: 100, feeBTC: 0.00000001 };
const remove = { seq: 2, type: "removed", txid: removedTxid, timestamp: seconds };

const publicRows = parseMempoolRows([{ txid: removedTxid, fee: 1, vsize: 105 }], "sat");
assert.deepEqual(publicRows, [{ txid: removedTxid, feeSats: 1, size: 105, time: null }]);
assert.equal(parseMempoolRows([{ txid: addedTxid, fee: 1.1, size: 100, time: 0 }], "btc")?.[0].feeSats, 110_000_000);
assert.deepEqual(parseMempoolRows([], "btc"), []);
assert.equal(parseMempoolRows([null, { txid: "not-a-txid" }], "btc"), null);
assert.equal(parseMempoolRows([{ txid: addedTxid, fee: null }], "btc")?.[0].feeSats, null);
assert.equal(parseMempoolRows([{ txid: addedTxid, fee: 1e300 }], "btc")?.[0].feeSats, null);
assert.equal(parseSnapshotObservation(null, now), null);
assert.equal(parseSnapshotObservation(new Date(now + 60_000).toISOString(), now), null);
assert.equal(parseSnapshotObservation(new Date(now - 1000).toISOString(), now), now - 1000);

const frame = (type: string, payload: unknown, receivedAt = now) =>
    parseMempoolStreamFrame(JSON.stringify({ type, payload }), receivedAt);

assert.equal(frame("tx:new", add), null);
assert.equal(frame("mempool:lifecycle", { ...add, seq: 0 }), null);
assert.equal(frame("mempool:lifecycle", { ...add, vsize: 0 }), null);
assert.equal(frame("mempool:lifecycle", { ...add, timestamp: seconds + 60 }), null);
assert.equal(frame("rbf:conflict", { txid: addedTxid, replacedTxid: removedTxid, feeDiff: 10 }), null);
assert.equal(frame("fee:regime", { timestamp: seconds - 200, txCount: 0 }), null);
assert.deepEqual(frame("fee:regime", { timestamp: seconds, txCount: 0 }), {
    kind: "heartbeat", observedAt: now, txCount: 0,
});

const changes = new Map<string, MempoolChange>();
const added = frame("mempool:lifecycle", add);
const removed = frame("mempool:lifecycle", remove);
assert.ok(added?.kind === "change" && removed?.kind === "change");
applyMempoolChange(changes, added.change);
applyMempoolChange(changes, removed.change);

const olderSnapshot: MempoolSnapshot = {
    rows: parseMempoolRows([{ txid: removedTxid, fee: 0.00003, size: 112, time: seconds - 100 }], "btc")!,
    source: "node",
    observedAt: now - 10_000,
};
assert.deepEqual(reconcileMempoolRows(olderSnapshot, changes).map(({ txid }) => txid), [addedTxid]);
assert.deepEqual(reconcileMempoolRows({ ...olderSnapshot, source: "public", observedAt: now + 2000 }, changes).map(({ txid }) => txid), [addedTxid]);
assert.deepEqual(reconcileMempoolRows({ rows: [], source: "node", observedAt: now + 2000 }, changes), []);
assert.deepEqual(reconcileMempoolRows({ ...olderSnapshot, observedAt: now + 2000 }, changes), []);

const replacement = frame("mempool:lifecycle", { ...remove, type: "replacement", replacedBy: replacementTxid });
assert.ok(replacement?.kind === "change");
assert.equal(replacement.change.replacedBy, replacementTxid);
assert.equal(replacement.change.transaction, null);

const readded = frame("mempool:lifecycle", { ...add, txid: removedTxid, seq: 3 });
assert.ok(readded?.kind === "change");
applyMempoolChange(changes, readded.change);
assert.equal(reconcileMempoolRows(olderSnapshot, changes).find(tx => tx.txid === removedTxid)?.feeSats, 1);

const busyChanges = new Map<string, MempoolChange>();
applyMempoolChange(busyChanges, removed.change, olderSnapshot);
let evictedAt: number | null = null;
for (let index = 0; index < 5000; index++) {
    evictedAt = applyMempoolChange(busyChanges, {
        ...removed.change,
        txid: index.toString(16).padStart(64, "0"),
        sequence: index + 3,
    }, olderSnapshot);
}
assert.equal(busyChanges.size, 5000, "stream reconciliation must keep its memory bound");
assert.equal(evictedAt, now, "snapshot reconciliation must know when the buffer lost a delta");
assert.equal(busyChanges.has(removedTxid), true, "overflow must preserve a removal that still masks the snapshot");
assert.deepEqual(reconcileMempoolRows(olderSnapshot, busyChanges), [], "busy streams must not resurrect removed snapshot rows");

console.log("Mempool feed contract and reconciliation checks passed");
