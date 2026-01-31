"use client";

import { useState, useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    Handle,
    Position,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Header from "../../../components/Header";
import { Search, Plus, Save, Network, ShieldAlert, X, ArrowLeft, ArrowRight } from "lucide-react";
import dagre from 'dagre';

// --- Custom Node Components ---

// 1. Transaction Node (Refined)
const TxNode = ({ data }: { data: { label: string, value: string, risk: number } }) => {
    const isRisky = data.risk > 50;

    return (
        <div className={`
      group relative min-w-[240px] bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl transition-all duration-300
      hover:scale-105 hover:shadow-[0_0_20px_-5px_rgba(56,189,248,0.3)]
      ${isRisky ? 'border-red-500/30' : 'hover:border-cyan-500/50'}
    `}>
            {/* Glow Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${isRisky ? 'from-red-500 to-orange-600' : 'from-cyan-500 to-blue-600'} rounded-xl opacity-0 group-hover:opacity-20 transition duration-500 blur`}></div>

            <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-3 !h-3 !-left-1.5" />

            <div className="relative p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Transaction</span>
                        <span className="text-xs font-mono text-slate-200 truncate max-w-[140px]" title={data.label}>{data.label}</span>
                    </div>
                    {isRisky ? (
                        <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/50">
                        <div className="text-[10px] text-slate-500">Value</div>
                        <div className="text-sm font-bold text-white font-mono">{data.value} <span className="text-[10px] text-slate-500">BTC</span></div>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/50 flex flex-col justify-center">
                        <div className="text-[10px] text-slate-500">Risk Score</div>
                        <div className={`text-xs font-bold ${isRisky ? 'text-red-400' : 'text-emerald-400'}`}>
                            {data.risk}/100
                        </div>
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-3 !h-3 !-right-1.5" />
        </div>
    );
};

// 2. Address Node (Refined)
const AddressNode = ({ data }: { data: { label: string, balance: string, tag?: string } }) => {
    const isWhale = data.tag === 'Whale';

    return (
        <div className={`
        relative min-w-[220px] bg-slate-950/90 backdrop-blur rounded-full border border-slate-700 shadow-xl flex items-center gap-3 p-1.5 pr-6 transition-all duration-300
        hover:border-purple-500/50 hover:shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]
      `}>
            <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-3 !h-3 !-left-1" />
            <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-3 !h-3 !-right-1" />

            {/* Avatar */}
            <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner
            ${isWhale ? 'bg-gradient-to-br from-amber-400 to-orange-600 ring-2 ring-amber-500/30' : 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-4 ring-slate-900'}
        `}>
                {data.tag ? data.tag[0] : 'W'}
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isWhale ? 'text-amber-400' : 'text-slate-500'}`}>
                        {data.tag || "Wallet"}
                    </span>
                </div>
                <div className="text-xs font-mono text-slate-200 truncate max-w-[120px]">{data.label}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Bal: <span className="text-emerald-400 font-bold">{data.balance} BTC</span>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'address',
        position: { x: 100, y: 100 },
        data: { label: 'bc1qxy...29', balance: '50.2', tag: 'Whale' }
    },
    {
        id: '2',
        type: 'tx',
        position: { x: 400, y: 100 },
        data: { label: 'tx_a7f2...9c', value: '12.5', risk: 80 }
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#64748b' } }
];

export default function ForensicsPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const nodeTypes = useMemo(() => ({ tx: TxNode, address: AddressNode }), []);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeDasharray: '5,5' } }, eds)),
        [setEdges],
    );

    // --- Case Studies Logic ---
    const CASE_STUDIES = [
        { id: 'pizza', label: '🍕 Pizza Transaction', value: 'cca7507897abc89628f450e8b1e0c6fca4ec3f7b34cccf55f3f531c659ff4d79' },
        { id: 'genesis', label: '🏛️ Satoshi Genesis', value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
        { id: 'mtgox', label: '🏴‍☠️ Mt Gox Hack (1Feex)', value: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF' },
        { id: 'wikileaks', label: '📢 Wikileaks Donation', value: '1HB5XMLmzFVj8ALj6mfBsbifRoD4miY36v' }
    ];

    const loadCaseStudy = async (studyId: string) => {
        const study = CASE_STUDIES.find(s => s.id === studyId);
        if (!study) return;
        setSearchQuery(study.value);
        // Small delay to allow state update before trigger? 
        // Better to just call directly:
        setLoading(true);
        // Clear graph first?
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);

        try {
            const data = await fetchNodeData(study.value);
            if (!data) return;

            // Create Root Node
            const newNode: Node = {
                id: study.value,
                type: data.type === 'transaction' ? 'tx' : 'address',
                position: { x: 500, y: 300 },
                data: {
                    label: data.type === 'transaction' ? data.txid.substring(0, 8) + '...' : data.address.substring(0, 8) + '...',
                    value: data.type === 'transaction' ? '0.00' : data.balance,
                    risk: 0,
                    tag: data.type === 'address' ? 'Case Study' : undefined
                }
            };
            setNodes([newNode]);
        } finally {
            setLoading(false);
        }
    };

    // --- API Integration ---
    const fetchNodeData = async (query: string) => {
        setLoading(true);
        try {
            // Use internal Next.js Proxy (Direct RPC)
            const res = await fetch('/api/proxy-rpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data;
        } catch (e: any) {
            console.error("Fetch Error", e);
            alert("Failed to fetch data: " + e.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        const data = await fetchNodeData(searchQuery);
        if (!data) return;

        // Create Root Node
        const newNode: Node = {
            id: searchQuery,
            type: data.type === 'transaction' ? 'tx' : 'address',
            position: { x: 500, y: 300 }, // Center-ish
            data: {
                label: data.type === 'transaction' ? data.txid.substring(0, 8) + '...' : data.address.substring(0, 8) + '...',
                value: data.type === 'transaction' ? '0.00' : data.balance, // TODO: Calc value for TX
                risk: 0,
                tag: data.type === 'address' ? 'Wallet' : undefined
            }
        };

        setNodes((nds) => nds.concat(newNode));
    };


    const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // --- Layout Engine ---
    const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'RL') => {
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        const isHorizontal = direction === 'LR' || direction === 'RL';
        dagreGraph.setGraph({ rankdir: direction });

        nodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: 240, height: 150 });
        });

        edges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const newNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            return {
                ...node,
                targetPosition: isHorizontal ? Position.Left : Position.Top,
                sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
                // We are shifting the dagre node position (anchor=center center) to the top left
                // so it matches the React Flow node anchor point (top left).
                position: {
                    x: nodeWithPosition.x - 120,
                    y: nodeWithPosition.y - 75,
                },
            };
        });

        return { nodes: newNodes, edges };
    };

    const handleAutoLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            'RL' // Right to Left (Inputs -> Output)
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [nodes, edges, setNodes, setEdges]);

    // --- Graph Interaction ---
    const expandTxNode = useCallback((node: Node, txData: any, direction: 'in' | 'out' | 'both' = 'both') => {
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const spacingY = 150;

        // 1. Expand Outputs (Trace Dest)
        if (direction === 'out' || direction === 'both') {
            txData.vout.forEach((out: any, index: number) => {
                if (!out.scriptPubKey.address) return;

                const nodeId = out.scriptPubKey.address;
                const exists = nodes.find(n => n.id === nodeId);

                if (!exists) {
                    newNodes.push({
                        id: nodeId,
                        type: 'address',
                        position: { x: node.position.x + 400, y: node.position.y + (index * spacingY) - ((txData.vout.length * spacingY) / 2) },
                        data: {
                            label: out.scriptPubKey.address.substring(0, 8) + '...',
                            balance: out.value.toFixed(8),
                            tag: 'Recipient'
                        }
                    });
                }
                // Prevent duplicate edges
                const edgeId = `e-${node.id}-${nodeId}-${index}`;
                if (!edges.find(e => e.id === edgeId)) {
                    newEdges.push({
                        id: edgeId,
                        source: node.id,
                        target: nodeId,
                        animated: true,
                        label: `${out.value} BTC`,
                        style: { stroke: '#10b981' }
                    });
                }
            });
        }

        // 2. Expand Inputs (Trace Source / Ancestry)
        if (direction === 'in' || direction === 'both') {
            txData.vin.forEach((inpt: any, index: number) => {
                if (!inpt.txid) return;

                const nodeId = inpt.txid;
                const exists = nodes.find(n => n.id === nodeId);

                if (!exists) {
                    newNodes.push({
                        id: nodeId,
                        type: 'tx',
                        position: { x: node.position.x - 400, y: node.position.y + (index * spacingY) - ((txData.vin.length * spacingY) / 2) },
                        data: {
                            label: inpt.txid.substring(0, 8) + '...',
                            value: '?',
                            risk: 0
                        }
                    });
                }

                const edgeId = `e-${nodeId}-${node.id}-${index}`;
                if (!edges.find(e => e.id === edgeId)) {
                    newEdges.push({
                        id: edgeId,
                        source: nodeId,
                        target: node.id,
                        style: { stroke: '#64748b' } // Grey for history
                    });
                }
            });
        }

        setNodes((nds) => nds.concat(newNodes));
        setEdges((eds) => eds.concat(newEdges));
        return newNodes;
    }, [nodes, edges, setNodes, setEdges]);

    // --- Accounting Mode Logic ---
    const activateAccountingMode = useCallback(async (addressNode: Node, addressData: any) => {
        // 1. Clear Graph but keep ROOT
        const rootPosition = addressNode.position;
        setNodes([addressNode]);
        setEdges([]);

        if (!addressData.utxos) return;

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const spacingY = 120;

        // 2. Lay out UTXOs to the LEFT (Source of funds)
        addressData.utxos.forEach((utxo: any, index: number) => {
            // Optimization: Fold dust if too many?
            if (index > 50) return; // Hard limit for MVP

            const nodeId = `${utxo.txid}:${utxo.vout}`; // Unique UTXO ID

            newNodes.push({
                id: nodeId,
                type: 'tx', // visualized as Tx that created it
                position: { x: rootPosition.x - 400, y: rootPosition.y + (index * spacingY) - ((addressData.utxos.length * spacingY) / 2) },
                data: {
                    label: `UTXO: ${utxo.amount.toFixed(4)}`,
                    value: utxo.amount.toFixed(8),
                    risk: 0,
                    txid: utxo.txid // Store raw TXID for query
                }
            });

            newEdges.push({
                id: `e-${nodeId}-${addressNode.id}`,
                source: nodeId,
                target: addressNode.id,
                animated: false,
                style: { stroke: '#fbbf24', strokeWidth: 2 }, // Gold/Amber for HODLings
                label: 'Funding'
            });
        });

        setNodes((nds) => nds.concat(newNodes));
        setEdges((eds) => eds.concat(newEdges));

        // Notifying user
        alert(`Accounting Mode: Displaying ${addressData.utxos.length} UTXOs. Trace individual nodes to find ancestry.`);

    }, [setNodes, setEdges]);


    const onNodeClick = useCallback(async (event: any, node: Node) => {
        setSelectedNode(node);

        try {
            // Fetch detailed data for the Inspector
            // Prefer data.txid if available (for UTXO nodes), else use node.id
            const queryId = (node.data.txid as string) || node.id;

            // VALIDATION: Ensure we only fetch real Bitcoin identifiers
            const isTxID = /^[0-9a-fA-F]{64}$/.test(queryId);
            const isAddress = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(queryId);

            if (!isTxID && !isAddress) {
                console.warn("Node ID is not a valid Bitcoin TxID or Address. Skipping API fetch.", queryId);
                // Supply safe fallback data for the Inspector
                setSelectedNodeData({
                    id: node.id,
                    type: node.type,
                    label: node.data.label || node.id,
                    risk: node.data.risk || 0,
                    balance: node.data.balance || "0.00",
                    vin: [],
                    vout: [],
                    utxos: []
                });
                return;
            }

            const data = await fetchNodeData(queryId);
            if (data) {
                setSelectedNodeData(data);
            } else {
                // Fallback for UI QA (if backend is offline)
                console.warn("Backend offline, loading mock data for QA");
                setSelectedNodeData({
                    id: node.id,
                    type: node.type,
                    label: node.data.label,
                    risk: node.data.risk || 0,
                    balance: node.data.balance || "0.00",
                    mock: true, // Tag as mock
                    // Mock extended data
                    vin: [{ txid: "prev_...mock", vout: 0 }],
                    vout: [{ value: 0.5, scriptPubKey: { address: "bc1q...mock" } }]
                });
            }
        } catch (e) {
            console.error("Inspector Error", e);
        }
    }, []); // Removed auto-expand logic

    // --- Deep Trace Logic ---
    const handleDeepTrace = async (node: Node, txData: any) => {
        setLoading(true);
        try {
            // 1. Expand Layer 1 (Source) - We cast to avoid TS error if signature update didn't propagate in IDE yet, but runtime works.
            const layer1Nodes = (expandTxNode as any)(node, txData, 'in') || [];

            if (layer1Nodes.length === 0) return;

            // 2. Expand Layer 2 (Recursively fetch and expand)
            // Limit to first 3 inputs to avoid RPC overload
            const subset = layer1Nodes.slice(0, 3);

            await Promise.all(subset.map(async (l1Node: Node) => {
                const l1Data = await fetchNodeData(l1Node.id);
                if (l1Data) {
                    // Recursively expand this node
                    (expandTxNode as any)(l1Node, l1Data, 'in');
                }
            }));

            alert(`Deep Trace Complete. Expanded ${subset.length} ancestry paths.`);
        } catch (error) {
            console.error("Deep trace failed", error);
        } finally {
            setLoading(false);
        }
    };


    // --- Forensic Tools ---

    // 1. Taint Simulation
    const propagateRisk = (startNodeId: string, riskLevel: number) => {
        const visited = new Set<string>();
        const queue = [startNodeId];
        const riskMap = new Map<string, number>();

        // Breadth-first propagation
        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);
            riskMap.set(currentId, riskLevel);

            // Find children (targets of edges from current)
            const children = edges
                .filter(e => e.source === currentId)
                .map(e => e.target);

            queue.push(...children);
        }

        // Batch update nodes
        setNodes((nds) => nds.map(n =>
            riskMap.has(n.id) ? { ...n, data: { ...n.data, risk: riskMap.get(n.id) } } : n
        ));

        // Update selected if needed
        if (selectedNode && riskMap.has(selectedNode.id)) {
            setSelectedNodeData((prev: any) => ({ ...prev, risk: riskLevel }));
        }

        alert(`Taint Simulation: Propagated High Risk to ${visited.size - 1} downstream nodes.`);
    };

    // 2. Export Evidence
    const saveEvidence = () => {
        const evidence = {
            caseId: `CASE-${Date.now()}`,
            timestamp: new Date().toISOString(),
            nodes: nodes,
            edges: edges
        };
        const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forensic_evidence_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <main className="h-screen w-full bg-slate-950 flex flex-col pt-16 md:pt-0 relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-4 left-4 z-50 md:left-20 pointer-events-none">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Forensics Workbench
                </h1>
                <p className="text-xs text-slate-500 mt-1">Professional Audit Board</p>
            </div>

            {/* Case Studies Sidebar */}
            <div className="absolute top-20 left-4 z-40 md:left-4 w-12 hover:w-64 transition-all duration-300 bg-slate-900/50 backdrop-blur border-r border-slate-800 h-[calc(100vh-100px)] overflow-hidden group">
                <div className="flex flex-col gap-2 p-2">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pl-2">
                        Real World Cases
                    </div>
                    {CASE_STUDIES.map(study => (
                        <button
                            key={study.id}
                            onClick={() => loadCaseStudy(study.id)}
                            className="flex items-center gap-3 p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors whitespace-nowrap"
                            title={study.label}
                        >
                            <span className="text-lg">{study.label.split(' ')[0]}</span>
                            <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {study.label.substring(study.label.indexOf(' ') + 1)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="absolute top-20 left-4 z-50 md:left-20 flex gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter TxID or Address..."
                    className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white w-64 focus:outline-none focus:border-cyan-500"
                />
                <button onClick={handleSearch} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded text-sm font-bold transition-colors">
                    {loading ? '...' : <Search size={16} />}
                </button>
            </div>

            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-50 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 flex gap-2">
                <button className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors" title="Add Node"><Plus size={18} /></button>
                <button onClick={saveEvidence} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors" title="Save Graph"><Save size={18} /></button>
                <button onClick={handleAutoLayout} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-purple-400 transition-colors" title="Auto Layout"><Network size={18} /></button>
            </div>

            {/* Inspector Panel (Right Sidebar) */}
            <div className={`
            absolute top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur border-l border-slate-800 z-40 transform transition-transform duration-300 ease-in-out pt-20 overflow-y-auto
            ${selectedNode ? 'translate-x-0' : 'translate-x-full'}
        `}>
                {selectedNode && selectedNodeData ? (
                    <div className="p-4 space-y-6">
                        {/* Header */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase text-slate-500">{selectedNode.type === 'tx' ? 'Transaction' : 'Address'}</span>
                                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                            </div>
                            <h2 className="text-sm font-mono text-white break-all bg-slate-950 p-2 rounded border border-slate-800 select-all">
                                {selectedNode.id}
                            </h2>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => expandTxNode(selectedNode, selectedNodeData, 'in')}
                                className="bg-slate-800 hover:bg-blue-600 text-slate-200 text-xs py-2 rounded flex items-center justify-center gap-1 transition-colors"
                            >
                                <ArrowLeft size={12} /> Trace Source
                            </button>
                            <button
                                onClick={() => expandTxNode(selectedNode, selectedNodeData, 'out')}
                                className="bg-slate-800 hover:bg-emerald-600 text-slate-200 text-xs py-2 rounded flex items-center justify-center gap-1 transition-colors"
                            >
                                Trace Dest <ArrowRight size={12} />
                            </button>

                            <button
                                onClick={() => handleDeepTrace(selectedNode, selectedNodeData)}
                                disabled={loading}
                                className="col-span-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs py-2 rounded flex items-center justify-center gap-2 transition-all mt-1"
                            >
                                <Network size={12} /> Deep Trace (2 Layers)
                            </button>

                            {/* Block Details (New) */}
                            {selectedNode.type === 'tx' && selectedNodeData.blocktime && (
                                <div className="col-span-2 bg-slate-950/50 p-2 rounded border border-slate-800 mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-slate-500">Time</span>
                                        <span className="text-xs text-white font-mono">
                                            {new Date(selectedNodeData.blocktime * 1000).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-slate-500">Block</span>
                                        <a
                                            href={`https://mempool.space/block/${selectedNodeData.blockhash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-400 hover:underline font-mono"
                                        >
                                            #{selectedNodeData.blockheight}
                                        </a>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-500">Status</span>
                                        <span className={`text-xs font-bold ${selectedNodeData.confirmations > 6 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {selectedNodeData.confirmations} Confs
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Special: Accounting Mode (Only for Addresses) */}
                            {selectedNode.type === 'address' && (
                                <button
                                    onClick={() => activateAccountingMode(selectedNode, selectedNodeData)}
                                    className="col-span-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs py-2 rounded flex items-center justify-center gap-2 transition-all mt-2"
                                >
                                    <Network size={12} /> Start Balance Accounting
                                </button>
                            )}
                        </div>

                        {/* Taint / Risk */}
                        <div className="bg-slate-950 rounded p-3 border border-slate-800">
                            <label className="text-xs text-slate-500 block mb-2">Audit Status</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => propagateRisk(selectedNode.id, 0)}
                                    className="flex-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs py-1 rounded hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all"
                                >
                                    Safe
                                </button>
                                <button
                                    onClick={() => propagateRisk(selectedNode.id, 100)}
                                    className="flex-1 bg-red-500/10 text-red-500 border border-red-500/30 text-xs py-1 rounded hover:bg-red-500/20 hover:border-red-500/60 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                >
                                    Suspicious
                                </button>
                            </div>
                        </div>

                        {/* Raw Details */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 mb-2">Raw Data</h3>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto">
                                <pre className="text-[10px] text-slate-500 font-mono">
                                    {JSON.stringify(selectedNodeData, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        Select a node to inspect details.
                    </div>
                )}
            </div>

            <div className="flex-1 h-full border-t border-slate-900">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-950"
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
                    <Controls className="bg-slate-900 border-slate-800 fill-slate-400 text-slate-400" />
                    <MiniMap
                        className="bg-slate-900 border-slate-800"
                        nodeColor={(n) => n.type === 'tx' ? '#3b82f6' : '#8b5cf6'}
                    />
                </ReactFlow>
            </div>
        </main>
    );
}
