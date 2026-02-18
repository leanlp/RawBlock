"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../../../components/Header";
import StackVisualizer from "../../../components/script-lab/StackVisualizer";
import {
  SCRIPT_CONSENSUS_FIXTURES,
  type ScriptConsensusFixture,
} from "../../../lib/scriptConsensusFixtures";

type Preset = {
  script: string;
  overview: string;
  objective: string;
  hint: string;
  expectedTop?: string;
  expectedStack?: string[];
  requiresTruthyTop?: boolean;
};

const PRESETS = {
  "Hash Equality (Consensus)": {
    script: "deadbeef OP_DUP OP_EQUAL",
    overview: "Byte-level equality check with consensus stack semantics.",
    objective: "Duplicate then compare the same item to end with true.",
    hint: "In consensus trace output, true is encoded as hex 01.",
    expectedTop: "01",
    requiresTruthyTop: true,
  },
  Addition: {
    script: "OP_1 OP_1 OP_ADD OP_2 OP_EQUAL",
    overview: "Arithmetic + comparison workflow.",
    objective: "Prove 1 + 1 == 2 and finish true.",
    hint: "Consensus trace returns minimally-encoded script numbers as hex stack items.",
    expectedTop: "01",
    requiresTruthyTop: true,
  },
  "If-Else Logic": {
    script: "OP_1 OP_IF OP_10 OP_ELSE OP_20 OP_ENDIF",
    overview: "Control flow branch selection with OP_IF/OP_ELSE.",
    objective: "Follow true branch and leave 10 on top.",
    hint: "OP_1 makes OP_IF branch execute; OP_ELSE branch is skipped.",
    expectedTop: "0a",
    expectedStack: ["0a"],
    requiresTruthyTop: true,
  },
  "Hash Collision (Fail)": {
    script: "deadbeef OP_SHA256 badf00d OP_SHA256 OP_EQUAL",
    overview: "Shows how hash comparisons fail when preimages differ.",
    objective: "Observe deterministic mismatch outcome.",
    hint: "Consensus false is an empty stack item, shown as blank hex.",
    expectedTop: "",
    requiresTruthyTop: false,
  },
} satisfies Record<string, Preset>;

type PresetKey = keyof typeof PRESETS;
type SelectedPreset = PresetKey | "Custom";

type Validation = {
  status: "pending" | "pass" | "fail";
  summary: string;
  details: string[];
  consensusPass: boolean | null;
  scenarioPass: boolean | null;
  top: string | null;
};

type TraceHistoryEntry = {
  stack: string[];
  altStack: string[];
  opcode: string;
  pc: number;
};

type TraceExecutionState = {
  stack: string[];
  altStack: string[];
  pointer: number;
  script: string[];
  completed: boolean;
  error: string | null;
  history: TraceHistoryEntry[];
  maxStepsReached: boolean;
};

type ConsensusVerifyResult = {
  verified: boolean;
  error: string | null;
  stackDepth: number;
  stackTopHex: string | null;
  inputIndex: number;
  satoshis: number;
  flagsMask: number;
  flags: string[];
};

type ConsensusTraceStep = {
  step: number;
  pc: number;
  token: string;
  stack: string[];
  altStack: string[];
  error: string | null;
};

type ConsensusTraceResult = {
  completed: boolean;
  error: string | null;
  stackDepth: number;
  stackTopHex: string | null;
  topTruthy: boolean;
  steps: number;
  maxStepsReached: boolean;
  trace: ConsensusTraceStep[];
  inputIndex: number;
  satoshis: number;
  flagsMask: number;
  flags: string[];
};

type OpcodeCatalogEntry = {
  name: string;
  code: number;
  status: "enabled" | "disabled" | "reserved";
};

type OpcodeSummary = {
  total: number;
  enabled: number;
  disabled: number;
  reserved: number;
};

type ScriptFormat = "auto" | "asm" | "hex";

