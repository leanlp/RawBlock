import assert from "node:assert/strict";
import { convertHashrateToEh, inferHashrateUnit, normalizeHashrateToEh } from "../lib/hashrate";

type UnitCase = {
  input: number;
  unit: "H/s" | "TH/s" | "PH/s" | "EH/s";
  expectedEh: number | null;
};

const unitCases: UnitCase[] = [
  { input: 8.25e20, unit: "H/s", expectedEh: 825 },
  { input: 8.25e8, unit: "TH/s", expectedEh: 825 },
  { input: 8.25e5, unit: "PH/s", expectedEh: 825 },
  { input: 825, unit: "EH/s", expectedEh: 825 },
  { input: 0, unit: "H/s", expectedEh: null },
  { input: -1000, unit: "TH/s", expectedEh: null },
  { input: Number.NaN, unit: "EH/s", expectedEh: null },
];

const inferenceCases = [
  { input: 9.9e19, expectedUnit: "H/s", expectedEh: 99 },
  { input: 9.9e11, expectedUnit: "TH/s", expectedEh: 990000 },
  { input: 9.9e5, expectedUnit: "PH/s", expectedEh: 990 },
  { input: 99, expectedUnit: "EH/s", expectedEh: 99 },
];

function runUnitConversionCases() {
  for (const testCase of unitCases) {
    const actual = convertHashrateToEh(testCase.input, testCase.unit);
    assert.equal(
      actual,
      testCase.expectedEh,
      `convertHashrateToEh(${testCase.input}, "${testCase.unit}") expected ${testCase.expectedEh}, got ${actual}`,
    );
  }
}

function runInferenceCases() {
  for (const testCase of inferenceCases) {
    const inferredUnit = inferHashrateUnit(testCase.input);
    assert.equal(
      inferredUnit,
      testCase.expectedUnit,
      `inferHashrateUnit(${testCase.input}) expected ${testCase.expectedUnit}, got ${inferredUnit}`,
    );

    const normalized = normalizeHashrateToEh(testCase.input);
    assert.equal(
      normalized,
      testCase.expectedEh,
      `normalizeHashrateToEh(${testCase.input}) expected ${testCase.expectedEh}, got ${normalized}`,
    );
  }
}

function runExplicitUnitOverrideCases() {
  const raw = 4.2e16;
  const inferred = normalizeHashrateToEh(raw);
  const explicit = normalizeHashrateToEh(raw, "TH/s");

  assert.equal(inferred, 0.042, "inferred conversion should treat 4.2e16 as H/s range");
  assert.equal(explicit, 42000000000, "explicit TH/s override should use deterministic divisor");
}

function main() {
  runUnitConversionCases();
  runInferenceCases();
  runExplicitUnitOverrideCases();
  console.log("Hashrate conversion tests passed.");
}

main();
