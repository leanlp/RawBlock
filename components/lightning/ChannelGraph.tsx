import React, { memo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    EdgeProps,
    getBezierPath,
    BaseEdge,
    NodeProps,
    Node,
    Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Zap, ShieldAlert, Loader2 } from 'lucide-react';

import { LightningNodeData, LightningEdgeData } from '../../utils/lightningData';

// --- Custom Node Implementation ---
const LightningNode = memo(({ data }: NodeProps<Node<LightningNodeData>>) => {
    return (
        <div className="bg-slate-900 border border-slate-700/80 rounded-full px-4 py-2 shadow-xl flex items-center gap-3 transition-all hover:scale-105 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] relative cursor-pointer">
            <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-cyan-500 !border-none" />
            <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-500 !border-none" />

            <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner overflow-hidden border border-white/10"
                style={{ backgroundColor: `${data.color}20` }} // 20 hex is ~12% opacity
            >
                {data.type === 'exchange' ? <Network size={20} style={{ color: data.color }} /> :
                    data.type === 'hub' ? <Zap size={20} style={{ color: data.color }} /> :
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.color }} />}
            </div>

            <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-wide">{data.label}</span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: data.color }}></span>
                    {data.type.toUpperCase()} • {data.capacity} BTC
                </span>
            </div>
        </div>
    );
});
LightningNode.displayName = 'LightningNode';

// --- Custom Edge Implementation ---
const LightningEdge = memo(({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data
}: EdgeProps<Edge<LightningEdgeData>>) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    const isAnomalous = data?.isAnomalous;
    // Base thickness on relative capacity (pseudo-logic for demo)
    const thickness = data ? Math.max(2, Math.min(8, data.capacity / 100)) : 2;

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: thickness,
                    stroke: isAnomalous ? '#ef4444' : '#0ea5e9', // Cyber blue or emergency red
                    strokeOpacity: 0.6,
                }}
            />
            {/* Edge Label for Capacity & Routing Fee */}
            <g transform={`translate(${labelX}, ${labelY})`} className="pointer-events-none">
                <foreignObject
                    width={180}
                    height={40}
                    x={-90}
                    y={-20}
                    className="overflow-visible"
                    style={{ overflow: 'visible' }}
                >
                    <div className={`
                         flex items-center gap-2 justify-center px-2 py-1 rounded bg-slate-900/90 border backdrop-blur-sm text-[9px] font-mono shadow-md w-max mx-auto
                         ${isAnomalous ? 'border-red-500/50 text-red-100' : 'border-slate-700 text-slate-300'}
                     `}>
                        {isAnomalous && <ShieldAlert size={10} className="text-red-500 animate-pulse" />}
                        <span>{data?.capacity} BTC</span>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <span className={isAnomalous ? 'text-red-400 font-bold' : 'text-slate-500'}>
                            {data?.baseFee} sat/{data?.feeRate} ppm
                        </span>
                    </div>
                </foreignObject>
            </g>
        </>
    );
});
LightningEdge.displayName = 'LightningEdge';

const nodeTypes = {
    lightningNode: LightningNode,
};

const edgeTypes = {
    lightningEdge: LightningEdge,
};

export default function ChannelGraph() {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<LightningNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<LightningEdgeData>>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function loadTopology() {
            try {
                const res = await fetch('/data/lightning.json');
                const data = await res.json();
                if (data.nodes && data.edges) {
                    setNodes(data.nodes);
                    setEdges(data.edges);
                }
            } catch (err) {
                console.error("Failed to fetch Lightning topology:", err);
            } finally {
                setLoading(false);
            }
        }
        loadTopology();
    }, [setNodes, setEdges]);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-4">
                <Loader2 size={32} className="animate-spin text-cyan-500" />
                <p className="font-mono text-sm">Ingesting public routing mesh...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative" style={{ background: '#020617' }}>
            {/* bg-slate-950 */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="dark"
                minZoom={0.2}
            >
                <Background color="#1e293b" gap={24} size={1} />
                <Controls className="bg-slate-900 border-slate-800 fill-white" />
            </ReactFlow>

            {/* Graph Legend Override over React Flow */}
            <div className="absolute bottom-6 left-6 z-50 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl">
                <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Network Topology Map</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        Central Exchanges
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                        <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                        Major Routing Hubs
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                        <div className="w-3 h-0.5 bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                        Anomalous Fee Routes
                    </div>
                </div>
            </div>
        </div>
    );
}
