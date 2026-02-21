import { NextResponse } from "next/server";
import { createRequire } from "node:module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);

type ScriptFormat = "asm" | "hex" | "auto";
type VerifyMode = "verify" | "trace";

type VerifyPayload = {
  mode?: VerifyMode;
  script?: string;
  scriptFormat?: ScriptFormat;
  scriptSig?: string;
  scriptPubKey?: string;
  scriptSigFormat?: ScriptFormat;
  scriptPubKeyFormat?: ScriptFormat;
  txHex?: string;
  inputIndex?: number;
  satoshis?: number;
  witness?: string[];
  initialStack?: string[];
  flags?: string[];
  maxSteps?: number;
};

type ScriptChunk = {
  opcodenum: number;
  buf?: Buffer;
};

type ScriptLike = {
  chunks: ScriptChunk[];
  add: (chunk: string | Buffer | ScriptLike) => ScriptLike;
};

type TransactionInputLike = {
  output?: unknown;
};

type TransactionLike = {
  inputs?: TransactionInputLike[];
};

type InterpreterLike = {
  verify: (
    scriptSig: unknown,
    scriptPubKey: unknown,
    tx: unknown,
    inputIndex: number,
    flags: number,
    witness: Buffer[] | null,
    satoshis: number,
  ) => boolean;
  set: (state: {
    script: ScriptLike;
    tx: unknown;
    nin: number;
    flags: number;
    stack: Buffer[];
    altstack: Buffer[];
    sigversion: number;
    satoshis: number;
  }) => void;
  step: () => boolean;
  errstr: string;
  stack: Buffer[];
  altstack: Buffer[];
  pc: number;
};

type BitcoreLike = {
  Script: {
    fromASM: (script: string) => ScriptLike;
    fromHex: (script: string) => ScriptLike;
    empty: () => ScriptLike;
    Interpreter: new () => InterpreterLike;
  };
  Transaction: {
    new (hex?: string): TransactionLike;
    Output: new (args: { script: unknown; satoshis: number }) => unknown;
  };
  Opcode: {
    map: Record<string, number>;
    reverseMap: Record<number, string>;
  };
  crypto: {
    Signature: {
      Version: {
        BASE: number;
      };
    };
  };
};

type FlagEntry = {
  key: string;
  mask: number;
};

type OpcodeEntry = {
  name: string;
  code: number;
  status: "enabled" | "disabled" | "reserved";
};

const DISABLED_OPCODES = new Set([
  "OP_VERIF",
  "OP_VERNOTIF",
  "OP_CAT",
  "OP_SUBSTR",
  "OP_LEFT",
  "OP_RIGHT",
  "OP_INVERT",
  "OP_AND",
  "OP_OR",
  "OP_XOR",
  "OP_2MUL",
  "OP_2DIV",
  "OP_MUL",
  "OP_DIV",
  "OP_MOD",
  "OP_LSHIFT",
  "OP_RSHIFT",
]);

const RESERVED_OPCODES = new Set(["OP_RESERVED", "OP_RESERVED1", "OP_RESERVED2", "OP_VER"]);

function isHex(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0;
}

function parseAsmScript(bitcore: BitcoreLike, scriptText: string): ScriptLike {
  const script = bitcore.Script.empty();
  const tokens = scriptText
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);

  for (const token of tokens) {
    if (token === "0") {
      script.add("OP_0");
      continue;
    }
    if (token === "-1") {
      script.add("OP_1NEGATE");
      continue;
    }
    if (/^\d+$/.test(token)) {
      const smallInt = Number.parseInt(token, 10);
      if (smallInt >= 1 && smallInt <= 16) {
        script.add(`OP_${smallInt}`);
        continue;
      }
    }
    if (Object.prototype.hasOwnProperty.call(bitcore.Opcode.map, token)) {
      script.add(token);
      continue;
    }
    if (isHex(token)) {
      script.add(Buffer.from(token, "hex"));
      continue;
    }
    throw new Error(`Invalid ASM token: ${token}`);
  }

  return script;
}

