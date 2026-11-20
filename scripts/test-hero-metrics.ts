import assert from "node:assert/strict";
import {
  displayableHeroReading,
  isHeroReadingFresh,
  mergeHeroCore,
  NETWORK_FRESH_MS,
  updateHeroReading,
  type HeroCoreMetrics,
  type HeroReading,
} from "../lib/heroMetrics";
import {
  parseHeroHistory,
  parseHeroNetworkStats,
  parseHeroRecent,
  parseHeroVitals,
} from "../lib/heroMetrics.server";
import { alignHistoryWithCurrent } from "../hooks/useFeeMarketData";

const now = Date.parse("2026-11-11T02:00:00Z");
const reading: HeroReading<number> = {
  value: 975_371,
  source: "node",
  observedAt: now - 5_000,
  retrievedAt: now - 2_000,
  fromDisk: false,
};

assert.equal(isHeroReadingFresh(reading, now, NETWORK_FRESH_MS), true);
assert.equal(isHeroReadingFresh({ ...reading, observedAt: null }, now, NETWORK_FRESH_MS), false);
assert.equal(isHeroReadingFresh({ ...reading, fromDisk: true }, now, NETWORK_FRESH_MS), false);
assert.equal(isHeroReadingFresh({ ...reading, lastKnown: true }, now, NETWORK_FRESH_MS), false);
assert.equal(displayableHeroReading({ ...reading, observedAt: now - 301_000 }, now), null);
assert.equal(displayableHeroReading({ ...reading, observedAt: null, retrievedAt: now - 301_000 }, now), null);

const retained = updateHeroReading(reading, null, now);
assert.equal(retained?.value, 975_371);
assert.equal(retained?.observedAt, reading.observedAt);
assert.equal(retained?.lastKnown, true);
assert.equal(updateHeroReading(reading, { ...reading, value: 975_370, observedAt: now - 10_000 }, now)?.value, 975_371);
assert.equal(updateHeroReading(reading, { ...reading, value: 975_372, observedAt: now }, now)?.value, 975_372);

const empty: HeroReading<[]> = { ...reading, value: [] };
assert.deepEqual(updateHeroReading(null, empty, now)?.value, []);
const zero: HeroReading<number> = { ...reading, value: 0 };
assert.equal(updateHeroReading(null, zero, now)?.value, 0);

const prior: HeroCoreMetrics = { height: reading, hashrate: null, fees: null, mempool: null, checkedAt: now };
const incoming: HeroCoreMetrics = { height: null, hashrate: { ...reading, value: 954 }, fees: null, mempool: null, checkedAt: now };
const merged = mergeHeroCore(prior, incoming);
assert.equal(merged.height?.lastKnown, true);
assert.equal(merged.height?.observedAt, reading.observedAt);
assert.equal(merged.hashrate?.value, 954);

assert.equal(parseHeroNetworkStats({ height: null }), null);
assert.equal(parseHeroNetworkStats({ height: "" }), null);
assert.equal(parseHeroNetworkStats({ height: -1 }), null);
assert.equal(parseHeroNetworkStats({ height: 975_371 })?.height, 975_371);
assert.equal(parseHeroNetworkStats({ height: 0 })?.height, 0);
assert.deepEqual(parseHeroVitals({ mempool: { size: 0, bytes: 0 } }), { count: 0, vsizeMb: 0 });
assert.equal(parseHeroVitals({ mempool: { size: null, bytes: null } }), null);
assert.deepEqual(parseHeroRecent([]), []);
assert.equal(parseHeroRecent({ txid: "a".repeat(64) }), null);
assert.equal(parseHeroRecent([{ txid: "a".repeat(60) }]), null);
const transactions = parseHeroRecent([{ txid: "a".repeat(64), fee: 0.00000001, size: 100 }]);
assert.equal(transactions?.[0]?.feeSat, 1);
assert.equal(transactions?.[0]?.feeRate, 0.01);
assert.equal(transactions?.[0]?.time, null);
assert.equal(parseHeroRecent([{ txid: "b".repeat(64), fee: Number.MAX_SAFE_INTEGER }])?.[0]?.feeSat, null);
assert.deepEqual(parseHeroHistory([]), []);
assert.equal(parseHeroHistory([{ timestamp: now, fast: 1, medium: 1 }]), null);
assert.deepEqual(parseHeroHistory([
  { timestamp: now, fast: 1, medium: 0.5, slow: 0 },
  { timestamp: now, fast: 2, medium: 1, slow: 0 },
]), [{ timestamp: now, fast: 2, medium: 1, slow: 0 }]);

const history = [{ timestamp: now - 300_000, fast: 4, medium: 2, slow: 1 }];
const fees = { fast: 4, medium: 2, slow: 1 };
assert.deepEqual(alignHistoryWithCurrent(history, fees, null), history);
assert.deepEqual(alignHistoryWithCurrent(history, null, now), history);
assert.deepEqual(alignHistoryWithCurrent(history, fees, now - 400_000), history);
assert.equal(alignHistoryWithCurrent(history, fees, now).at(-1)?.timestamp, now);
assert.deepEqual(alignHistoryWithCurrent([], null, null), []);

console.log("Hero metrics regression checks passed.");
