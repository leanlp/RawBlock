"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Header from "../../../components/Header";

export const dynamic = "force-dynamic";

interface GraffitiMsg {
    txid: string;
    text: string;
    time: number;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default function GraffitiPage() {
    const [messages, setMessages] = useState<GraffitiMsg[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const controller = new AbortController();
        // Fetch historical (from server memory)
        fetch(`${API_BASE_URL}/api/graffiti-recent`, { signal: controller.signal, cache: "no-store" })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setMessages(Array.isArray(data) ? (data as GraffitiMsg[]) : []))
            .catch((err) => {
                const message =
                    typeof err === "object" && err !== null && "message" in err
                        ? String((err as { message?: unknown }).message ?? "")
                        : String(err ?? "");
                const isAbortError =
                    controller.signal.aborted ||
                    (err instanceof DOMException && err.name === "AbortError") ||
                    (typeof err === "object" &&
                        err !== null &&
                        "name" in err &&
                        (err as { name?: string }).name === "AbortError") ||
                    message.toLowerCase().includes("abort");
                if (isAbortError) return;
                setMessages([]);
            });

        let socket: WebSocket | null = null;
        try {
            const wsBase = API_BASE_URL.replace(/^http/i, "ws").replace(/\/$/, "");
            socket = new WebSocket(`${wsBase}/ws`);
            socket.onopen = () => {};
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(String(event.data ?? "{}")) as { type?: string; payload?: unknown };
                    if (data?.type !== "graffiti:new") return;
                    const msg = data.payload as GraffitiMsg;
                    if (!msg?.txid || !msg?.text) return;
                    setMessages((prev) => [msg, ...prev].slice(0, 100));
                } catch {
                    // Ignore malformed websocket payloads.
                }
            };
            socket.onerror = () => {};
            socket.onclose = () => {};
        } catch {
            // No websocket available: history-only mode.
        }

        return () => {
            controller.abort();
            socket?.close();
        };
    }, []);

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleTimeString();
    };

    return (
        <main className="min-h-screen overflow-x-hidden bg-black text-green-500 font-mono p-4 md:p-8 selection:bg-green-900 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-8 relative">
                <div className="md:hidden">
                    <Header />
                </div>

                {/* Custom Header for this "Hacker" mode */}
                <div className="border-b border-green-900/50 pb-6 flex flex-wrap justify-between items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tighter uppercase glitch-text">
                        Graffiti_Wall <span className="animate-pulse">_</span>
                    </h1>
                    <Link href="/" className="text-xs hover:text-green-300 hover:underline inline-flex items-center min-h-11">[ RETURN_TO_HOME ]</Link>
                </div>

                <div className="bg-black/90 border border-green-800 rounded-sm p-4 h-[80vh] overflow-y-auto shadow-[0_0_20px_rgba(0,255,0,0.1)] custom-scrollbar relative">
                    {/* Matrix Rain Effect Overlay (CSS based simplified) */}
                    <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.18),transparent_60%)]"></div>

                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.txid + msg.time}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mb-4 border-l-2 border-green-900 pl-4 py-2 hover:border-green-500 hover:bg-green-900/10 transition-colors group"
                            >
                                <div className="mb-1 flex min-w-0 gap-2 text-[10px] font-bold text-green-700 group-hover:text-green-400">
                                    <span>{formatDate(msg.time)}</span>
                                    <span>::</span>
                                    <span className="min-w-0 flex-1 truncate font-mono">{msg.txid}</span>
                                </div>
                                <div className="text-lg md:text-xl text-green-400 font-medium break-words leading-relaxed shadow-black drop-shadow-sm">
                                    &gt; {msg.text}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-green-900 animate-pulse">
                            <div className="text-4xl mb-4">Scanning...</div>
                            <div className="text-xs">Listening for OP_RETURN payloads on port 8333</div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="text-center text-[10px] text-green-900 uppercase">
                    Monitoring Mempool Feed...
                </div>

            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #001100; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #004400; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #006600; 
                }
            `}</style>
        </main>
    );
}
