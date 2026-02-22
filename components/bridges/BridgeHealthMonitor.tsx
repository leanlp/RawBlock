import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface BridgeEvent {
    timestamp: string;
    pegInVolume: number; // BTC flowing into the bridge
    pegOutVolume: number; // BTC flowing out of the bridge
    tvl: number; // Total Value Locked at this timestamp
}

interface BridgeHealthMonitorProps {
    bridgeName: string;
    data: BridgeEvent[];
}

export default function BridgeHealthMonitor({ bridgeName, data }: BridgeHealthMonitorProps) {
    // Basic Anomaly Detection Heuristic: 
    // If PegOut within a single period is > 10% of total TVL or > 5x the average PegOut, flag it.
    const { chartData, hasAnomaly, anomalyDetails } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], hasAnomaly: false, anomalyDetails: null };

        let totalPegOut = 0;
        data.forEach(d => totalPegOut += d.pegOutVolume);
        const avgPegOut = totalPegOut / data.length;

        let detectedAnomaly = false;
        let details = '';

        const chartFormatted = data.map(d => {
            const isAnomalous = d.pegOutVolume > (d.tvl * 0.1) || d.pegOutVolume > (avgPegOut * 5);
            if (isAnomalous) {
                detectedAnomaly = true;
                details = `Warning: Massive peg-out detected on ${new Date(d.timestamp).toLocaleDateString()}. ${d.pegOutVolume.toFixed(2)} BTC removed.`;
            }

            return {
                ...d,
                timeLabel: new Date(d.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                anomalyFlag: isAnomalous ? 1 : 0 // For rendering a warning dot on the chart (future enhancement)
            };
        });

        return { chartData: chartFormatted, hasAnomaly: detectedAnomaly, anomalyDetails: details };
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="p-4 text-slate-500 text-sm border-slate-800 border rounded-xl">No bridge data.</div>;
    }

    const currentTVL = data[data.length - 1].tvl;
    const tvlChange = currentTVL - data[0].tvl;

    return (
        <div className={`bg-slate-900/50 border rounded-xl p-4 md:p-6 transition-all ${hasAnomaly ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-slate-800'}`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{bridgeName} Analytics</h3>
                    <div className="flex items-center gap-4 text-sm mt-2">
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Current TVL</span>
                            <span className="font-mono text-cyan-400">{currentTVL.toLocaleString()} BTC</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800"></div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">30d Net Flow</span>
                            <span className={`font-mono ${tvlChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {tvlChange > 0 ? '+' : ''}{tvlChange.toLocaleString()} BTC
                            </span>
                        </div>
                    </div>
                </div>

                {hasAnomaly ? (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-2 rounded-lg text-xs flex items-center gap-2 max-w-xs animate-in fade-in slide-in-from-top-4">
                        <ShieldAlert size={16} className="shrink-0" />
                        <span>{anomalyDetails}</span>
                    </div>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Output Normal
                    </div>
                )}
            </div>

            <div className="h-64 mt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="pegInGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="pegOutGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="timeLabel"
                            stroke="#475569"
                            fontSize={10}
                            tickMargin={10}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#475569"
                            fontSize={10}
                            tickFormatter={(v) => `${v}`}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="pegInVolume"
                            name="Peg-In (BTC)"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#pegInGrad)"
                        />
                        <Area
                            type="monotone"
                            dataKey="pegOutVolume"
                            name="Peg-Out (BTC)"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#pegOutGrad)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ArrowDownToLine size={14} className="text-emerald-500" />
                    Peg-Ins (Deposits to bridge)
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ArrowUpFromLine size={14} className="text-red-500" />
                    Peg-Outs (Withdrawals from bridge)
                </div>
            </div>
        </div>
    );
}
