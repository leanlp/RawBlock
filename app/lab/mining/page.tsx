"use client";

import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '../../../components/PageHeader';
import { Pickaxe, History, Clock } from 'lucide-react';
import {
    SimulatorState,
    createInitialState,
    mineNextBlock,
    TARGET_BLOCK_TIME_SECONDS,
    BLOCKS_PER_EPOCH
} from '../../../utils/miningSimulator';
import HashrateControlPanel from '../../../components/lab/HashrateControlPanel';
import DifficultyEpochVisualizer from '../../../components/lab/DifficultyEpochVisualizer';
import { useLearningPath } from '../../../stores/learningPathStore';

export default function MiningSimulatorPage() {
    const BASELINE_HASHRATE = 600; // EH/s

    // Core Simulator State
    const [simState, setSimState] = useState<SimulatorState>(createInitialState(BASELINE_HASHRATE));

    // UI Controls State
    const [targetHashrate, setTargetHashrate] = useState<number>(BASELINE_HASHRATE);
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { completeModule } = useLearningPath();

    // The core loop that "ticks" forward in time
    useEffect(() => {
        if (!isSimulating) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        // We run a "tick" every 50ms to represent mining progression fast enough for a UI 
        // We aren't doing 1:1 real-time (10 minutes per block is too slow for a lab)
        // Let's say we mine 1 block per ~100ms in the UI, adjusted by the difficulty ratio

        intervalRef.current = setInterval(() => {
            setSimState(prev => {
                // If hashrate crashes, block times get longer, meaning we find blocks SLOWER
                // Because we run `mineNextBlock` directly, it instantly jumps the clock forward. 
                // In a true time-based loop, we would increment seconds and check if a block was found. 
                // For this interactive lab, it's cleaner to just "mine" a block on an interval, 
                // and use the interval speed to represent how fast it feels, 
                // while the MATH of `mineNextBlock` accurately records the simulated time elapsed.
                return mineNextBlock(prev, targetHashrate);
            });
        }, 100);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSimulating, targetHashrate]);

    // Check for win condition (1 full epoch completed)
    useEffect(() => {
        if (simState.history.length > 0) {
            completeModule('mining_basics');
        }
    }, [simState.history.length, completeModule]);

    const handleReset = () => {
        setIsSimulating(false);
        setTargetHashrate(BASELINE_HASHRATE);
        setSimState(createInitialState(BASELINE_HASHRATE));
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <PageHeader
                title="Mining & Difficulty Simulator"
                subtitle="Experiment with hashrate shocks to see exactly how the Bitcoin Difficulty Adjustment Algorithm (DAA) forces 10-minute block times and prevents inflation."
                icon={<Pickaxe className="text-indigo-400" size={32} />}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column: Controls & Visualizers */}
                <div className="xl:col-span-2 space-y-8">

                    {/* The Interactive Control Board */}
                    <HashrateControlPanel
                        currentHashrate={targetHashrate}
                        baselineHashrate={BASELINE_HASHRATE}
                        setHashrate={setTargetHashrate}
                        simActive={isSimulating}
                        setSimActive={setIsSimulating}
                        currentDifficulty={simState.currentDifficulty}
                        lastBlockTime={simState.lastBlockTimeSeconds}
                    />

                    {/* The 2016-Block Epoch Progress */}
                    <DifficultyEpochVisualizer
                        blocksInEpoch={simState.blocksInCurrentEpoch}
                        blocksPerEpoch={BLOCKS_PER_EPOCH}
                        simulatedEpochSeconds={simState.simulatedEpochElapsedSeconds}
                        targetSeconds={BLOCKS_PER_EPOCH * TARGET_BLOCK_TIME_SECONDS}
                    />

                </div>

                {/* Right Column: Historical Logs */}
                <div className="flex flex-col gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <History className="text-indigo-400" size={20} />
                                Epoch History Log
                            </h3>
                            <button
                                onClick={handleReset}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors uppercase font-bold tracking-wider"
                            >
                                Reset Lab
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2 custom-scrollbar">
                            {simState.history.length === 0 ? (
                                <div className="text-center text-slate-500 italic py-12">
                                    No epochs completed yet. Let the simulation reach 2016 blocks to trigger an adjustment.
                                </div>
                            ) : (
                                [...simState.history].reverse().map((epoch, idx) => (
                                    <div key={idx} className="bg-slate-950/50 border border-slate-800 p-4 rounded-lg text-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-400 font-bold">Epoch #{epoch.epochNumber}</span>
                                            <span className="text-indigo-400 font-mono">Diff: {Math.round(epoch.startingDifficulty * 100)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-300">
                                            <span className="flex items-center gap-1 text-xs">
                                                <Clock size={12} className="text-slate-500" />
                                                {(epoch.timeToCompleteSeconds / 86400).toFixed(1)} Days
                                            </span>
                                            <span className="font-mono text-xs">{epoch.averageHashrateEH.toFixed(0)} EH/s</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
