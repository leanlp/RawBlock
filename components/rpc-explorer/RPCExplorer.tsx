"use client";

import { useState, useRef, useEffect } from 'react';

// Define Command Type with Template Support
type CommandDef = { cmd: string; desc: string; template?: string };

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
            { cmd: "upgradewallet", desc: "Try to upgrade wallet version (Safe)", template: "upgradewallet 169900" }, // Just a joke/test, maybe unsafe? No, keep it safe.
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
    const [history, setHistory] = useState<Array<{ type: 'cmd' | 'res' | 'err', content: any }>>([
        { type: 'res', content: "Bitcoin Core RPC Explorer v1.0.0\nType 'help' for a list of commands or select from the menu.\n" }
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
        const rawParams = parts.slice(1);

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

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/rpc-playground`, {
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

        } catch (e: any) {
            setHistory(prev => [...prev, { type: 'err', content: "Network Error: " + e.message }]);
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
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-4 p-4 font-mono text-sm">
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
    );
}
