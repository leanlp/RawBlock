"use client";

import React, { useMemo } from 'react';
import { PrivacyAnalysisResult, MockTransaction, satsToBtc } from '../../utils/coinjoinHeuristics';

interface Props {
    tx: MockTransaction;
    analysis: PrivacyAnalysisResult;
}

export default function CoinjoinFlowGraph({ tx, analysis }: Props) {

    // Sort outputs: Change outputs at the top (smaller), Equal Outputs (Mix) at the bottom
    const sortedOutputs = useMemo(() => {
        return [...tx.outputs].sort((a, b) => {
            if (a.isChange && !b.isChange) return -1;
            if (!a.isChange && b.isChange) return 1;
            return b.value - a.value;
        });
    }, [tx]);

    // Graph Constants
    const GRAPH_HEIGHT = 500;
    const INPUT_X = 50;
    const OUTPUT_X = 800;

    // Determine Y spacing based on number of inputs/outputs to prevent overflow
    const inputSpacing = Math.min(40, GRAPH_HEIGHT / Math.max(1, tx.inputs.length));
    const outputSpacing = Math.min(30, GRAPH_HEIGHT / Math.max(1, tx.outputs.length));

    return (
        <div className="w-full h-full p-4 relative font-mono text-xs select-none">

            <svg className="w-full h-full absolute inset-0 pointer-events-none" preserveAspectRatio="none">

                {/* 
                    Composable Evidence Graph Renderer
                    Instead of guessing connections in the UI, we strictly render the mathematical linkages
                    and probabilities (LLR Scores) output by the Go Forensics Engine.
                */}
                {analysis.edges && analysis.edges.map(edge => {
                    // Map addresses to Y-coordinates
                    const startY = tx.inputs.findIndex(inNode => inNode.address === edge.srcNodeId) * inputSpacing + 20;

                    let endY = 0;
                    let isInputToInput = false;
                    let isCoordinatorGate = false;
                    let endX = OUTPUT_X;

                    if (edge.dstNodeId === "Mixer_Coordinator") {
                        // Negative Gating edge points towards the center entropy pool
                        endY = GRAPH_HEIGHT / 2;
                        isCoordinatorGate = true;
                        endX = OUTPUT_X - 300;
                    } else if (edge.edgeType === 1) { // EdgeTypeCIOH connects input to input
                        endY = tx.inputs.findIndex(inNode => inNode.address === edge.dstNodeId) * inputSpacing + 20;
                        isInputToInput = true;
                        endX = INPUT_X + 200;
                    } else {
                        endY = sortedOutputs.findIndex(outNode => outNode.address === edge.dstNodeId) * outputSpacing + 20;
                    }

                    if (startY < 20 || (endY < 20 && !isCoordinatorGate)) return null;

                    // Style configuration based on Edge properties
                    let strokeColor = "rgba(148, 163, 184, 0.2)"; // Muted default
                    let strokeWidth = 1;
                    let strokeDasharray = "none";

                    if (edge.edgeType === 1) { // Deterministic CIOH Link (Input -> Input)
                        // LLR determines the opacity. A high LLR (e.g. > 1.0) maps to solid.
                        strokeColor = `rgba(239, 68, 68, ${Math.min(0.9, edge.llrScore / 2)})`;
                        strokeWidth = 2;
                    } else if (edge.edgeType === 3) { // Negative Gating (Coinjoin Interception)
                        strokeColor = "rgba(99, 102, 241, 0.5)";
                        strokeWidth = 1.5;
                        strokeDasharray = "4,4"; // Dashed line
                    } else if (edge.edgeType === 2) { // Change Link
                        strokeColor = `rgba(245, 158, 11, ${Math.min(0.8, edge.llrScore / 2)})`; // Amber
                        strokeWidth = 1.5;
                    }

                    // Render Bezier Curves
                    let pathData = "";
                    if (isInputToInput) {
                        // Loop back curve on the left side
                        pathData = `M ${INPUT_X + 200} ${startY + 15} C ${INPUT_X + 260} ${startY + 15}, ${INPUT_X + 260} ${endY + 15}, ${endX} ${endY + 15}`;
                    } else if (isCoordinatorGate) {
                        // Curve into the center 
                        pathData = `M ${INPUT_X + 200} ${startY + 15} C ${INPUT_X + 350} ${startY + 15}, ${endX - 100} ${endY + 15}, ${endX} ${endY}`;
                    } else {
                        // Standard left-to-right
                        pathData = `M ${INPUT_X + 200} ${startY + 15} C ${INPUT_X + 400} ${startY + 15}, ${OUTPUT_X - 100} ${endY + 15}, ${endX} ${endY + 15}`;
                    }

                    return (
                        <path
                            key={edge.edgeId}
                            d={pathData}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            fill="none"
                            className="transition-all duration-300 hover:stroke-indigo-400 hover:stroke-[3px] cursor-pointer drop-shadow-md"
                        >
                            <title>Edge Type: {edge.edgeType} | LLR Score: {edge.llrScore.toFixed(2)}</title>
                        </path>
                    );
                })}
            </svg>

            {/* Inputs Column */}
            <div className="absolute left-8 top-8 bottom-8 w-[200px] overflow-visible">
                <h4 className="text-slate-500 font-bold mb-4 uppercase tracking-widest text-center">Inputs</h4>
                <div className="space-y-1">
                    {tx.inputs.slice(0, 15).map((input, idx) => (
                        <div key={`in-${idx}`} className="bg-slate-900 border border-slate-700 rounded p-2 flex justify-between items-center shadow-lg relative z-10" style={{ height: '30px', marginTop: inputSpacing - 30 }}>
                            <span className="text-cyan-400 truncate w-20" title={input.address}>{input.address.substring(0, 10)}...</span>
                            <span className="text-slate-300 font-bold">{satsToBtc(input.value).toFixed(4)} <span className="text-[9px] text-slate-500">BTC</span></span>
                        </div>
                    ))}
                    {tx.inputs.length > 15 && (
                        <div className="text-center text-slate-500 mt-2 italic">+ {tx.inputs.length - 15} more inputs</div>
                    )}
                </div>
            </div>

            {/* Outputs Column */}
            <div className="absolute right-8 top-8 bottom-8 w-[250px] overflow-visible">
                <h4 className="text-slate-500 font-bold mb-4 uppercase tracking-widest text-center">Outputs</h4>
                <div className="space-y-1">
                    {sortedOutputs.slice(0, 20).map((output, idx) => (
                        <div
                            key={`out-${idx}`}
                            className={`rounded p-2 flex justify-between items-center shadow-lg relative z-10 ${output.isChange ? 'bg-red-950/40 border border-red-900/50' : 'bg-indigo-950/40 border border-indigo-900/50'}`}
                            style={{ height: '24px', marginTop: outputSpacing - 24 }}
                        >
                            <span className={`truncate w-24 ${output.isChange ? 'text-red-400' : 'text-indigo-300'}`} title={output.address}>
                                {output.address.substring(0, 12)}...
                            </span>
                            <div className="flex items-center gap-2">
                                {output.isChange && <span className="text-[8px] bg-red-500/20 text-red-500 px-1 rounded uppercase font-bold">Change</span>}
                                <span className={output.isChange ? 'text-slate-300' : 'text-white font-bold'}>{satsToBtc(output.value).toFixed(4)}</span>
                            </div>
                        </div>
                    ))}
                    {sortedOutputs.length > 20 && (
                        <div className="text-center text-slate-500 mt-2 italic">+ {sortedOutputs.length - 20} more outputs</div>
                    )}
                </div>
            </div>

            {/* Entropy Label (Center) */}
            {(analysis.heuristicFlags & 1) !== 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-950/80 backdrop-blur border border-indigo-500/50 text-indigo-400 px-6 py-3 rounded-full font-bold shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                        ENTROPY <span className="text-white mx-2">|</span> {analysis.anonSet} ANON SET
                    </div>
                </div>
            )}

        </div>
    );
}