const PRESET_KEYS = Object.keys(PRESETS) as PresetKey[];
const DEFAULT_VERIFY_FLAGS = [
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

const EMPTY_OPCODE_SUMMARY: OpcodeSummary = {
  total: 0,
  enabled: 0,
  disabled: 0,
  reserved: 0,
};

function tokenizeScript(script: string): string[] {
  return script
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function castStackHexToBool(value: string): boolean {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.toUpperCase() === "EMPTY") {
    return false;
  }
  if (/^-?\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10) !== 0;
  }
  if (!/^[0-9a-fA-F]+$/.test(normalized) || normalized.length % 2 !== 0) {
    return true;
  }
  const bytes: number[] = [];
  for (let index = 0; index < normalized.length; index += 2) {
    bytes.push(Number.parseInt(normalized.slice(index, index + 2), 16));
  }
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) {
      if (index === bytes.length - 1 && bytes[index] === 0x80) {
        return false;
      }
      return true;
    }
  }
  return false;
}

function normalizeScript(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function parseLineItems(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function findPreset(script: string): SelectedPreset {
  const normalized = normalizeScript(script);
  for (const presetName of PRESET_KEYS) {
    if (normalizeScript(PRESETS[presetName].script) === normalized) {
      return presetName;
    }
  }
  return "Custom";
}

function resolveInitialModel(): { script: string; preset: SelectedPreset } {
  const fallbackPreset: PresetKey = "Addition";
  const fallbackScript = PRESETS[fallbackPreset].script;
  if (typeof window === "undefined") {
    return { script: fallbackScript, preset: fallbackPreset };
  }

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("script");
  const script = fromUrl && fromUrl.trim().length > 0 ? fromUrl : fallbackScript;
  return { script, preset: findPreset(script) };
}

function createExecutionState(script: string): TraceExecutionState {
  return {
    stack: [],
    altStack: [],
    pointer: 0,
    script: tokenizeScript(script),
    completed: false,
    error: null,
    history: [],
    maxStepsReached: false,
  };
}

function buildExecutionStateFromTrace(
  script: string,
  traceResult: ConsensusTraceResult,
  initialStack: string[],
): TraceExecutionState {
  const scriptTokens = tokenizeScript(script);
  const history: TraceHistoryEntry[] = traceResult.trace.map((step) => ({
    stack: step.stack,
    altStack: step.altStack,
    opcode: step.token,
    pc: step.pc,
  }));
  const lastStep = traceResult.trace.at(-1);
  const pointer = lastStep ? Math.min(lastStep.pc + 1, scriptTokens.length) : 0;

  return {
    stack: lastStep ? [...lastStep.stack] : [...initialStack],
    altStack: lastStep ? [...lastStep.altStack] : [],
    pointer,
    script: scriptTokens,
    completed: traceResult.completed || Boolean(traceResult.error) || pointer >= scriptTokens.length,
    error: traceResult.error,
    history,
    maxStepsReached: traceResult.maxStepsReached,
  };
}

function evaluateState(state: TraceExecutionState, preset: Preset | null): Validation {
  if (!state.completed) {
    return {
      status: "pending",
      summary: "Run the script to evaluate objective and consensus result.",
      details: [],
      consensusPass: null,
      scenarioPass: null,
      top: null,
    };
  }

  if (state.error) {
    return {
      status: "fail",
      summary: "Execution failed before completion.",
      details: [state.error],
      consensusPass: false,
      scenarioPass: false,
      top: null,
    };
  }

  if (state.stack.length === 0) {
    return {
      status: "fail",
      summary: "Final stack is empty.",
      details: ["Bitcoin Script validation requires a non-empty final stack."],
      consensusPass: false,
      scenarioPass: false,
      top: null,
    };
  }

  const top = state.stack[state.stack.length - 1];
  const consensusPass = castStackHexToBool(top);

  const details: string[] = [`Final top item: ${top}`];
  let scenarioPass = true;

  if (preset?.expectedTop !== undefined && top !== preset.expectedTop) {
    scenarioPass = false;
    details.push(`Expected top item: ${preset.expectedTop}`);
  }

  if (preset?.expectedStack !== undefined) {
    const expected = JSON.stringify(preset.expectedStack);
    const actual = JSON.stringify(state.stack);
    if (expected !== actual) {
      scenarioPass = false;
      details.push(`Expected stack: ${expected}`);
      details.push(`Actual stack: ${actual}`);
    }
  }

  if ((preset?.requiresTruthyTop ?? true) && !consensusPass) {
    scenarioPass = false;
    details.push("Top stack item is falsey (consensus fail).");
  }

  return {
    status: scenarioPass ? "pass" : "fail",
    summary: scenarioPass ? "Scenario objective satisfied." : "Scenario objective failed.",
    details,
    consensusPass,
    scenarioPass,
    top,
  };
}

export default function ScriptLabPage() {
  const initialModel = useMemo(() => resolveInitialModel(), []);
  const [selectedPreset, setSelectedPreset] = useState<SelectedPreset>(initialModel.preset);
  const [scriptInput, setScriptInput] = useState(initialModel.script);
  const [state, setState] = useState<TraceExecutionState>(() => createExecutionState(initialModel.script));
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const [realScriptSig, setRealScriptSig] = useState("OP_1");
  const [realScriptPubKey, setRealScriptPubKey] = useState("OP_1 OP_EQUAL");
  const [realScriptSigFormat, setRealScriptSigFormat] = useState<ScriptFormat>("auto");
  const [realScriptPubKeyFormat, setRealScriptPubKeyFormat] = useState<ScriptFormat>("auto");
  const [realTxHex, setRealTxHex] = useState("");
  const [realWitnessText, setRealWitnessText] = useState("");
  const [realTraceInitialStack, setRealTraceInitialStack] = useState("");
  const [realTraceMaxSteps, setRealTraceMaxSteps] = useState("200");
  const [realInputIndex, setRealInputIndex] = useState("0");
  const [realSatoshis, setRealSatoshis] = useState("0");
  const [realFlags, setRealFlags] = useState<string[]>(DEFAULT_VERIFY_FLAGS);
  const [availableFlags, setAvailableFlags] = useState<string[]>(DEFAULT_VERIFY_FLAGS);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [opcodeCatalog, setOpcodeCatalog] = useState<OpcodeCatalogEntry[]>([]);
  const [opcodeSummary, setOpcodeSummary] = useState<OpcodeSummary>(EMPTY_OPCODE_SUMMARY);
  const [realLoading, setRealLoading] = useState(false);
  const [realVerifyError, setRealVerifyError] = useState<string | null>(null);
  const [realTraceError, setRealTraceError] = useState<string | null>(null);
  const [realResult, setRealResult] = useState<ConsensusVerifyResult | null>(null);
  const [realTraceResult, setRealTraceResult] = useState<ConsensusTraceResult | null>(null);

  const activePreset = selectedPreset === "Custom" ? null : PRESETS[selectedPreset];
  const selectedFixture = useMemo(
    () => SCRIPT_CONSENSUS_FIXTURES.find((fixture) => fixture.id === selectedFixtureId) ?? null,
    [selectedFixtureId],
  );
  const validation = useMemo(() => evaluateState(state, activePreset), [state, activePreset]);
  const isAutoPlaying = isPlaying && !state.completed && !state.error;
  const historyPreview = useMemo(() => state.history.slice(-10).reverse(), [state.history]);
  const fixtureExpectationMatch = useMemo(() => {
    if (!selectedFixture || !realResult) return null;
    if (realResult.verified !== selectedFixture.expectedVerified) return false;
    if (selectedFixture.expectedError) {
      return realResult.error === selectedFixture.expectedError;
    }
    return true;
  }, [selectedFixture, realResult]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const response = await fetch("/api/bitcoin/script-consensus", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok: boolean;
          supportedFlags?: string[];
          opcodes?: OpcodeCatalogEntry[];
          opcodeSummary?: OpcodeSummary;
        };
        if (!mounted || !payload.ok) return;

        if (payload.supportedFlags && payload.supportedFlags.length > 0) {
          setAvailableFlags(payload.supportedFlags);
          setRealFlags((previous) => {
            const filtered = previous.filter((flag) => payload.supportedFlags?.includes(flag));
            return filtered.length > 0 ? filtered : payload.supportedFlags ?? DEFAULT_VERIFY_FLAGS;
          });
        }

        if (payload.opcodes) {
          setOpcodeCatalog(payload.opcodes);
        }
        if (payload.opcodeSummary) {
          setOpcodeSummary(payload.opcodeSummary);
        }
      } catch {
        // Keep defaults when endpoint is unavailable.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadScript = useCallback(
    (nextScript: string, nextPreset: SelectedPreset) => {
      setIsPlaying(false);
      setSelectedPreset(nextPreset);
      setScriptInput(nextScript);
      setState(createExecutionState(nextScript));
    },
    [],
  );

  const loadCurrentEditor = useCallback(() => {
    setIsPlaying(false);
    setState(createExecutionState(scriptInput));
  }, [scriptInput]);

  const runConsensusTrace = useCallback(
    async (maxSteps: number) => {
      const initialStack = parseLineItems(realTraceInitialStack);
      const response = await fetch("/api/bitcoin/script-consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "trace",
          script: scriptInput,
          scriptFormat: "auto",
          txHex: realTxHex.trim() || undefined,
          inputIndex: Number.parseInt(realInputIndex, 10) || 0,
          satoshis: Number.parseInt(realSatoshis, 10) || 0,
          flags: realFlags,
          maxSteps,
          initialStack: initialStack.length > 0 ? initialStack : undefined,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: ConsensusTraceResult;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.error ?? "Consensus trace failed.");
      }

      return {
        result: payload.result,
        initialStack,
      };
    },
    [realFlags, realInputIndex, realSatoshis, realTraceInitialStack, realTxHex, scriptInput],
  );

  const step = useCallback(async () => {
    if (state.completed || state.error || realLoading) return;

    setRealLoading(true);
    setRealTraceError(null);

    try {
      const targetSteps = state.history.length + 1;
      const { result, initialStack } = await runConsensusTrace(targetSteps);
      setRealTraceResult(result);
      setState(buildExecutionStateFromTrace(scriptInput, result, initialStack));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Consensus step failed.";
      setRealTraceError(message);
      setState((previous) => ({ ...previous, completed: true, error: message }));
      setIsPlaying(false);
    } finally {
      setRealLoading(false);
    }
  }, [realLoading, runConsensusTrace, scriptInput, state.completed, state.error, state.history.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = window.setInterval(() => {
      void step();
    }, 700);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, step]);

  const handlePresetChange = useCallback(
    (value: string) => {
      if (value === "Custom") return;
      const preset = value as PresetKey;
      loadScript(PRESETS[preset].script, preset);
    },
    [loadScript],
  );

  const handleEditorChange = useCallback((value: string) => {
    setScriptInput(value);
    setSelectedPreset("Custom");
  }, []);

  const shareScriptUrl = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (scriptInput.trim().length > 0) {
        url.searchParams.set("script", scriptInput.trim());
      } else {
        url.searchParams.delete("script");
      }
      await navigator.clipboard.writeText(url.toString());
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1500);
    } catch {
      setShareState("error");
      window.setTimeout(() => setShareState("idle"), 1800);
    }
  }, [scriptInput]);

  const toggleRealFlag = useCallback((flag: string) => {
    setRealFlags((previous) =>
      previous.includes(flag) ? previous.filter((item) => item !== flag) : [...previous, flag],
    );
  }, []);

  const loadConsensusFixture = useCallback((fixture: ScriptConsensusFixture) => {
    const traceScript = fixture.traceScript ?? fixture.scriptPubKey;

    setSelectedFixtureId(fixture.id);
    setIsPlaying(false);
    setSelectedPreset("Custom");
    setScriptInput(traceScript);
    setState(createExecutionState(traceScript));

    setRealScriptSig(fixture.scriptSig);
    setRealScriptPubKey(fixture.scriptPubKey);
    setRealScriptSigFormat(fixture.scriptSigFormat);
    setRealScriptPubKeyFormat(fixture.scriptPubKeyFormat);
    setRealTxHex(fixture.txHex);
    setRealInputIndex(String(fixture.inputIndex));
    setRealSatoshis(String(fixture.satoshis));
    setRealWitnessText(fixture.witness.join("\n"));
    setRealTraceInitialStack((fixture.traceInitialStack ?? []).join("\n"));

    setRealVerifyError(null);
    setRealTraceError(null);
    setRealResult(null);
    setRealTraceResult(null);
  }, []);

  const runRealConsensusVerify = useCallback(async () => {
    setRealLoading(true);
    setRealVerifyError(null);
    setRealResult(null);

    try {
      const witnessItems = parseLineItems(realWitnessText);

      const response = await fetch("/api/bitcoin/script-consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptSig: realScriptSig,
          scriptPubKey: realScriptPubKey,
          scriptSigFormat: realScriptSigFormat,
          scriptPubKeyFormat: realScriptPubKeyFormat,
          txHex: realTxHex.trim() || undefined,
          inputIndex: Number.parseInt(realInputIndex, 10) || 0,
          satoshis: Number.parseInt(realSatoshis, 10) || 0,
          witness: witnessItems.length > 0 ? witnessItems : undefined,
          flags: realFlags,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: ConsensusVerifyResult;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.error ?? "Consensus verification failed.");
      }

      setRealResult(payload.result);
    } catch (error) {
      setRealVerifyError(error instanceof Error ? error.message : "Consensus verification failed.");
    } finally {
      setRealLoading(false);
    }
  }, [
    realFlags,
    realInputIndex,
    realSatoshis,
    realScriptPubKey,
    realScriptPubKeyFormat,
    realScriptSig,
    realScriptSigFormat,
    realTxHex,
    realWitnessText,
  ]);

  const runRealTrace = useCallback(async () => {
    setRealLoading(true);
    setRealTraceError(null);
    setRealTraceResult(null);

    try {
      const maxSteps = Number.parseInt(realTraceMaxSteps, 10) || 200;
      const { result, initialStack } = await runConsensusTrace(maxSteps);
      setRealTraceResult(result);
      setState(buildExecutionStateFromTrace(scriptInput, result, initialStack));
    } catch (error) {
      setRealTraceError(error instanceof Error ? error.message : "Consensus trace failed.");
    } finally {
      setRealLoading(false);
    }
  }, [realTraceMaxSteps, runConsensusTrace, scriptInput]);

  return (
    <main className="min-h-screen bg-slate-950 p-4 font-mono text-slate-200 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6">
        <Header />

        <div className="page-header">
          <h1 className="page-title mx-auto max-w-[92vw] bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-center text-transparent sm:mx-0 sm:max-w-none sm:text-left">
            Script Lab
          </h1>
          <p className="page-subtitle">Consensus-true Bitcoin Script execution with step trace, fixture validation, and opcode catalog.</p>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Execution Readiness</p>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-300 md:grid-cols-2">
            <p>
              Step/Run now executes the real interpreter trace endpoint using tx context, flags, and satoshi amounts.
            </p>
            <p>
              Real consensus API: <span className="font-semibold text-emerald-300">{opcodeSummary.total || "..."}</span>{" "}
              total opcodes ({opcodeSummary.enabled} enabled / {opcodeSummary.disabled} disabled / {opcodeSummary.reserved} reserved) via bitcore
              interpreter.
            </p>
          </div>
        </section>

        <div className="grid min-h-[560px] grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="flex flex-col gap-4 lg:col-span-4">
            <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Script Scenario</label>
                <select
                  className="min-h-11 rounded border border-slate-700 bg-slate-950 px-2 text-xs text-slate-300"
                  value={selectedPreset}
                  onChange={(event) => handlePresetChange(event.target.value)}
                >
                  <option value="Custom">Custom</option>
                  {PRESET_KEYS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="mb-2 text-xs text-slate-400">{activePreset?.overview ?? "Custom script loaded from editor or shared URL."}</p>
              <p className="mb-4 text-[11px] text-cyan-300">Objective: {activePreset?.objective ?? "Finish with a truthy top stack item."}</p>

              <textarea
                value={scriptInput}
                onChange={(event) => handleEditorChange(event.target.value)}
                spellCheck="false"
                className="min-h-[210px] w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm leading-relaxed text-blue-300 focus:border-blue-500 focus:outline-none"
              />

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={loadCurrentEditor}
                  className="min-h-11 rounded-lg bg-slate-800 px-3 text-xs font-bold uppercase tracking-wide text-slate-200 hover:bg-slate-700"
                >
                  Load Editor
                </button>
                <button
                  type="button"
                  onClick={shareScriptUrl}
                  className="min-h-11 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 text-xs font-bold uppercase tracking-wide text-indigo-200 hover:border-indigo-400/60 hover:text-indigo-100"
                >
                  Share URL
                </button>
              </div>
              {shareState !== "idle" ? (
                <p className={`mt-2 text-[11px] ${shareState === "copied" ? "text-emerald-300" : "text-red-300"}`}>
                  {shareState === "copied" ? "Share URL copied to clipboard." : "Could not copy URL."}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void step()}
                  disabled={state.completed || !!state.error || isAutoPlaying || realLoading}
                  className="min-h-11 rounded-lg bg-blue-600 px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-500"
                >
                  Step
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  disabled={state.completed || !!state.error || realLoading}
                  className={`min-h-11 rounded-lg px-3 text-sm font-bold ${
                    isAutoPlaying
                      ? "border border-red-500/50 bg-red-500/20 text-red-300"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {isAutoPlaying ? "Pause" : "Run"}
                </button>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                validation.status === "pass"
                  ? "border-emerald-500/40 bg-emerald-900/20"
                  : validation.status === "fail"
                    ? "border-red-500/40 bg-red-900/20"
                    : "border-slate-800 bg-slate-900"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Validation Engine</p>
              <p className="mt-2 text-sm text-slate-200">{validation.summary}</p>
              <div className="mt-2 text-xs text-slate-400">
                <p>
                  Consensus:{" "}
                  {validation.consensusPass === null ? "Pending" : validation.consensusPass ? "PASS" : "FAIL"}
                </p>
                <p>
                  Scenario objective:{" "}
                  {validation.scenarioPass === null ? "Pending" : validation.scenarioPass ? "PASS" : "FAIL"}
                </p>
              </div>
              {validation.details.length > 0 ? (
                <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
                  {validation.details.map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 text-[11px] text-slate-400">Hint: {activePreset?.hint ?? "Use consensus trace + fixture contexts to reason about stack truth."}</p>
            </div>
          </section>

          <section className="flex min-h-[620px] flex-col gap-4 lg:col-span-5">
            <div className="h-[420px] rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <StackVisualizer stack={state.stack} altStack={state.altStack} />
            </div>

            <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Execution Trace</p>
                <p className="text-[11px] text-slate-500">Pointer: {state.pointer}</p>
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto pr-1 text-xs">
                {historyPreview.length === 0 ? (
                  <p className="text-slate-500">No executed opcodes yet.</p>
                ) : (
                  historyPreview.map((entry, index) => (
                    <div key={`${entry.opcode}-${state.history.length - index}`} className="rounded border border-slate-800 bg-slate-950/60 p-2">
                      <p className="font-bold text-cyan-300">
                        pc:{entry.pc} {entry.opcode}
                      </p>
                      <p className="text-[11px] text-slate-400">Stack after: [{entry.stack.join(", ")}]</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="flex h-[620px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 lg:col-span-3">
            <div className="border-b border-slate-800 bg-slate-950/50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Opcode Stream</h3>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {state.script.map((opcode, index) => {
                const isCurrent = index === state.pointer;
                const isPast = index < state.pointer;
                return (
                  <div
                    key={`${opcode}-${index}`}
                    className={`rounded p-2 text-xs transition-all ${
                      isCurrent
                        ? "border border-yellow-500/50 bg-yellow-500/20 font-bold text-yellow-300"
                        : isPast
                          ? "text-slate-600"
                          : "text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opcode}</span>
                      {isCurrent ? <span className="rounded bg-yellow-500 px-1 text-[10px] text-black">PC</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 bg-slate-950/50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Consensus Opcode Catalog</p>
              <p className="mb-2 text-[10px] text-slate-500">
                Real catalog from bitcore interpreter: {opcodeSummary.total} total, {opcodeSummary.enabled} enabled,{" "}
                {opcodeSummary.disabled} disabled, {opcodeSummary.reserved} reserved.
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto pr-1 text-[10px]">
                {opcodeCatalog.length === 0 ? (
                  <p className="text-slate-500">Catalog unavailable.</p>
                ) : (
                  opcodeCatalog.map((entry) => (
                    <div key={`${entry.name}-${entry.code}`} className="flex items-center justify-between rounded border border-slate-800 p-1.5">
                      <span className="text-slate-300">{entry.name}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 ${
                          entry.status === "enabled"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : entry.status === "disabled"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {entry.status} ({entry.code})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Consensus Verify (Real Engine)</h2>
              <p className="text-xs text-slate-500">
                Uses bitcore-lib Interpreter with policy/consensus flags, tx context, witness and satoshi input.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRealScriptPubKey(scriptInput)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/40 px-3 text-xs font-bold text-slate-200 hover:border-cyan-500/40 hover:text-cyan-200"
            >
              Use Editor as scriptPubKey
            </button>
          </div>

          <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <div className="mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Real Fixture Library</p>
              <p className="text-[11px] text-slate-500">
                Deterministic transaction contexts for legacy, segwit, taproot, timelock constraints, and sighash failures.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              {SCRIPT_CONSENSUS_FIXTURES.map((fixture) => (
                <button
                  key={fixture.id}
                  type="button"
                  onClick={() => loadConsensusFixture(fixture)}
                  className={`min-h-11 rounded-lg border p-2 text-left ${
                    selectedFixtureId === fixture.id
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-200">{fixture.name}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{fixture.objective}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 uppercase text-slate-300">{fixture.category}</span>
                    <span className={fixture.expectedVerified ? "text-emerald-300" : "text-red-300"}>
                      expected {fixture.expectedVerified ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {selectedFixture ? (
              <p className="mt-2 text-[11px] text-slate-400">Loaded: {selectedFixture.notes}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="space-y-3 xl:col-span-7">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">scriptSig</label>
                  <textarea
                    value={realScriptSig}
                    onChange={(event) => setRealScriptSig(event.target.value)}
                    className="min-h-[84px] w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-cyan-200 focus:border-cyan-500 focus:outline-none"
                    spellCheck="false"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">scriptPubKey</label>
                  <textarea
                    value={realScriptPubKey}
                    onChange={(event) => setRealScriptPubKey(event.target.value)}
                    className="min-h-[84px] w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-emerald-200 focus:border-emerald-500 focus:outline-none"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">scriptSig format</label>
                  <select
                    value={realScriptSigFormat}
                    onChange={(event) => setRealScriptSigFormat(event.target.value as ScriptFormat)}
                    className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="auto">auto</option>
                    <option value="asm">asm</option>
                    <option value="hex">hex</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">scriptPubKey format</label>
                  <select
                    value={realScriptPubKeyFormat}
                    onChange={(event) => setRealScriptPubKeyFormat(event.target.value as ScriptFormat)}
                    className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="auto">auto</option>
                    <option value="asm">asm</option>
                    <option value="hex">hex</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Input Index</label>
                  <input
                    value={realInputIndex}
                    onChange={(event) => setRealInputIndex(event.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Satoshis</label>
                  <input
                    value={realSatoshis}
                    onChange={(event) => setRealSatoshis(event.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Transaction Hex (optional for CHECKSIG/CLTV/CSV/Witness)</label>
                <textarea
                  value={realTxHex}
                  onChange={(event) => setRealTxHex(event.target.value)}
                  className="min-h-[72px] w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-[11px] text-slate-300 focus:border-cyan-500 focus:outline-none"
                  spellCheck="false"
                  placeholder="Raw transaction hex"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Witness Stack (optional, one hex item per line)</label>
                <textarea
                  value={realWitnessText}
                  onChange={(event) => setRealWitnessText(event.target.value)}
                  className="min-h-[72px] w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-[11px] text-slate-300 focus:border-cyan-500 focus:outline-none"
                  spellCheck="false"
                  placeholder="3045...01&#10;02ab...&#10;EMPTY (for zero-length witness item)"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Trace Initial Stack (optional, one hex item per line)</label>
                  <textarea
                    value={realTraceInitialStack}
                    onChange={(event) => setRealTraceInitialStack(event.target.value)}
                    className="min-h-[72px] w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-[11px] text-slate-300 focus:border-cyan-500 focus:outline-none"
                    spellCheck="false"
                    placeholder="01&#10;deadbeef"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Trace Max Steps</label>
                  <input
                    value={realTraceMaxSteps}
                    onChange={(event) => setRealTraceMaxSteps(event.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void runRealConsensusVerify()}
                  disabled={realLoading}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-600 px-4 text-sm font-bold text-white disabled:opacity-40 hover:bg-cyan-500"
                >
                  {realLoading ? "Working..." : "Run Real Consensus Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => void runRealTrace()}
                  disabled={realLoading}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 text-sm font-bold text-amber-200 disabled:opacity-40 hover:border-amber-400/50 hover:text-amber-100"
                >
                  {realLoading ? "Working..." : "Run Real Trace (Editor Script)"}
                </button>
              </div>
            </div>

            <div className="space-y-3 xl:col-span-5">
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Verification Flags</p>
                <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
                  {availableFlags.map((flag) => (
                    <label key={flag} className="flex min-h-11 cursor-pointer items-center gap-2 rounded border border-slate-800 px-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={realFlags.includes(flag)}
                        onChange={() => toggleRealFlag(flag)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>{flag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-lg border p-3 ${
                  realResult?.verified
                    ? "border-emerald-500/40 bg-emerald-900/20"
                    : realResult
                      ? "border-red-500/40 bg-red-900/20"
                      : "border-slate-800 bg-slate-950/40"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Consensus Result</p>
                {selectedFixture ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Fixture expectation:{" "}
                    <span className={selectedFixture.expectedVerified ? "text-emerald-300" : "text-red-300"}>
                      {selectedFixture.expectedVerified ? "PASS" : "FAIL"}
                    </span>
                    {selectedFixture.expectedError ? ` (${selectedFixture.expectedError})` : ""}
                  </p>
                ) : null}
                {realVerifyError ? <p className="mt-2 text-xs text-red-300">{realVerifyError}</p> : null}
                {realResult ? (
                  <div className="mt-2 space-y-1 text-xs text-slate-200">
                    <p>
                      Verified:{" "}
                      <span className={realResult.verified ? "text-emerald-300" : "text-red-300"}>
                        {realResult.verified ? "PASS" : "FAIL"}
                      </span>
                    </p>
                    <p>Error: {realResult.error ?? "none"}</p>
                    <p>Stack depth: {realResult.stackDepth}</p>
                    <p>Top stack hex: {realResult.stackTopHex ?? "n/a"}</p>
                    <p>Flags mask: {realResult.flagsMask}</p>
                    {fixtureExpectationMatch !== null ? (
                      <p className={fixtureExpectationMatch ? "text-emerald-300" : "text-red-300"}>
                        Expectation match: {fixtureExpectationMatch ? "yes" : "no"}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No consensus result yet.</p>
                )}
              </div>

              <div
                className={`rounded-lg border p-3 ${
                  realTraceResult
                    ? realTraceResult.error
                      ? "border-red-500/40 bg-red-900/20"
                      : "border-emerald-500/40 bg-emerald-900/20"
                    : "border-slate-800 bg-slate-950/40"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Trace Result (Real Interpreter)</p>
                {realTraceError ? <p className="mt-2 text-xs text-red-300">{realTraceError}</p> : null}
                {realTraceResult ? (
                  <div className="mt-2 space-y-2 text-xs text-slate-200">
                    <p>Completed: {realTraceResult.completed ? "yes" : "no"}</p>
                    <p>Error: {realTraceResult.error ?? "none"}</p>
                    <p>
                      Final top (hex): {realTraceResult.stackTopHex ?? "n/a"} | truthy:{" "}
                      {realTraceResult.topTruthy ? "true" : "false"}
                    </p>
                    <p>
                      Steps: {realTraceResult.steps}
                      {realTraceResult.maxStepsReached ? " (max reached)" : ""}
                    </p>
                    <div className="max-h-52 space-y-1 overflow-y-auto rounded border border-slate-800 bg-slate-950/60 p-2">
                      {realTraceResult.trace.length === 0 ? (
                        <p className="text-slate-500">No trace steps.</p>
                      ) : (
                        realTraceResult.trace.map((step) => (
                          <div key={`${step.step}-${step.pc}-${step.token}`} className="rounded border border-slate-800 p-1.5">
                            <p className="text-[11px] font-bold text-amber-300">
                              #{step.step} pc:{step.pc} {step.token}
                            </p>
                            <p className="text-[10px] text-slate-400">Stack: [{step.stack.join(", ")}]</p>
                            <p className="text-[10px] text-slate-500">Alt: [{step.altStack.join(", ")}]</p>
                            {step.error ? <p className="text-[10px] text-red-300">Error: {step.error}</p> : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No real trace result yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
