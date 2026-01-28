"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";

interface GraffitiMsg {
    txid: string;
    text: string;
    time: number;
}

export default function GraffitiWall() {
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
        <div className="flex flex-col h-[calc(100vh-180px)]">
            <div className="border-b border-green-900/50 pb-4 mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter uppercase text-green-500 font-mono">
                        Graffiti_Wall <span className="animate-pulse">_</span>
                    </h1>
                    <p className="text-[10px] text-green-800 uppercase tracking-widest font-mono mt-1">
                        Live OP_RETURN Scanner
                    </p>
                </div>
                <div className="text-[10px] text-green-900 font-mono">
                    Listening on Port 8333
                </div>
            </div>

            <div className="flex-1 bg-black/95 border border-green-900/50 rounded-lg p-4 overflow-y-auto shadow-[inset_0_0_20px_rgba(0,50,0,0.5)] custom-scrollbar relative font-mono">
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
                            className="mb-4 border-l-2 border-green-900/50 pl-4 py-2 hover:border-green-500 hover:bg-green-900/10 transition-colors group"
                        >
                            <div className="flex gap-2 text-[10px] text-green-800 mb-1 group-hover:text-green-500 font-bold">
                                <span>{formatDate(msg.time)}</span>
                                <span>::</span>
                                <span className="truncate w-32 md:w-auto font-mono opacity-50">{msg.txid}</span>
                            </div>
                            <div className="text-lg text-green-500/90 font-medium break-words leading-relaxed drop-shadow-sm font-mono tracking-wide">
                                &gt; {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-green-900/50 animate-pulse">
                        <div className="text-4xl mb-4">Scanning...</div>
                        <div className="text-xs">Waiting for next block...</div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #000; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #064000; 
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #0f8000; 
                }
            `}</style>
        </div>
    );
}
