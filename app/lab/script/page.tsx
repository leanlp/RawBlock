"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import StackVisualizer from "../../../components/script-lab/StackVisualizer";
import { OpcodeEngine, ScriptState, OPCODES } from "../../../components/script-lab/OpcodeEngine";
import { motion } from "framer-motion";

const PRESETS = {
    "P2PKH (Valid)": "OP_DUP OP_HASH160 abcd1234abcd1234 OP_EQUALVERIFY OP_CHECKSIG",
    "TimeLock (Mock)": "OP_10 OP_CHECKSEQUENCEVERIFY OP_DROP OP_TRUE",
    "Addition": "OP_1 OP_1 OP_ADD OP_2 OP_EQUAL",
    "If-Else Logic": "OP_1 OP_IF OP_10 OP_ELSE OP_20 OP_ENDIF",
    "Hash Collision (Fail)": "OP_SHA256 deadbeef OP_SHA256 badf00d OP_EQUAL",
};

export default function ScriptLabPage() {
    const [scriptInput, setScriptInput] = useState(PRESETS["Addition"]);
    const [state, setState] = useState<ScriptState>(OpcodeEngine.initialState(PRESETS["Addition"]));
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState("Addition");

    // Reset when input changes manually? No, allow editing without reset until "Load"

    const loadScript = () => {
        setIsPlaying(false);
        setState(OpcodeEngine.initialState(scriptInput));
    };

    const step = async () => {
        if (state.completed) return;
        const newState = await OpcodeEngine.step(state);
        setState(newState);
        if (newState.completed || newState.error) setIsPlaying(false);
    };

    // Auto-play effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && !state.completed && !state.error) {
            interval = setInterval(() => {
                step();
            }, 800);
        } else {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, state]);


    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono flex flex-col">
            <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-6">
                <Header />

                {/* Title Section */}
                <div className="page-header">
                    <h1 className="page-title mx-auto max-w-[92vw] bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-center text-transparent sm:mx-0 sm:max-w-none sm:text-left">
                        Script Lab
                    </h1>
                    <p className="page-subtitle">Bitcoin programmable logic debugger.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">

                    {/* LEFT: Editor & Controls */}
                    <div className="lg:col-span-4 flex flex-col gap-4">

                        {/* Editor */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Script Input</label>
                                <select
                                    className="bg-slate-950 text-xs border border-slate-700 rounded p-1 text-slate-300"
                                    value={selectedPreset}
                                    onChange={(e) => {
                                        const presetName = e.target.value;
                                        const presetCode = PRESETS[presetName as keyof typeof PRESETS];
                                        setSelectedPreset(presetName);
                                        setScriptInput(presetCode);
                                        // Auto load for UX
                                        setState(OpcodeEngine.initialState(presetCode));
                                        setIsPlaying(false);
                                    }}
                                >
                                    {Object.entries(PRESETS).map(([name, code]) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <textarea
                                value={scriptInput}
                                onChange={(e) => setScriptInput(e.target.value)}
                                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-sm text-blue-300 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                                spellCheck="false"
                            />
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={loadScript}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded font-bold text-xs uppercase"
                                >
                                    Reset / Load
                                </button>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={step}
                                    disabled={state.completed || !!state.error || isPlaying}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20"
                                >
                                    Step ➡️
                                </button>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    disabled={state.completed || !!state.error}
                                    className={`flex-1 py-3 rounded-lg font-bold text-sm shadow-lg transition-colors ${isPlaying ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'}`}
                                >
                                    {isPlaying ? 'Pause ⏸️' : 'Run ▶️'}
                                </button>
                            </div>
                        </div>

                        {/* Status Panel */}
                        <div className={`rounded-xl border p-4 transition-colors ${state.error ? 'bg-red-900/20 border-red-500/50' :
                            state.completed ? 'bg-emerald-900/20 border-emerald-500/50' :
                                'bg-slate-900 border-slate-800'
                            }`}>
                            <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">
                                Status
                            </div>
                            <div className={`font-mono text-sm ${state.error ? 'text-red-400' : state.completed ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {state.error ? `ERROR: ${state.error}` :
                                    state.completed ? "EXECUTION COMPLETE" :
                                        `READY @ POS ${state.pointer}`}
                            </div>
                        </div>

                    </div>

                    {/* CENTER: Visualization */}
                    <div className="lg:col-span-5 h-[600px] lg:h-auto">
                        <StackVisualizer stack={state.stack} altStack={state.altStack} />
                    </div>

                    {/* RIGHT: Inspector */}
                    <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden h-[600px] lg:h-auto">
                        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Opcode Stream</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {state.script.map((op, idx) => {
                                const isCurrent = idx === state.pointer;
                                const isPast = idx < state.pointer;
                                return (
                                    <div
                                        key={idx}
                                        id={isCurrent ? "current-opcode" : undefined}
                                        className={`
                                            p-2 rounded font-mono text-xs transition-all
                                            ${isCurrent ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 scale-105 font-bold shadow-lg shadow-yellow-500/10' :
                                                isPast ? 'text-slate-600 decoration-slate-700' :
                                                    'text-slate-400'}
                                        `}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{op}</span>
                                            {isCurrent && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded">PC</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {/* Legend */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/30 text-[10px] text-slate-500">
                            <p>Supported: DUP, HASH160, EQUAL, CHECKSIG, ADD, SUB, IF...</p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
