"use client";

import React from 'react';

interface Props {
    blocksInEpoch: number;
    blocksPerEpoch: number;
    simulatedEpochSeconds: number;
    targetSeconds: number; // usually 10 min * 2016
}

export default function DifficultyEpochVisualizer({ blocksInEpoch, blocksPerEpoch, simulatedEpochSeconds, targetSeconds }: Props) {

    // Calculate progress through epoch
    const progressPercent = Math.min(100, (blocksInEpoch / blocksPerEpoch) * 100);

    // Calculate if we are ahead or behind schedule
    // If we've mined 50% of the blocks, we should be at 50% of the target time
    const expectedSeconds = targetSeconds * (blocksInEpoch / blocksPerEpoch);
    const differenceSeconds = simulatedEpochSeconds - expectedSeconds;

    const isAhead = differenceSeconds < 0; // Blocks found faster than expected
    const isBehind = differenceSeconds > 0; // Blocks found slower than expected

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 select-none font-mono">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm">Epoch Progress</h3>
                <span className="text-indigo-400 font-bold">
                    {blocksInEpoch} / {blocksPerEpoch} <span className="text-slate-600 text-xs">Blocks</span>
                </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="relative h-6 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                {/* The Target Line Marker (100% Time) */}
                <div
                    className={`absolute inset-y-0 bg-indigo-600/50 transition-all duration-300 ease-out`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500 block mb-1">Time Elapsed</span>
                    <span className="text-slate-200">{(simulatedEpochSeconds / 86400).toFixed(1)} Days</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500 block mb-1">Pacing Status</span>
                    {blocksInEpoch === 0 ? (
                        <span className="text-slate-400">Neutral</span>
                    ) : isAhead ? (
                        <span className="text-emerald-500 font-bold">Ahead of Schedule</span>
                    ) : isBehind ? (
                        <span className="text-red-500 font-bold">Behind Schedule</span>
                    ) : (
                        <span className="text-slate-400">On Target</span>
                    )}
                </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 text-center italic">
                The network targets 2016 blocks every 14 days. If the epoch completes faster, difficulty increases. If slower, difficulty decreases.
            </div>
        </div>
    );
}
