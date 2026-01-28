"use client";

import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface BalanceChartProps {
    utxos: Array<{
        amount: number;
        height: number;
    }>;
}

export default function BalanceChart({ utxos }: BalanceChartProps) {
    const chartData = useMemo(() => {
        // 1. Sort UTXOs by height (ascending) - Oldest first
        const sortedUtxos = [...utxos].sort((a, b) => a.height - b.height);

        // 2. Calculate cumulative balance
        let runningBalance = 0;
        const dataPoints: Array<{ block: number; balance: number }> = [];

        // Add initial point (0 balance before first UTXO)
        if (sortedUtxos.length > 0) {
            dataPoints.push({ block: Math.max(0, sortedUtxos[0].height - 1), balance: 0 });
        }

        // Process each UTXO
        sortedUtxos.forEach(utxo => {
            runningBalance += utxo.amount;
            // We push a point for this block accumulated
            // Note: If multiple UTXOs in same block, this simplifies to one step per UTXO
            // Ideally we'd group by block, but for visualization fine-grained is also okay.
            dataPoints.push({
                block: utxo.height,
                balance: runningBalance
            });
        });

        // 3. Add a "Now" point if last UTXO wasn't recent, to extend the line
        // We don't have current tip height passed in, but we can assume the line holds flat
        if (dataPoints.length > 0) {
            const lastPoint = dataPoints[dataPoints.length - 1];
            // Just extend slightly or leave as is. Recharts will draw to the end.
        }

        return dataPoints;
    }, [utxos]);

    if (chartData.length === 0) return null;

    return (
        <div className="w-full h-[300px] bg-slate-900/30 rounded-xl border border-slate-800/50 p-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-full"></div>
                Balance Evolution (HODL Wave)
            </h3>
            <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="block"
                            stroke="#64748b"
                            fontSize={10}
                            tickFormatter={(val) => `#${val}`}
                            minTickGap={50}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickFormatter={(val) => `${val.toFixed(2)}`}
                            width={60}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                            itemStyle={{ color: '#22d3ee' }}
                            labelStyle={{ color: '#94a3b8' }}
                            formatter={(value: any) => [`${Number(value).toFixed(4)} BTC`, 'Balance']}
                            labelFormatter={(label) => `Block Height: ${label}`}
                        />
                        <Area
                            type="stepAfter"
                            dataKey="balance"
                            stroke="#22d3ee"
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
