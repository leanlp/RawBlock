"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BalanceChart from '../components/BalanceChart';
import InteractiveScript from '../../components/InteractiveScript';
import { analyzePrivacy } from '../../utils/privacy';
import PrivacyReport from '../../components/PrivacyReport';

// ... interfaces ...
export interface TxInput {
    txid: string;
    vout: number;
    scriptSig: { asm: string; hex: string };
    sequence: number;
    coinbase?: string;
}

export interface TxOutput {
    value: number;
    n: number;
    scriptPubKey: { asm: string; hex: string; address?: string };
}

export interface DecodedTx {
    txid: string;
    hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    vin: TxInput[];
    vout: TxOutput[];
}

interface AddressInfo {
    type: 'address';
    address: string;
    balance: number;
    utxoCount: number;
    scanHeight: number;
    utxos: Array<{
        txid: string;
        vout: number;
        amount: number;
        height: number;
        scriptPubKey: string;
    }>;
}

type DecoderResult = (DecodedTx & { type?: 'transaction' }) | AddressInfo;

function DecoderContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('search');

    const [query, setQuery] = useState(initialSearch || '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DecoderResult | null>(null);
    const [error, setError] = useState('');

    const fetchDecodedTx = async (txQuery: string) => {
        setLoading(true);
        setError('');
        setResult(null); // Clear previous result to center loader
        setQuery(txQuery);

        try {
            const res = await fetch('http://localhost:4000/api/decode-tx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: txQuery })
            });

            const data = await res.json();

            if (!res.ok) {
                // If it's a 404, specifically mention the node index
                if (res.status === 404) {
                    throw new Error("Transaction not found. Your node may be pruning history or lacks -txindex.");
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

    // Type Guard
    const isAddress = (res: DecoderResult): res is AddressInfo => {
        return (res as AddressInfo).balance !== undefined;
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                        {result && isAddress(result) ? 'Address Inspector' : 'Transaction Decoder'}
                    </h1>
                    <a href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                        ← Back to Dashboard
                    </a>
                </div>

                {/* Search Box */}
                <form onSubmit={handleDecode} className="mb-12">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                        <div className="relative flex">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Enter TXID, Address, or Raw Hex..."
                                className="w-full bg-slate-900/90 border border-slate-700 rounded-l-lg py-4 px-6 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-600"
                            />
                            {result && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResult(null);
                                        setQuery('');
                                        setError('');
                                    }}
                                    className="bg-slate-900/90 border-y border-slate-700 px-4 text-slate-500 hover:text-slate-300 transition-colors"
                                    title="Clear Result"
                                >
                                    ✕
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-slate-800 hover:bg-slate-700 border-y border-r border-slate-700 rounded-r-lg px-8 font-bold text-cyan-400 transition-colors disabled:opacity-50"
                            >
                                {loading ? '...' : 'DECODE'}
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}
                </form>

                {/* Loading State */}
                {loading && (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-300 min-h-[50vh]">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-800 border-t-cyan-400 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                        <p className="mt-6 text-slate-500 font-mono text-sm animate-pulse tracking-widest">
                            Scanning Blockchain...
                        </p>
                    </div>
                )}

                {/* Results Container */}
                {result && isAddress(result) ? (
                    /* ADDRESS VIEW */
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Address Overview */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                            </div>

                            <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                                Live Node Scan
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <div className="text-[10px] text-slate-600 mb-2">ADDRESS</div>
                                    <div className="text-lg md:text-2xl text-cyan-300 font-mono break-all select-all">{result.address}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-600 mb-2">CONFIRMED BALANCE</div>
                                    <div className="text-4xl md:text-5xl font-bold text-amber-400 tracking-tight">
                                        {result.balance.toLocaleString()} <span className="text-lg text-amber-400/50">BTC</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Balance Evolution Chart */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                            <BalanceChart utxos={result.utxos} />
                        </div>

                        {/* UTXO List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                UNSPENT OUTPUTS (UTXOs) - {result.utxoCount}
                            </h3>

                            <div className="grid gap-3">
                                {result.utxos.map((utxo, i) => (
                                    <div key={i} className="bg-slate-900/30 border border-slate-800/60 rounded-lg p-4 hover:border-emerald-500/30 transition-colors flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-500">#{i}</span>
                                                <button
                                                    onClick={() => fetchDecodedTx(utxo.txid)}
                                                    className="text-xs font-mono text-cyan-400/80 hover:text-cyan-300 hover:underline break-all"
                                                >
                                                    {utxo.txid}:{utxo.vout}
                                                </button>
                                            </div>
                                            <div className="text-[10px] text-slate-600">Height: {utxo.height}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-emerald-400">{utxo.amount} BTC</div>
                                        </div>
                                    </div>
                                ))}
                                {result.utxos.length === 0 && (
                                    <div className="p-8 text-center text-slate-600 italic border border-slate-800 rounded-lg border-dashed">
                                        No unspent outputs found.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : result && !isAddress(result) ? (
                    /* TRANSACTION VIEW (Existing) */
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* 1. Overview Card */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-4">Transaction Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <div className="text-[10px] text-slate-600 mb-1">TXID</div>
                                    <div className="text-xs text-cyan-300 break-all select-all">{result.txid}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-600 mb-1">SIZE</div>
                                        <div className="text-xl text-slate-200">{result.size} <span className="text-xs text-slate-600">B</span></div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-600 mb-1">VSIZE</div>
                                        <div className="text-xl text-slate-200">{result.vsize} <span className="text-xs text-slate-600">vB</span></div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-600 mb-1">WEIGHT</div>
                                        <div className="text-xl text-slate-200">{result.weight} <span className="text-xs text-slate-600">wu</span></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-600 mb-1">LOCKTIME</div>
                                    <div className="text-xs text-slate-400">{result.locktime}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-600 mb-1">VERSION</div>
                                    <div className="text-xs text-slate-400">{result.version}</div>
                                </div>
                            </div>
                        </div>

                        {/* Privacy Sentinel */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            <PrivacyReport report={analyzePrivacy(result)} />
                        </div>

                        {/* 2. Flow Visualization (Inputs -> Outputs) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Inputs */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                    INPUTS ({result.vin.length})
                                </h3>
                                <div className="space-y-2">
                                    {result.vin.map((vin, i) => (
                                        <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 hover:border-slate-700 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-mono text-slate-600">#{i}</span>
                                            </div>

                                            {!vin.coinbase && (
                                                <>
                                                    <div className="mb-2">
                                                        <div className="text-[10px] text-slate-600">PREVOUT TXID</div>
                                                        <button
                                                            onClick={() => fetchDecodedTx(vin.txid)}
                                                            className="text-xs font-mono text-rose-300/80 break-all hover:text-rose-300 hover:underline text-left"
                                                            title="Click to decode ancestor transaction"
                                                        >
                                                            {vin.txid}
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-600 mb-1">SCRIPT SIG (ASM)</div>
                                                        <div className="text-[10px] font-mono text-slate-500 break-all bg-slate-950/50 p-2 rounded border border-slate-800/30">
                                                            <InteractiveScript asm={vin.scriptSig.asm || 'N/A'} />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {vin.coinbase && (
                                                <div className="text-center py-2">
                                                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">COINBASE (Newly Mined)</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Outputs */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    OUTPUTS ({result.vout.length})
                                </h3>
                                <div className="space-y-2">
                                    {result.vout.map((vout, i) => (
                                        <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 hover:border-slate-700 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-mono text-slate-600">#{i}</span>
                                                <span className="text-sm font-bold text-emerald-400">{vout.value.toFixed(8)} BTC</span>
                                            </div>

                                            <div className="mb-2">
                                                <div className="text-[10px] text-slate-600">ADDRESS</div>
                                                <div className="text-xs font-mono text-slate-300 break-all bg-slate-950/50 p-2 rounded border border-slate-800/50">
                                                    {vout.scriptPubKey.address || 'OP_RETURN / Non-Standard'}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] text-slate-600 mb-1">SCRIPT PUBKEY (ASM)</div>
                                                <div className="text-[10px] font-mono text-slate-500 break-all bg-slate-950/50 p-2 rounded border border-slate-800/30">
                                                    <InteractiveScript asm={vout.scriptPubKey.asm} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </main>
    );
}

export default function DecoderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Decoder...</div>}>
            <DecoderContent />
        </Suspense>
    );
}

