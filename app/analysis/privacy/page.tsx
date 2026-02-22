"use client";

import React, { useState } from 'react';
import { Search, Shield, EyeOff, AlertTriangle, Fingerprint, Activity, Network } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import {
    PrivacyAnalysisResult,
    MockTransaction,
    parseHeuristicBitmask
} from '../../../utils/coinjoinHeuristics';
import CoinjoinFlowGraph from '../../../components/forensics/CoinjoinFlowGraph';


export default function PrivacyAnalysisPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [analysis, setAnalysis] = useState<PrivacyAnalysisResult | null>(null);
    const [txData, setTxData] = useState<MockTransaction | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;

        setIsScanning(true);
        setAnalysis(null);
        setTxData(null);

        try {
            // Hit the Main Backend (API Gateway) which proxies to the Coinjoin Engine
            const response = await fetch(`http://localhost:8080/api/forensics/analyze/${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                throw new Error("Failed to fetch analysis from Go engine");
            }

            const data = await response.json();

            // The Go engine returns perfectly formatted JSON for our frontend models
            setTxData(data.tx);
            setAnalysis(data.analysis);
        } catch (error) {
            console.error(error);
            // Fallback or error state handling could go here
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 p-4 md:p-8 xl:p-12 font-sans text-slate-300">
            <div className="max-w-7xl mx-auto space-y-8">

                <PageHeader
                    title="Privacy & Coinjoin Analysis"
                    subtitle="De-anonymize transactions. Calculate Anonymity Sets and detect obfuscation topologies."
                    icon={<EyeOff className="w-8 h-8 text-indigo-500" />}
                    gradient="from-indigo-500 to-purple-500"
                />

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative max-w-2xl">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Fingerprint className="text-slate-500" size={20} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter TXID to analyze anonymity set (try 'mix' or 'clean')..."
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-4 pl-12 pr-32 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={isScanning}
                        className="absolute inset-y-2 right-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isScanning ? <Activity className="animate-spin" size={16} /> : <Search size={16} />}
                        Analyze
                    </button>
                </form>

                {/* Analysis Results Dashboard */}
                {analysis && txData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase block mb-2">Privacy Score</span>
                                <div className="flex items-end gap-2">
                                    <span className={`text-4xl font-black ${analysis.privacyScore > 70 ? 'text-emerald-500' : analysis.privacyScore > 30 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {analysis.privacyScore}
                                    </span>
                                    <span className="text-slate-500 mb-1">/ 100</span>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase block mb-2">Structure Flags</span>
                                <div className="space-y-1">
                                    {parseHeuristicBitmask(analysis.heuristicFlags).map((flag: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                                            {flag.includes('Coinjoin') || flag.includes('Whirlpool') || flag.includes('Wasabi') ? <Shield size={14} className="text-indigo-400" /> : <AlertTriangle size={14} className="text-red-400" />}
                                            {flag}
                                        </div>
                                    ))}
                                    {parseHeuristicBitmask(analysis.heuristicFlags).length === 0 && <span className="text-slate-500 italic text-sm">No heuristic flags detected.</span>}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase block mb-2 flex items-center gap-1">
                                    Anonymity Set (AnonSet)
                                </span>
                                <span className="text-3xl font-mono font-bold text-white">
                                    {analysis.anonSet}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                    Probability of linking an input to an output: {analysis.anonSet > 0 ? (100 / analysis.anonSet).toFixed(1) + '%' : '100%'}
                                </p>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase block mb-2">Topology</span>
                                <div className="font-mono text-sm space-y-1">
                                    <div><span className="text-slate-500">Inputs:</span> <span className="text-slate-200">{txData.inputs.length}</span></div>
                                    <div><span className="text-slate-500">Outputs:</span> <span className="text-slate-200">{txData.outputs.length}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive UI Graph (Sankey Flow / Clustering) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[600px]">
                            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                <Network className="text-indigo-500" />
                                Interactive Flow Topology
                            </h3>
                            <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden relative">
                                <CoinjoinFlowGraph tx={txData} analysis={analysis} />
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}
