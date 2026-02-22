import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Fingerprint } from 'lucide-react';

interface UTXO {
    txid: string;
    vout: number;
    amount?: number;
    value?: number;
    scriptPubKey?: any;
}

interface UTXOClusterChartProps {
    utxos: UTXO[];
    entityName?: string;
}

const COLORS = ['#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3'];
const COINJOIN_THRESHOLD = 0.001; // Example threshold for common output sizes

export default function UTXOClusterChart({ utxos, entityName = "Unknown Entity" }: UTXOClusterChartProps) {
    const { chartData, entropy, isPossibleCoinjoin } = useMemo(() => {
        if (!utxos || utxos.length === 0) return { chartData: [], entropy: 0, isPossibleCoinjoin: false };

        const valueMap = new Map<number, number>();
        let totalValue = 0;

        utxos.forEach(utxo => {
            let val = utxo.value !== undefined ? utxo.value : (utxo.amount || 0);
            if (typeof val === 'string') val = parseFloat(val);

            // Group by rounded value (e.g., to 4 decimal places) to find common outputs
            const roundedVal = Number(val.toFixed(4));

            valueMap.set(roundedVal, (valueMap.get(roundedVal) || 0) + 1);
            totalValue += val;
        });

        // Calculate Shannon Entropy
        let currentEntropy = 0;
        const data: any[] = [];

        valueMap.forEach((count, val) => {
            const probability = count / utxos.length;
            currentEntropy -= probability * Math.log2(probability);
            data.push({ name: `${val} BTC`, value: count, rawValue: val });
        });

        // Heuristic for Coinjoin: high entropy of identical outputs (low variance in output sizes, many identical)
        // Or simply: many outputs of the exact same size
        let maxIdenticalOutputs = 0;
        valueMap.forEach(count => {
            if (count > maxIdenticalOutputs) maxIdenticalOutputs = count;
        });

        const isPossibleCJ = utxos.length > 5 && (maxIdenticalOutputs / utxos.length) > 0.4;

        return {
            chartData: data.sort((a, b) => b.value - a.value),
            entropy: currentEntropy,
            isPossibleCoinjoin: isPossibleCJ
        };
    }, [utxos]);

    if (!utxos || utxos.length === 0) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
                No UTXO data available for cluster analysis.
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-6 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-cyan-400" />
                        UTXO Cluster Analysis
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Entity: {entityName}</p>
                </div>
                {isPossibleCoinjoin && (
                    <div className="bg-purple-500/10 border border-purple-500/50 text-purple-400 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 animate-pulse">
                        <ShieldAlert className="w-3 h-3" />
                        Probable Coinjoin
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/50">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Set Entropy</div>
                    <div className="text-lg font-mono text-cyan-300 font-medium">
                        {entropy.toFixed(2)} <span className="text-[10px] text-slate-500">bits</span>
                    </div>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/50">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">UTXO Count</div>
                    <div className="text-lg font-mono text-white font-medium">{utxos.length}</div>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/50">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Concentration</div>
                    <div className="text-lg font-mono text-amber-300 font-medium">
                        {chartData.length > 0 ? ((chartData[0].value / utxos.length) * 100).toFixed(1) : 0}%
                    </div>
                </div>
            </div>

            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', fontSize: '12px' }}
                            itemStyle={{ color: '#67e8f9' }}
                            formatter={(value: any, name: any) => [`${value} outputs`, `Size: ${name}`]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 text-[10px] text-slate-500 text-center">
                * High entropy implies diverse output sizes. Low entropy with many inputs suggests coin mixing behavior.
            </div>
        </div>
    );
}
