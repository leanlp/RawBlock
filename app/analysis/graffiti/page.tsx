"use client";

import { useEffect, useState, useRef } from "react";
import Header from "../../../components/Header";
import GraffitiWall from "../../../components/graffiti/GraffitiWall";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";

interface GraffitiMsg {
    txid: string;
    text: string;
    time: number;
}

export default function GraffitiPage() {
    const [messages, setMessages] = useState<GraffitiMsg[]>([]);
    const [socket, setSocket] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch historical (from server memory)
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/graffiti-recent`)
            .then(res => res.json())
            .then(data => setMessages(data as GraffitiMsg[]));

        // Connect Socket
        const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
        setSocket(newSocket);

        newSocket.on('graffiti:new', (msg: GraffitiMsg) => {
            setMessages(prev => [msg, ...prev].slice(0, 100)); // Keep last 100
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleTimeString();
    };

    return (
        <main className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8 selection:bg-green-900 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-8 relative">

                {/* Custom Header for this "Hacker" mode */}
                <div className="border-b border-green-900/50 pb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tighter uppercase glitch-text">
                        Graffiti_Wall <span className="animate-pulse">_</span>
                    </h1>
                    <a href="/" className="text-xs hover:text-green-300 hover:underline">[ RETURN_TO_HOME ]</a>
                </div>

                <div className="bg-black/90 border border-green-800 rounded-sm p-4 h-[80vh] overflow-y-auto shadow-[0_0_20px_rgba(0,255,0,0.1)] custom-scrollbar relative">
                    {/* Matrix Rain Effect Overlay (CSS based simplified) */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://upload.wikimedia.org/wikipedia/commons/1/17/Matrix_digital_rain_banner.png')] bg-repeat bg-contain"></div>

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
                                <div className="flex gap-2 text-[10px] text-green-700 mb-1 group-hover:text-green-400 font-bold">
                                    <span>{formatDate(msg.time)}</span>
                                    <span>::</span>
                                    <span className="truncate w-32 md:w-auto font-mono">{msg.txid}</span>
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
