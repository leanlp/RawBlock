import React from 'react';

interface CountryDetailPanelProps {
    countryCode: string; // ISO Code e.g. "US", "DE"
    countryName: string;
    nodes: any[];
    onClose: () => void;
}

export default function CountryDetailPanel({ countryCode, countryName, nodes, onClose }: CountryDetailPanelProps) {
    // Group by city
    const cityStats = nodes.reduce((acc, node) => {
        const city = node.location?.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCities = (Object.entries(cityStats) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // State for display limit and expanded node
    const [limit, setLimit] = React.useState(50);
    const [expandedNodeIndex, setExpandedNodeIndex] = React.useState<number | null>(null);

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-slate-900/95 border-l border-emerald-500/30 shadow-2xl backdrop-blur-xl transform transition-transform duration-300 z-50 overflow-y-auto">
            <div className="p-6">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase relative">
                            {countryName || countryCode}
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-emerald-500 rounded-full"></span>
                        </h2>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                                {nodes.length} ACTIVE NODES
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Top Cities Chart (Text based for now) */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Top Hubs</h3>
                    <div className="space-y-3">
                        {topCities.map(([city, count]) => (
                            <div key={city} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-300 font-medium">{city}</span>
                                        <span className="text-emerald-400 font-mono">{count}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${(count / nodes.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Node List */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Network Intelligence</h3>
                        {nodes.length > 50 && (
                            <button
                                onClick={() => setLimit(limit === 50 ? nodes.length : 50)}
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono border-b border-cyan-500/30"
                            >
                                {limit === 50 ? 'SHOW ALL' : 'SHOW LESS'}
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {nodes.slice(0, limit).map((node, i) => (
                            <div
                                key={i}
                                onClick={() => setExpandedNodeIndex(expandedNodeIndex === i ? null : i)}
                                className={`bg-slate-800/50 p-3 rounded border transition-all cursor-pointer group ${expandedNodeIndex === i ? 'border-emerald-500/50 bg-slate-800' : 'border-slate-700/50 hover:border-emerald-500/30'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-400 font-mono truncate max-w-[55vw] md:max-w-40 group-hover:text-emerald-400 transition-colors">{node.addr}</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                        {node.subver ? node.subver.replace(/\//g, '').substring(0, 15) : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-300">{node.location?.city}</span>
                                    {node.location?.ll && (
                                        <span className="text-[10px] text-emerald-500/70 font-mono tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                            {node.location.ll[0].toFixed(2)}, {node.location.ll[1].toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Expanded Details */}
                                {expandedNodeIndex === i && (
                                    <div className="mt-3 pt-3 border-t border-slate-700/50 text-[10px] font-mono space-y-1 text-slate-400 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between"><span>Services:</span> <span className="text-slate-300">{node.services}</span></div>
                                        <div className="flex justify-between"><span>Time:</span> <span className="text-slate-300">{new Date(node.time * 1000).toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>Coordinates:</span> <span className="text-slate-300">{node.location?.ll.join(', ')}</span></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
