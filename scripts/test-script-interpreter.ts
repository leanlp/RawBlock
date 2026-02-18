import assert from "node:assert/strict";
import { OpcodeEngine } from "../components/script-lab/OpcodeEngine";

type Scenario = {
  name: string;
  script: string;
  expectedTop: string;
  expectedError: string | null;
  requiresTruthyTop: boolean;
};

const scenarios: Scenario[] = [
  {
    name: "Addition",
    script: "OP_1 OP_1 OP_ADD OP_2 OP_EQUAL",
    expectedTop: "1",
    expectedError: null,
    requiresTruthyTop: true,
  },
  {
    name: "If-Else Logic",
    script: "OP_1 OP_IF OP_10 OP_ELSE OP_20 OP_ENDIF",
    expectedTop: "10",
    expectedError: null,
    requiresTruthyTop: true,
  },
  {
    name: "P2PKH Valid (Mocked CHECKSIG)",
    script:
      "deadbeef 0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798 OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG",
    expectedTop: "1",
    expectedError: null,
    requiresTruthyTop: true,
  },
  {
    name: "Hash mismatch",
    script: "deadbeef OP_SHA256 badf00d OP_SHA256 OP_EQUAL",
    expectedTop: "0",
    expectedError: null,
    requiresTruthyTop: false,
  },
  {
    name: "Unknown opcode",
    script: "OP_1 OP_MAGIC",
    expectedTop: "1",
    expectedError: "Unknown Opcode: OP_MAGIC",
    requiresTruthyTop: false,
  },
];

async function runScript(script: string) {
  let state = OpcodeEngine.initialState(script);
  let guard = 0;
  while (!state.completed && !state.error && guard < 5000) {
    state = await OpcodeEngine.step(state);
    guard += 1;
  }
  return state;
}

async function run() {
  for (const scenario of scenarios) {
    const finalState = await runScript(scenario.script);
    const finalTop = finalState.stack.at(-1) ?? null;

    if (scenario.expectedError) {
      assert.equal(
        finalState.error,
        scenario.expectedError,
        `[${scenario.name}] expected error ${scenario.expectedError}, got ${finalState.error}`,
      );
      continue;
    }

    assert.equal(finalState.error, null, `[${scenario.name}] unexpected error: ${finalState.error}`);
    assert.equal(
      finalTop,
      scenario.expectedTop,
      `[${scenario.name}] expected top ${scenario.expectedTop}, got ${finalTop}`,
    );

    if (scenario.requiresTruthyTop) {
      assert.equal(
        finalTop !== null ? OpcodeEngine.toBool(finalTop) : false,
        true,
        `[${scenario.name}] expected truthy top item`,
      );
    }
  }

  console.log("Script interpreter scenarios passed.");
}

void run();
