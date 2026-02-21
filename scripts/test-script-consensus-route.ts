import assert from "node:assert/strict";
import { GET, POST } from "../app/api/bitcoin/script-consensus/route";
import { SCRIPT_CONSENSUS_FIXTURES } from "../lib/scriptConsensusFixtures";

async function run() {
  const getResponse = await GET();
  assert.equal(getResponse.status, 200, "GET /script-consensus should return 200");
  const getPayload = (await getResponse.json()) as {
    ok: boolean;
    supportedFlags?: string[];
    opcodes?: Array<{ name: string; code: number; status: string }>;
  };
  assert.equal(getPayload.ok, true, "GET payload should be ok");
  assert.ok(
    Array.isArray(getPayload.supportedFlags) && getPayload.supportedFlags.length > 0,
    "GET payload should expose verification flags",
  );
  assert.ok(
    Array.isArray(getPayload.opcodes) && getPayload.opcodes.length >= 100,
    "GET payload should expose full opcode catalog",
  );

  const verifyRequest = new Request("http://localhost/api/bitcoin/script-consensus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scriptSig: "OP_1",
      scriptPubKey: "OP_1 OP_EQUAL",
    }),
  });
  const verifyResponse = await POST(verifyRequest);
  assert.equal(verifyResponse.status, 200, "Verify request should return 200");
  const verifyPayload = (await verifyResponse.json()) as {
    ok: boolean;
    result?: { verified: boolean; stackTopHex: string | null };
  };
  assert.equal(verifyPayload.ok, true, "Verify payload should be ok");
  assert.equal(verifyPayload.result?.verified, true, "Simple OP_EQUAL script should verify");
  assert.equal(verifyPayload.result?.stackTopHex, "01", "Verify top stack item should be true");

  const traceRequest = new Request("http://localhost/api/bitcoin/script-consensus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "trace",
      script: "OP_1 OP_1 OP_EQUAL",
      maxSteps: 20,
    }),
  });
  const traceResponse = await POST(traceRequest);
  assert.equal(traceResponse.status, 200, "Trace request should return 200");
  const tracePayload = (await traceResponse.json()) as {
    ok: boolean;
    result?: { completed: boolean; steps: number; stackTopHex: string | null; topTruthy: boolean };
  };
  assert.equal(tracePayload.ok, true, "Trace payload should be ok");
  assert.equal(tracePayload.result?.completed, true, "Trace should complete");
  assert.equal(tracePayload.result?.steps, 3, "Trace should execute expected steps");
  assert.equal(tracePayload.result?.stackTopHex, "01", "Trace top stack item should be true");
  assert.equal(tracePayload.result?.topTruthy, true, "Trace top should be truthy");

  for (const fixture of SCRIPT_CONSENSUS_FIXTURES) {
    const fixtureRequest = new Request("http://localhost/api/bitcoin/script-consensus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scriptSig: fixture.scriptSig,
        scriptPubKey: fixture.scriptPubKey,
        scriptSigFormat: fixture.scriptSigFormat,
        scriptPubKeyFormat: fixture.scriptPubKeyFormat,
        txHex: fixture.txHex,
        inputIndex: fixture.inputIndex,
        satoshis: fixture.satoshis,
        witness: fixture.witness,
      }),
    });
    const fixtureResponse = await POST(fixtureRequest);
    assert.equal(fixtureResponse.status, 200, `[${fixture.id}] expected 200 response`);
    const fixturePayload = (await fixtureResponse.json()) as {
      ok: boolean;
      result?: { verified: boolean; error: string | null };
      error?: string;
    };
    assert.equal(fixturePayload.ok, true, `[${fixture.id}] payload should be ok`);
    assert.equal(
      fixturePayload.result?.verified,
      fixture.expectedVerified,
      `[${fixture.id}] verified mismatch`,
    );
    if (fixture.expectedError) {
      assert.equal(
        fixturePayload.result?.error,
        fixture.expectedError,
        `[${fixture.id}] expected error mismatch`,
      );
    }
  }

  const invalidWitnessRequest = new Request("http://localhost/api/bitcoin/script-consensus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scriptSig: "OP_1",
      scriptPubKey: "OP_1 OP_EQUAL",
      witness: ["zzzz"],
    }),
  });
  const invalidWitnessResponse = await POST(invalidWitnessRequest);
  assert.equal(invalidWitnessResponse.status, 400, "Invalid witness hex should fail with 400");

  console.log("Script consensus route checks passed.");
}

void run();
