"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BalanceChart from '../../components/BalanceChart';
import InteractiveScript from '../../../components/InteractiveScript';
import { analyzePrivacy } from '../../../utils/privacy';
import PrivacyReport from '../../../components/PrivacyReport';

// --- Interfaces ---
export interface TxInput {
    is_coinbase: boolean;
    txid: string;
    vout: number;
    scriptsig: string; // Hex
    scriptsig_asm: string;
    sequence: number;
    prevout?: {
        scriptpubkey: string;
        scriptpubkey_asm: string;
        scriptpubkey_type: string;
        scriptpubkey_address: string;
        value: number; // Sats
    };
    witness?: string[];
    inner_redeemscript_asm?: string;
}

export interface TxOutput {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    value: number; // Sats
}

export interface DecodedTx {
    txid: string;
    version: number;
    locktime: number;
    vin: TxInput[];
    vout: TxOutput[];
    size: number;
    weight: number;
    fee: number;
    status: {
        confirmed: boolean;
        block_height: number;
        block_hash: string;
        block_time: number;
    };
}

function DecoderContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('query');

    const [query, setQuery] = useState(initialSearch || '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DecodedTx | null>(null); // Only TX support for now in v2
    const [error, setError] = useState('');

    const fetchDecodedTx = async (txQuery: string) => {
        setLoading(true);
        setError('');
        setResult(null);
        setQuery(txQuery);

        try {
            // Use local API that proxies Electrs
            const res = await fetch('/api/decode-tx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: txQuery })
            });

            const data = await res.json();

            if (!res.ok) {
                // If it's a 404, specifically mention the indexer
                if (res.status === 404) {
                    throw new Error("Transaction not found in Indexer.");
                }
                throw new Error(data.error || 'Failed to decode');
            }
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDecode = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDecodedTx(query);
    };

    // Auto-search if URL param exists
    useEffect(() => {
        if (initialSearch) {
            fetchDecodedTx(initialSearch);
        }
    }, [initialSearch]);

    // Format helper
    const formatSats = (sats: number) => (sats / 100000000).toFixed(8);
    const getFeeRate = (tx: DecodedTx) => (tx.fee / (tx.weight / 4)).toFixed(2);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-mono relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                        Transaction Decoder 2.0
                    </h1>
                    <a href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                        ← Back to Dashboard
                    </a>
                </div>

                {/* Search Box */}
                <form onSubmit={handleDecode} className="mb-8">
                    <div className="relative flex shadow-2xl">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter Transaction ID (TXID)"
                            className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-l-lg py-4 px-6 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-600 transition-all font-mono"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-cyan-900/20 hover:bg-cyan-900/40 border-y border-r border-slate-700 rounded-r-lg px-8 font-bold text-cyan-400 transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : 'SEARCH'}
                        </button>
                    </div>
                    {error && (
                        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                            <span>⚠️</span> <span>{error}</span>
                        </div>
                    )}
                </form>

                {/* Results View */}
                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* 1. Header Metadata Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Transaction ID</div>
                                    <div className="text-sm md:text-base font-mono text-white select-all break-all">{result.txid}</div>
                                </div>
                                <div className="flex gap-2">
                                    {result.status.confirmed ? (
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                            Confirmed (Block {result.status.block_height})
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 animate-pulse">
                                            Unconfirmed (Mempool)
                                        </span>
                                    )}
                                    {result.locktime > 0 && <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">Locktime: {result.locktime}</span>}
                                    <span className="px-3 py-1 rounded-full bg-indigo-900/30 text-indigo-400 text-xs border border-indigo-500/20">v{result.version}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                                <div>
                                    <div className="text-[10px] text-slate-500 mb-1">FEE</div>
                                    <div className="text-sm font-mono text-slate-200">{formatSats(result.fee)} BTC</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 mb-1">FEE RATE</div>
                                    <div className="text-sm font-mono text-slate-200">{getFeeRate(result)} sat/vB</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 mb-1">WEIGHT</div>
                                    <div className="text-sm font-mono text-slate-200">{result.weight} wu</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 mb-1">SIZE</div>
                                    <div className="text-sm font-mono text-slate-200">{result.size} B</div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Visual Flow (Inputs -> Outputs) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                            {/* Central Arrow (Desktop Only) */}
                            <div className="hidden lg:flex absolute left-1/2 top-10 -translate-x-1/2 z-10 text-slate-700">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
                            </div>

                            {/* Inputs Column */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 bg-rose-500 rounded-full"></span> Inputs ({result.vin.length})
                                </h3>

                                {result.vin.map((vin, i) => (
                                    <div key={i} className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/30 transition-all rounded-lg p-4 group relative overflow-hidden">
                                        {vin.is_coinbase ? (
                                            <div className="flex items-center justify-center h-20">
                                                <span className="text-amber-500 font-bold bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-500/20">🏆 Coinbase (Newly Mined)</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="text-xs font-mono text-rose-300 break-all bg-rose-900/10 px-2 py-1 rounded hover:bg-rose-900/20 transition-colors cursor-pointer" title="Previous Output Address">
                                                        {vin.prevout?.scriptpubkey_address || 'Non-Standard Decoder'}
                                                    </div>
                                                    <div className="text-sm font-bold text-rose-400 whitespace-nowrap ml-2">
                                                        {formatSats(vin.prevout?.value || 0)} BTC
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div>
                                                        <div className="text-[9px] text-slate-600 mb-1 uppercase">Previous TxID</div>
                                                        <a href={`?query=${vin.txid}`} className="text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-colors break-all block truncate">
                                                            {vin.txid}:{vin.vout}
                                                        </a>
                                                    </div>
                                                    {vin.scriptsig_asm && (
                                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/50">
                                                            <div className="text-[9px] text-slate-600 mb-1">SCRIPT SIG</div>
                                                            <InteractiveScript asm={vin.scriptsig_asm} />
                                                        </div>
                                                    )}
                                                    {vin.witness && (
                                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/50">
                                                            <div className="text-[9px] text-slate-600 mb-1">WITNESS DATA</div>
                                                            <div className="text-[10px] font-mono text-slate-500 truncate">{vin.witness.join(' ')}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Outputs Column */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 lg:justify-end">
                                    Outputs ({result.vout.length}) <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                </h3>

                                {result.vout.map((vout, i) => (
                                    <div key={i} className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all rounded-lg p-4 relative group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="text-xs font-mono text-emerald-300 break-all bg-emerald-900/10 px-2 py-1 rounded hover:bg-emerald-900/20 transition-colors cursor-pointer">
                                                {vout.scriptpubkey_address || (vout.scriptpubkey_type === 'op_return' ? 'OP_RETURN' : 'Non-Standard')}
                                            </div>
                                            <div className="text-sm font-bold text-emerald-400 whitespace-nowrap ml-2">
                                                {formatSats(vout.value)} BTC
                                            </div>
                                        </div>

                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/50">
                                            <div className="text-[9px] text-slate-600 mb-1">SCRIPT PUBKEY</div>
                                            <InteractiveScript asm={vout.scriptpubkey_asm} />
                                        </div>
                                    </div>
                                ))}

                                {/* Total Logic */}
                                <div className="flex justify-end mt-4 pt-4 border-t border-slate-800">
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 uppercase">Total Output</div>
                                        <div className="text-xl font-bold text-slate-200">
                                            {formatSats(result.vout.reduce((a, b) => a + b.value, 0))} <span className="text-sm text-slate-500">BTC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function DecoderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Decoder 2.0...</div>}>
            <DecoderContent />
        </Suspense>
    );
}
