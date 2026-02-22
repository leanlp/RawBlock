"use client";

import React from 'react';
import { Zap, AlertTriangle, TrendingUp, Cpu } from 'lucide-react';

interface Props {
    currentHashrate: number;
    baselineHashrate: number;
    setHashrate: (val: number) => void;
    simActive: boolean;
    setSimActive: (val: boolean) => void;
    currentDifficulty: number;
    lastBlockTime: number;
}

export default function HashrateControlPanel({
    currentHashrate,
    baselineHashrate,
    setHashrate,
    simActive,
    setSimActive,
    currentDifficulty,
    lastBlockTime
}: Props) {

    // Helper functions for common educational scenarios
    const triggerChinaBan = () => setHashrate(baselineHashrate * 0.45); // Dropped by 55%
    const triggerAsicDeployment = () => setHashrate(baselineHashrate * 1.5); // Spiked 50%
    const resetToBaseline = () => setHashrate(baselineHashrate);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 select-none">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <Cpu className="text-indigo-400" />
                Network Hashrate Controls
            </h3>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Hashrate (Sim)</span>
                    <span className="text-2xl font-mono text-white">{currentHashrate.toFixed(0)} <span className="text-sm text-slate-500">EH/s</span></span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Current Difficulty</span>
                    <span className="text-2xl font-mono text-indigo-400">{currentDifficulty.toFixed(2)}x</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg col-span-2 lg:col-span-1">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Last Block Time</span>
                    <span className={`text-2xl font-mono ${lastBlockTime > 700 ? 'text-red-400' : lastBlockTime < 500 ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {(lastBlockTime / 60).toFixed(1)} <span className="text-sm text-slate-500">min</span>
                    </span>
                    {lastBlockTime > 610 && <span className="text-[10px] text-red-500 block">Slower than target (10 mins)</span>}
                    {lastBlockTime < 590 && <span className="text-[10px] text-emerald-500 block">Faster than target (10 mins)</span>}
                </div>
            </div>

            {/* Slider Control */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                    <label className="text-slate-300 text-sm font-bold">Manual Hashrate Adjustment</label>
                    <span className="text-slate-500 text-xs font-mono">{((currentHashrate / baselineHashrate) * 100).toFixed(0)}% of Baseline</span>
                </div>
                <input
                    type="range"
                    min={baselineHashrate * 0.1}
                    max={baselineHashrate * 3}
                    step={10}
                    value={currentHashrate}
                    onChange={(e) => setHashrate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>

            {/* Scenario Buttons */}
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1"><Zap size={14} /> Quick Scenarios & Shocks</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                <button
                    onClick={triggerChinaBan}
                    className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 text-sm font-bold py-3 px-4 rounded transition-colors flex flex-col items-center justify-center gap-1 group"
                >
                    <AlertTriangle size={16} className="group-hover:scale-110 transition-transform" />
                    <span>Mining Ban (-55%)</span>
                </button>
                <button
                    onClick={triggerAsicDeployment}
                    className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/50 text-emerald-400 text-sm font-bold py-3 px-4 rounded transition-colors flex flex-col items-center justify-center gap-1 group"
                >
                    <TrendingUp size={16} className="group-hover:scale-110 transition-transform" />
                    <span>New ASICs (+50%)</span>
                </button>
                <button
                    onClick={resetToBaseline}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold py-3 px-4 rounded transition-colors col-span-2 md:col-span-1"
                >
                    Reset Baseline
                </button>
            </div>

            {/* Global Simulator Switch */}
            <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                <div>
                    <h4 className="text-white font-bold">Time Simulation</h4>
                    <p className="text-xs text-slate-500">Blocks are mined proportionally to real time.</p>
                </div>
                <button
                    onClick={() => setSimActive(!simActive)}
                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg ${simActive ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                    {simActive ? 'Pause Simulation' : 'Start Mining'}
                </button>
            </div>
        </div>
    );
}
