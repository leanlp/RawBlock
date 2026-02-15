"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// Define Command Type with Template Support
type CommandDef = { cmd: string; desc: string; template?: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
type HistoryEntry =
    | { type: 'cmd'; content: string }
    | { type: 'res' | 'err'; content: unknown };

const BLOCKED_METHODS = new Set(
    [
        // Wallet / key exfiltration
        "dumpprivkey",
        "dumpwallet",
        "importprivkey",
        "importwallet",
        "importmulti",
        "importdescriptors",
        "backupwallet",
        "restorewallet",
        // Spending / signing / funding
        "sendtoaddress",
        "sendmany",
        "sendrawtransaction",
        "fundrawtransaction",
        "signrawtransactionwithwallet",
        "walletpassphrase",
        "walletpassphrasechange",
        "encryptwallet",
        // Node control / policy changes
        "stop",
        "setban",
        "addnode",
        "disconnectnode",
        "setnetworkactive",
        "invalidateblock",
        "reconsiderblock",
        "rescanblockchain",
        // Wallet management
        "createwallet",
        "loadwallet",
        "unloadwallet",
        "setwalletflag",
        // Mining / submission
        "submitblock",
    ].map((m) => m.toLowerCase()),
);

const COMMAND_GROUPS: { category: string; commands: CommandDef[] }[] = [
    {
        category: "Blockchain",
        commands: [
            { cmd: "getblockchaininfo", desc: "State of the Blockchain" },
            { cmd: "getblockcount", desc: "Current Block Height" },
            { cmd: "getbestblockhash", desc: "Hash of latest block" },
            { cmd: "getdifficulty", desc: "Current Mining Difficulty" },
            { cmd: "getchaintips", desc: "View all known branches" },
        ]
    },
    {
        category: "Network",
        commands: [
            { cmd: "getnetworkinfo", desc: "Node Network State" },
            { cmd: "getpeerinfo", desc: "Connected Peers Details" },
            { cmd: "getconnectioncount", desc: "Total Connections" },
            { cmd: "getnettotals", desc: "Bandwidth Usage" },
        ]
    },
    {
        category: "Mempool",
        commands: [
            { cmd: "getmempoolinfo", desc: "Mempool Summary" },
            { cmd: "getrawmempool", desc: "All TXIDs (Heavy!)" },
        ]
    },
    {
        category: "Mining",
        commands: [
            { cmd: "getmininginfo", desc: "Mining Status" },
            { cmd: "getnetworkhashps", desc: "Est. Network Hashrate" },
        ]
    },
    {
        category: "Advanced Analytics",
        commands: [
            { cmd: "gettxoutsetinfo", desc: "Scan UTXO Set Global Stats (Slow)" },
            { cmd: "getchaintxstats", desc: "Transaction Throughput Stats" },
            { cmd: "getblockstats", desc: "Stats for a specific block", template: "getblockstats <height>" },
        ]
    },
    {
        category: "Utilities & Control",
        commands: [
            { cmd: "validateaddress", desc: "Check address validity", template: "validateaddress <addr>" },
            { cmd: "decodescript", desc: "Decode Hex Script", template: "decodescript <hex>" },
            { cmd: "getmemoryinfo", desc: "RAM Usage Stats" },
            { cmd: "getrpcinfo", desc: "Active RPC Calls" },
        ]
    },
    {
        category: "Wallet (Read-Only)",
        commands: [
            { cmd: "getwalletinfo", desc: "Wallet Status & Balance" },
            { cmd: "getbalances", desc: "Breakdown of balances" },
            { cmd: "listunspent", desc: "List UTXOs", template: "listunspent 0 999999" }, // Default args for convenience
            { cmd: "listtransactions", desc: "Recent Transactions", template: "listtransactions \"*\" 10" },
        ]
    }
];

export default function RPCExplorer() {
    const isDemoMode = !API_URL;
    const [history, setHistory] = useState<HistoryEntry[]>([
        {
            type: 'res',
            content: isDemoMode
                ? "Bitcoin Core RPC Explorer v1.0.0 (Demo Mode)\nLive RPC backend is unavailable in this deployment.\nType 'help' for a list of commands.\n"
                : "Bitcoin Core RPC Explorer v1.0.0\nType 'help' for a list of commands or select from the menu.\n",
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const executeCommand = async (cmdString: string) => {
        if (!cmdString.trim()) return;

        const parts = cmdString.trim().split(/\s+/); // Split by any whitespace
        const method = parts[0];
        const normalizedMethod = method.toLowerCase();
        const rawParams = parts.slice(1);

        if (BLOCKED_METHODS.has(normalizedMethod)) {
            setHistory((prev) => [
                ...prev,
                { type: "cmd", content: cmdString },
                {
                    type: "err",
                    content:
                        `Blocked for safety: '${method}'.\n` +
                        "This web console is designed for read-only exploration. Use direct RPC on your own node for wallet/spending/control commands.",
                },
            ]);
            setInput("");
            setLoading(false);
            return;
        }

        // Intelligent Parameter Parsing
        const params = rawParams.map(p => {
            // 1. Handle Numbers (integers or floats)
            // We check if it matches a number regex AND is not an empty string
            if (/^-?\d+(\.\d+)?$/.test(p)) {
                return Number(p);
            }
            // 2. Handle Booleans
            if (p.toLowerCase() === 'true') return true;
            if (p.toLowerCase() === 'false') return false;

            // 3. Fallback to String (handle quoted strings if needed in future, but raw for now)
            return p;
        });

        setHistory(prev => [...prev, { type: 'cmd', content: cmdString }]);
        setLoading(true);
        setInput('');

        if (isDemoMode) {
            const demoMethod = method.toLowerCase();
            const demoResults: Record<string, unknown> = {
                getblockcount: 936310,
                getbestblockhash: "00000000000000000000d2f42650e9f4b90e26e9a7f3f173a972ee41cf2b8f95",
                getdifficulty: 104000000000.0,
                getconnectioncount: 8,
                getnetworkhashps: 680000000000000000,
                getmempoolinfo: { loaded: true, size: 14322, bytes: 33429876, usage: 186542208 },
                getblockchaininfo: { chain: "main", blocks: 936310, headers: 936310, verificationprogress: 0.99999 },
                getnetworkinfo: { version: 260000, subversion: "/Satoshi:26.0.0/", connections: 8, relayfee: 0.00001 },
                getmininginfo: { blocks: 936310, networkhashps: 680000000000000000, pooledtx: 14322, chain: "main" },
            };

            setTimeout(() => {
                if (demoMethod === "help") {
                    setHistory((prev) => [
                        ...prev,
                        {
                            type: 'res',
                            content:
                                "Demo mode supports a subset of read-only commands:\n" +
                                Object.keys(demoResults).sort().join(", "),
                        },
                    ]);
                    setLoading(false);
                    return;
                }
                const result = demoResults[demoMethod];
                if (result === undefined) {
                    setHistory((prev) => [
                        ...prev,
                        { type: 'err', content: `Demo mode: '${method}' is not available without a live RPC backend.` },
                    ]);
                } else {
                    setHistory((prev) => [...prev, { type: 'res', content: result }]);
                }
                setLoading(false);
            }, 220);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/rpc-playground`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method, params })
            });

            const data = await res.json();

            if (data.error) {
                setHistory(prev => [...prev, { type: 'err', content: data.error + (data.hint ? `\nHint: ${data.hint}` : '') }]);
            } else {
                setHistory(prev => [...prev, { type: 'res', content: data.result }]);
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            setHistory(prev => [...prev, { type: 'err', content: "Network Error: " + message }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            executeCommand(input);
        }
    };

    return (
        <div className="space-y-3 p-4 font-mono text-sm">
            <div className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-slate-300">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="font-bold text-slate-200">Safety notice</div>
                        <div className="text-slate-400">
                            Avoid wallet, spending, or node-control commands. High-risk RPC methods are blocked in this web console.
                        </div>
                        <div className="mt-1 text-slate-500">
                            Mode: {isDemoMode ? "Demo (no backend)" : "Live (backend-connected)"}.
                        </div>
                    </div>
                    <Link
                        href="/about"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 text-[11px] font-bold text-slate-200 hover:border-cyan-500/40 hover:text-cyan-200"
                    >
                        About & Trust
                    </Link>
                </div>
            </div>
            {isDemoMode ? (
                <div className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                    Demo mode: live RPC backend is unavailable. Read-only sample responses are shown.
                </div>
            ) : null}
            <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-4">
            {/* Sidebar - Learning Menu */}
            <div className="w-full lg:w-64 lg:flex-shrink-0 bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden flex flex-col max-h-80 lg:max-h-none">
                <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-slate-400">
                    COMMAND LIBRARY
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                    {COMMAND_GROUPS.map((group) => (
                        <div key={group.category}>
                            <div className="text-xs font-bold text-cyan-500/80 mb-2 uppercase tracking-wider px-2">
                                {group.category}
                            </div>
                            <div className="space-y-1">
                                {group.commands.map((c) => (
                                    <button
                                        key={c.cmd}
                                        onClick={() => {
                                            setInput(c.template || c.cmd);
                                            // Focus input if it's a template
                                            if (c.template) {
                                                setTimeout(() => {
                                                    const el = document.getElementById('rpc-input') as HTMLInputElement;
                                                    if (el) {
                                                        el.focus();
                                                    }
                                                }, 50);
                                            }
                                        }}
                                        className="w-full text-left px-2 py-2 min-h-11 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors group"
                                    >
                                        <div className="font-bold">{c.cmd}</div>
                                        <div className="text-[10px] text-slate-600 group-hover:text-slate-500">{c.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Terminal Window */}
            <div className="flex-1 min-h-[500px] lg:min-h-0 bg-black/90 border border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col relative">
                {/* Terminal Header */}
                <div className="bg-slate-900 py-2 px-4 flex items-center justify-between border-b border-slate-800">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="text-slate-500 text-xs">user@bitcoin-core:~</div>
                </div>

                {/* Output Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" onClick={() => document.getElementById('rpc-input')?.focus()}>
                    {history.map((entry, i) => (
                        <div key={i} className={`break-words ${entry.type === 'err' ? 'text-red-400' : 'text-slate-300'}`}>
                            {entry.type === 'cmd' && (
                                <div className="flex gap-2 text-cyan-400 font-bold mt-4">
                                    <span>➜</span>
                                    <span>{entry.content}</span>
                                </div>
                            )}
                            {entry.type !== 'cmd' && (
                                <pre className="whitespace-pre-wrap ml-5 mt-1 text-xs md:text-sm text-slate-400/90 font-mono">
                                    {typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="ml-5 mt-1 text-cyan-500 animate-pulse">Processing...</div>
                    )}
                    <div ref={bottomRef}></div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">➜</span>
                    <input
                        id="rpc-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent focus:outline-none text-slate-200 placeholder-slate-600"
                        placeholder="Type a command (e.g. getblockchaininfo)..."
                        autoComplete="off"
                        autoFocus
                    />
                    <button
                        onClick={() => executeCommand(input)}
                        className="bg-slate-800 hover:bg-slate-700 px-4 py-2 min-h-11 rounded text-xs text-slate-300 transition-colors"
                    >
                        EXEC
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
}
