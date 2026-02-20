import { Info } from "lucide-react";

interface ProvenanceBadgeProps {
    source: "Live Node" | "Cached Snapshot" | "Public API Fallback";
    timestamp?: string; // ISO string or human string
    latencyMs?: number;
    className?: string;
}

export default function ProvenanceBadge({ source, timestamp, latencyMs, className = "" }: ProvenanceBadgeProps) {
    const isLive = source === "Live Node";
    const isFallback = source === "Public API Fallback";
    const isCached = source === "Cached Snapshot";

    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded bg-slate-900/50 border border-slate-800 ${className}`}>

            {/* Health / Source Indicator */}
            <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                    {isLive && (
                        <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </>
                    )}
                    {isCached && <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>}
                    {isFallback && <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>}
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    {source}
                </span>
            </div>

            {/* Separator */}
            <div className="w-px h-3 bg-slate-700"></div>

            {/* Metadata (Time / Latency) */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                {timestamp && <span>{timestamp}</span>}
                {latencyMs && <span>{latencyMs}ms</span>}
            </div>

            {/* Explanation Tooltip (Simplified for visual space) */}
            <div className="group relative ml-1 flex items-center justify-center cursor-help">
                <Info size={12} className="text-slate-600 hover:text-slate-400 transition-colors" />
                <div className="absolute top-full right-0 mt-2 w-48 p-2 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    {isLive && "Data served directly from the local node RPC connection via websocket/REST."}
                    {isCached && "Data served from a recent server-side cache to optimize performance."}
                    {isFallback && "Data served from a public external explorer because the local node is unavailable or lacks indexes."}
                </div>
            </div>

        </div>
    );
}