function toScript(bitcore: BitcoreLike, scriptText: string, format: ScriptFormat): ScriptLike {
  const normalized = scriptText.trim();
  if (normalized.length === 0) {
    return bitcore.Script.empty();
  }

  const effectiveFormat = format === "auto" ? (isHex(normalized) ? "hex" : "asm") : format;

  if (effectiveFormat === "hex") {
    if (!isHex(normalized)) {
      throw new Error("Hex script format selected but script contains non-hex content.");
    }
    return bitcore.Script.fromHex(normalized);
  }

  return parseAsmScript(bitcore, normalized);
}

function toHexBuffers(items: string[] | undefined, label: string): Buffer[] {
  if (!items || items.length === 0) return [];
  return items.map((entry) => {
    const normalized = entry.trim();
    if (normalized.length === 0 || normalized.toUpperCase() === "EMPTY") {
      return Buffer.alloc(0);
    }
    if (!isHex(normalized)) {
      throw new Error(`${label} item is not valid hex: ${entry}`);
    }
    return Buffer.from(normalized, "hex");
  });
}

async function loadBitcore(): Promise<BitcoreLike> {
  const globalScope = globalThis as typeof globalThis & {
    __rawblockBitcore?: BitcoreLike;
    _bitcore?: string;
  };
  if (globalScope.__rawblockBitcore) {
    return globalScope.__rawblockBitcore;
  }

  // bitcore-lib sets/guards global._bitcore; in Next dev this can throw on module reload.
  if (globalScope._bitcore) {
    delete globalScope._bitcore;
  }

  const imported = require("bitcore-lib") as unknown;
  const bitcore = ((imported as { default?: unknown }).default ?? imported) as BitcoreLike;
  if (!bitcore.Script?.Interpreter) {
    throw new Error("bitcore-lib interpreter not available");
  }
  globalScope.__rawblockBitcore = bitcore;
  return bitcore;
}

function buildFlagEntries(bitcore: BitcoreLike): FlagEntry[] {
  const names = [
    "SCRIPT_VERIFY_P2SH",
    "SCRIPT_VERIFY_STRICTENC",
    "SCRIPT_VERIFY_DERSIG",
    "SCRIPT_VERIFY_LOW_S",
    "SCRIPT_VERIFY_NULLDUMMY",
    "SCRIPT_VERIFY_SIGPUSHONLY",
    "SCRIPT_VERIFY_MINIMALDATA",
    "SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS",
    "SCRIPT_VERIFY_CLEANSTACK",
    "SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY",
    "SCRIPT_VERIFY_CHECKSEQUENCEVERIFY",
    "SCRIPT_VERIFY_WITNESS",
    "SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM",
    "SCRIPT_VERIFY_MINIMALIF",
    "SCRIPT_VERIFY_NULLFAIL",
    "SCRIPT_VERIFY_WITNESS_PUBKEYTYPE",
    "SCRIPT_VERIFY_CONST_SCRIPTCODE",
    "SCRIPT_VERIFY_TAPROOT",
    "SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_TAPROOT_VERSION",
    "SCRIPT_VERIFY_DISCOURAGE_OP_SUCCESS",
    "SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_PUBKEYTYPE",
  ] as const;

  return names
    .map((name) => ({
      key: name,
      mask: Number((bitcore.Script.Interpreter as unknown as Record<string, number>)[name] ?? 0),
    }))
    .filter((entry) => Number.isFinite(entry.mask) && entry.mask > 0);
}

