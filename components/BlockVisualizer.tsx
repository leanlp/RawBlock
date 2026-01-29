"use client";

import { useEffect, useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface BlockTransaction {
    [key: string]: any;
    txid: string;
    weight: number;
    fee: number;
    feeRate: number;
    value: number; // For recharts
    isSegwit?: boolean;
}

interface BlockTemplate {
    height: number;
    totalWeight: number;
    totalFees: number;
    transactions: BlockTransaction[];
}

// Custom Content for Treemap Node
const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, checkMode, isXRay } = props;

    // Fee Rate-based coloring (Heatmap Style)
    // High fee = Hot Pink / Purple
    const feeRate = payload?.feeRate || 1;
    const isSegwit = payload?.isSegwit;

    let color = "#1e293b";

    if (isXRay) {
        // X-Ray Mode: Script Type
        if (isSegwit) {
            color = "#2dd4bf"; // Teal-400 (Modern / SegWit)
        } else {
            color = "#ea580c"; // Orange-600 (Legacy / Rust)
        }
    } else {
        // Default Mode: Fee Heatmap
        if (feeRate > 150) color = "#f472b6";      // Pink-400 (Super Hot)
        else if (feeRate > 100) color = "#e879f9"; // Fuchsia-400
        else if (feeRate > 50) color = "#c084fc";  // Purple-400
        else if (feeRate > 25) color = "#818cf8";  // Indigo-400
        else if (feeRate > 10) color = "#60a5fa";  // Blue-400
        else if (feeRate > 5) color = "#38bdf8";   // Sky-400
        else if (feeRate > 2) color = "#0ea5e9";   // Sky-500
        else color = "#334155";                    // Slate-700 (Cold)
    }

    // Only render if large enough to be seen
    if (width < 2 || height < 2) return null;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: color,
                    stroke: "#020617",
                    strokeWidth: 1,
                    strokeOpacity: 0.5,
                }}
            />
            {width > 60 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={11}
                    fontWeight="bold"
                    pointerEvents="none"
                    opacity={0.9}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                    {isXRay ? (isSegwit ? "MODERN" : "LEGACY") : Math.round(feeRate) + " s/vB"}
                </text>
            )}
        </g>
    );
};

const CustomTooltip = ({ active, payload, isXRay }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 ring-1 ring-cyan-500/20 p-4 rounded-lg shadow-2xl text-xs z-50 min-w-[220px]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${data.isSegwit ? 'bg-teal-400' : 'bg-orange-500'}`}></div>
                    <p className="font-mono text-cyan-100 truncate w-full" title={data.txid}>{data.txid}</p>
                </div>

                <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between items-center text-slate-400">
                        <span>Type</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded ${data.isSegwit ? 'text-teal-400 bg-teal-400/10' : 'text-orange-400 bg-orange-400/10'}`}>
                            {data.isSegwit ? "SegWit / Taproot" : "Legacy"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span>Fee Rate</span>
                        <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">{data.feeRate?.toFixed(2)} sat/vB</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span>Total Fee</span>
                        <span className="text-slate-200">{(data.fee / 100000000).toFixed(6)} BTC</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span>Weight</span>
                        <span className="text-slate-200">{data.weight?.toLocaleString()} wu</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function BlockVisualizer() {
    const [data, setData] = useState<BlockTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [isXRay, setIsXRay] = useState(false);

    const fetchBlock = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/candidate-block');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error("Failed to fetch block", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlock();
        const interval = setInterval(fetchBlock, 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="h-64 animate-pulse bg-slate-900/30 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-sm">LOADING CANDIDATE BLOCK...</div>;
    if (!data) return null;

    const vizData = data.transactions.slice(0, 500);

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex items-center justify-between text-sm px-1">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2 text-base">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                        </span>
                        Next Block Candidate
                    </h3>

                    {/* Toggle Switch */}
                    <button
                        onClick={() => setIsXRay(!isXRay)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all duration-300 ${isXRay ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                        {isXRay ? "🔍 X-RAY: ON" : "👁️ X-RAY: OFF"}
                    </button>

                    {/* Decoder Link (New) */}
                    <a href="/explorer/decoder" className="text-[10px] font-bold px-3 py-1 rounded-full border bg-slate-900 border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-400 transition-all flex items-center gap-1">
                        🛠️ DECODER
                    </a>
                </div>

                <div className="hidden md:flex items-center gap-4 font-mono text-xs bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                    <div className="flex flex-col md:flex-row md:gap-1">
                        <span className="text-slate-500">HEIGHT</span>
                        <span className="text-slate-200 font-bold">{data.height}</span>
                    </div>
                    <div className="w-px h-3 bg-slate-700"></div>
                    <div className="flex flex-col md:flex-row md:gap-1">
                        <span className="text-slate-500">REWARD</span>
                        <span className="text-emerald-400 font-bold">+{(data.totalFees / 100000000).toFixed(3)} BTC</span>
                    </div>
                    <div className="w-px h-3 bg-slate-700"></div>
                    <div className="flex flex-col md:flex-row md:gap-1">
                        <span className="text-slate-500">SIZE</span>
                        <span className="text-slate-200 font-bold">{(data.totalWeight / 4000000).toFixed(2)} MWu</span>
                    </div>
                </div>
            </div>

            {/* Visualization Container */}
            <div className="relative group">
                <div className={`absolute -inset-0.5 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 ${isXRay ? 'bg-gradient-to-r from-teal-500/20 to-orange-500/20' : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20'}`}></div>
                <div className="relative h-[320px] w-full bg-slate-950/50 backdrop-blur-md border border-cyan-500/10 rounded-xl overflow-hidden shadow-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={vizData}
                            dataKey="value"
                            nameKey="txid"
                            aspectRatio={4 / 1}
                            stroke="#020617"
                            fill="#334155"
                            content={<CustomizedContent isXRay={isXRay} />}
                            animationDuration={800}
                        >
                            <Tooltip content={<CustomTooltip isXRay={isXRay} />} cursor={false} />
                        </Treemap>
                    </ResponsiveContainer>

                    {vizData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono">
                            [ EMPTY BLOCK Template ]
                        </div>
                    )}
                </div>
            </div>

            {/* Dynamic Legend */}
            <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {isXRay ? (
                    <>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-600"></span> Legacy</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-teal-400"></span> Modern (SegWit)</span>
                    </>
                ) : (
                    <>
                        <span>Low Fee</span>
                        <div className="h-2 w-32 rounded-full bg-gradient-to-r from-slate-700 via-sky-500 to-fuchsia-500"></div>
                        <span>High Fee</span>
                    </>
                )}
            </div>
        </div>
    );
}