function buildFlagMask(bitcore: BitcoreLike, selectedFlags: string[] | undefined): { mask: number; names: string[] } {
  const entries = buildFlagEntries(bitcore);
  if (!selectedFlags || selectedFlags.length === 0) {
    const defaults = [
      "SCRIPT_VERIFY_P2SH",
      "SCRIPT_VERIFY_STRICTENC",
      "SCRIPT_VERIFY_DERSIG",
      "SCRIPT_VERIFY_LOW_S",
      "SCRIPT_VERIFY_NULLDUMMY",
      "SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY",
      "SCRIPT_VERIFY_CHECKSEQUENCEVERIFY",
      "SCRIPT_VERIFY_WITNESS",
      "SCRIPT_VERIFY_MINIMALIF",
      "SCRIPT_VERIFY_NULLFAIL",
      "SCRIPT_VERIFY_WITNESS_PUBKEYTYPE",
      "SCRIPT_VERIFY_TAPROOT",
    ];
    const defaultMask = defaults.reduce((acc, key) => {
      const hit = entries.find((entry) => entry.key === key);
      return acc | (hit?.mask ?? 0);
    }, 0);
    return { mask: defaultMask, names: defaults };
  }

  const selected = new Set(selectedFlags);
  const mask = entries.reduce((acc, entry) => (selected.has(entry.key) ? acc | entry.mask : acc), 0);
  return { mask, names: [...selected] };
}

function buildOpcodeEntries(bitcore: BitcoreLike): OpcodeEntry[] {
  return Object.entries(bitcore.Opcode.map)
    .filter(([name]) => name.startsWith("OP_"))
    .map(([name, code]) => {
      let status: OpcodeEntry["status"] = "enabled";
      if (DISABLED_OPCODES.has(name)) {
        status = "disabled";
      } else if (RESERVED_OPCODES.has(name)) {
        status = "reserved";
      }
      return { name, code, status };
    })
    .sort((a, b) => a.code - b.code || a.name.localeCompare(b.name));
}

function scriptChunkToToken(bitcore: BitcoreLike, chunk: ScriptChunk): string {
  if (chunk.buf) {
    return chunk.buf.toString("hex");
  }
  return bitcore.Opcode.reverseMap[chunk.opcodenum] ?? `OPCODE_${chunk.opcodenum}`;
}

function castToBool(item: Buffer): boolean {
  for (let i = 0; i < item.length; i += 1) {
    if (item[i] !== 0) {
      if (i === item.length - 1 && item[i] === 0x80) {
        return false;
      }
      return true;
    }
  }
  return false;
}

function clampInteger(raw: number | undefined, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(raw ?? fallback)));
}

function attachInputOutputContext(
  bitcore: BitcoreLike,
  tx: TransactionLike,
  inputIndex: number,
  scriptPubKey: ScriptLike,
  satoshis: number,
): void {
  if (!Array.isArray(tx.inputs) || inputIndex < 0 || inputIndex >= tx.inputs.length) {
    return;
  }
  tx.inputs[inputIndex].output = new bitcore.Transaction.Output({
    script: scriptPubKey,
    satoshis,
  });
}

export async function GET() {
  const bitcore = await loadBitcore();
  const opcodes = buildOpcodeEntries(bitcore);

  return NextResponse.json({
    ok: true,
    supportedFlags: buildFlagEntries(bitcore).map((entry) => entry.key),
    opcodes,
    opcodeSummary: {
      total: opcodes.length,
      enabled: opcodes.filter((entry) => entry.status === "enabled").length,
      disabled: opcodes.filter((entry) => entry.status === "disabled").length,
      reserved: opcodes.filter((entry) => entry.status === "reserved").length,
    },
    notes: [
      "Supports ASM and hex scripts.",
      "Pass txHex/inputIndex/satoshis/witness for signature, timelock, segwit and taproot checks.",
      "Disabled opcodes and policy/consensus errors are returned exactly by interpreter error strings.",
    ],
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as VerifyPayload;
    const bitcore = await loadBitcore();
    const mode: VerifyMode = payload.mode ?? "verify";

    const tx = payload.txHex ? new bitcore.Transaction(payload.txHex.trim()) : new bitcore.Transaction();
    const inputIndex = clampInteger(payload.inputIndex, 0, Number.MAX_SAFE_INTEGER, 0);
    const satoshis = clampInteger(payload.satoshis, 0, Number.MAX_SAFE_INTEGER, 0);
    const { mask, names } = buildFlagMask(bitcore, payload.flags);

    if (mode === "trace") {
      if (!payload.script || payload.script.trim().length === 0) {
        return NextResponse.json({ ok: false, error: "script is required for trace mode." }, { status: 400 });
      }

      const script = toScript(bitcore, payload.script, payload.scriptFormat ?? "auto");
      const initialStack = toHexBuffers(payload.initialStack, "Initial stack");
      const maxSteps = clampInteger(payload.maxSteps, 1, 1000, 200);

      const interpreter = new bitcore.Script.Interpreter();
      interpreter.set({
        script,
        tx,
        nin: inputIndex,
        flags: mask,
        stack: initialStack,
        altstack: [],
        sigversion: bitcore.crypto.Signature.Version.BASE,
        satoshis,
      });

      const trace: Array<{
        step: number;
        pc: number;
        token: string;
        stack: string[];
        altStack: string[];
        error: string | null;
      }> = [];

      while (interpreter.pc < script.chunks.length && trace.length < maxSteps) {
        const pc = interpreter.pc;
        const token = scriptChunkToToken(bitcore, script.chunks[pc]);
        const ok = interpreter.step();
        trace.push({
          step: trace.length + 1,
          pc,
          token,
          stack: interpreter.stack.map((item) => item.toString("hex")),
          altStack: interpreter.altstack.map((item) => item.toString("hex")),
          error: interpreter.errstr || null,
        });
        if (!ok || interpreter.errstr) break;
      }

      const top = interpreter.stack.length > 0 ? interpreter.stack[interpreter.stack.length - 1] : null;
      const maxStepsReached =
        trace.length >= maxSteps && interpreter.pc < script.chunks.length && !interpreter.errstr;

      return NextResponse.json({
        ok: true,
        result: {
          completed: interpreter.pc >= script.chunks.length && !interpreter.errstr,
          error: interpreter.errstr || null,
          stackDepth: interpreter.stack.length,
          stackTopHex: top ? top.toString("hex") : null,
          topTruthy: top ? castToBool(top) : false,
          steps: trace.length,
          maxStepsReached,
          trace,
          inputIndex,
          satoshis,
          flagsMask: mask,
          flags: names,
        },
      });
    }

    if (payload.scriptSig === undefined || payload.scriptPubKey === undefined) {
      return NextResponse.json(
        { ok: false, error: "scriptSig and scriptPubKey are required." },
        { status: 400 },
      );
    }

    const scriptSig = toScript(bitcore, payload.scriptSig, payload.scriptSigFormat ?? "auto");
    const scriptPubKey = toScript(bitcore, payload.scriptPubKey, payload.scriptPubKeyFormat ?? "auto");
    const witness = toHexBuffers(payload.witness, "Witness");
    if (Array.isArray(tx.inputs) && tx.inputs.length > 0 && inputIndex >= tx.inputs.length) {
      return NextResponse.json(
        { ok: false, error: `inputIndex ${inputIndex} is out of range for tx inputs (${tx.inputs.length}).` },
        { status: 400 },
      );
    }
    attachInputOutputContext(bitcore, tx, inputIndex, scriptPubKey, satoshis);
    const interpreter = new bitcore.Script.Interpreter();
    const verified = interpreter.verify(
      scriptSig,
      scriptPubKey,
      tx,
      inputIndex,
      mask,
      witness,
      satoshis,
    );

    return NextResponse.json({
      ok: true,
      result: {
        verified,
        error: interpreter.errstr || null,
        stackDepth: interpreter.stack?.length ?? 0,
        stackTopHex:
          interpreter.stack && interpreter.stack.length > 0
            ? interpreter.stack[interpreter.stack.length - 1].toString("hex")
            : null,
        inputIndex,
        satoshis,
        flagsMask: mask,
        flags: names,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to evaluate script",
      },
      { status: 400 },
    );
  }
}
