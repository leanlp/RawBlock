"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    addEdge,
    Background,
    Controls,
    MiniMap,
    Connection,
    Handle,
    Position,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Search,
    ShieldAlert,
    Share2,
    Save,
    Trash2,
    ZoomIn,
    ArrowRight,
    ArrowLeft,
    Network,
    Filter,
    FileText,
    Camera,
    Plus,
    Clock,
    X,
    Loader2
} from 'lucide-react';
import { toPng } from 'html-to-image';

// --- Custom Node Components ---

// 1. Transaction Node (Refined)
const TxNode = ({ data }: { data: { label: string, value: string, risk: number } }) => {
    const isRisky = data.risk > 50;
    const isHeatmap = (data as any).isHeatmapMode;

    // Dynamic coloring based on risk if heatmap mode
    let bgClass = "bg-slate-900/80";
    if (isHeatmap) {
        if (data.risk > 80) bgClass = "bg-red-900/80";
        else if (data.risk > 40) bgClass = "bg-orange-900/80";
        else bgClass = "bg-emerald-900/80";
    }

    return (
        <div className={`
      group relative min-w-[240px] ${bgClass} backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl transition-all duration-300
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
    const isHeatmap = (data as any).isHeatmapMode;

    let bgClass = "bg-slate-950/90";
    if (isHeatmap) {
        // Addresses calc risk differently (mock for now, or assume 0 unless tagged)
        if (data.tag === 'Whale') bgClass = "bg-blue-900/80";
        else bgClass = "bg-slate-800/80";
    }

    return (
        <div className={`
        relative min-w-[220px] ${bgClass} backdrop-blur rounded-full border border-slate-700 shadow-xl flex items-center gap-3 p-1.5 pr-6 transition-all duration-300
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

// 3. Dot Node (High Performance for Blast Mode)
const DotNode = ({ data }: { data: { value: string, risk?: number } }) => {
    const isHeatmap = (data as any).isHeatmapMode;
    const risk = data.risk || 0;

    let colorClass = "bg-slate-600";
    if (isHeatmap) {
        if (risk > 80) colorClass = "bg-red-500";
        else if (risk > 40) colorClass = "bg-orange-500";
        else colorClass = "bg-emerald-500";
    }

    return (
        <div className={`w-3 h-3 rounded-full ${colorClass} hover:scale-150 transition-transform cursor-pointer shadow-sm relative group`}>
            {/* Tooltip on Hover */}
            <Handle type="target" position={Position.Left} className="opacity-0 w-full h-full" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-black/90 text-white text-[10px] p-1 rounded whitespace-nowrap pointer-events-none">
                {data.value} BTC
            </div>
        </div>
    );
};

// 4. Block Group Node (Container)
const BlockGroupNode = ({ data }: { data: { label: string, height: number } }) => {
    return (
        <div className="min-w-[300px] h-full bg-slate-900/40 border-2 border-dashed border-slate-700/50 rounded-xl p-4 flex flex-col justify-end relative group transition-all hover:bg-slate-900/60 hover:border-slate-600">
            <div className="absolute -top-3 left-4 bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono border border-slate-700 shadow-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                Block #{data.height}
            </div>
            <div className="text-xs text-slate-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                {data.label}
            </div>
        </div>
    );
};

const nodeTypes = {
    tx: TxNode,
    address: AddressNode,
    dot: DotNode,
    blockGroup: BlockGroupNode,
};


// --- Main Component ---

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'address',
        position: { x: 100, y: 350 }, // Shifted Down for UI safety
        data: { label: 'bc1qxy...29', balance: '50.2', tag: 'Whale' }
    },
    {
        id: '2',
        type: 'tx',
        position: { x: 400, y: 350 }, // Shifted Down for UI safety
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
    const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // --- Helper: Edge Styling ---
    const getEdgeStyle = useCallback((amount: number) => {
        // Base width 1px, max 10px. Logarithmic scale.
        const width = Math.max(1, Math.min(10, 1 + Math.log10(amount + 1) * 2));
        return {
            strokeWidth: width,
            stroke: amount > 10 ? '#ef4444' : amount > 1 ? '#f59e0b' : '#10b981', // Red (>10), Amber (>1), Emerald (<1)
            opacity: 0.8
        };
    }, []);
    const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical' | 'radial'>('horizontal');
    const [heatmapMode, setHeatmapMode] = useState(false);

    const toggleHeatmap = useCallback(() => {
        setHeatmapMode(prev => !prev);
        setNodes((nds) => nds.map(n => ({
            ...n,
            data: { ...n.data, isHeatmapMode: !heatmapMode }
        })));
    }, [heatmapMode, setNodes]);

    const nodeTypes = useMemo(() => ({ tx: TxNode, address: AddressNode, dot: DotNode, blockGroup: BlockGroupNode }), []);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeDasharray: '5,5' } }, eds)),
        [setEdges],
    );

    // --- Context Menu State ---
    const [menu, setMenu] = useState<{ id: string, top: number, left: number, bottom?: number, right?: number } | null>(null);
    const ref = useMemo(() => ({ current: null as HTMLDivElement | null }), []);

    const onNodeContextMenu = useCallback((event: any, node: Node) => {
        event.preventDefault();
        const pane = ref.current?.getBoundingClientRect();

        setMenu({
            id: node.id,
            top: event.clientY < (pane?.height || 0) - 200 ? event.clientY : undefined as any,
            bottom: event.clientY >= (pane?.height || 0) - 200 ? (pane?.height || 0) - event.clientY : undefined,
            left: event.clientX < (pane?.width || 0) - 200 ? event.clientX : undefined as any,
            right: event.clientX >= (pane?.width || 0) - 200 ? (pane?.width || 0) - event.clientX : undefined,
        });
        setSelectedNode(node); // Auto-select on right click too
    }, [setMenu, setSelectedNode]);

    const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+F or Ctrl+F to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
            // Delete / Backspace to remove node
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
                setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                setSelectedNode(null);
                setMenu(null);
            }
            // Esc to clear selection
            if (e.key === 'Escape') {
                setSelectedNode(null);
                setMenu(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, setNodes, setEdges, setSelectedNode]);

    // --- Case Studies Logic ---
    // Import static data (ensure tsconfig allows json import or use require if needed)
    // For Next.js/Webpack, direct import is fine.
    // Note: We use a require here to avoid top-level import issues if file is missing during build

    const CASE_STUDIES = [
        { id: 'pizza', label: '🍕 Pizza Transaction', value: 'cca7507897abc89628f450e8b1e0c6fca4ec3f7b34cccf55f3f531c659ff4d79', defaultHeight: 57043 },
        { id: 'genesis', label: '🏛️ Satoshi Genesis', value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', defaultHeight: 0 },
        { id: 'mtgox', label: '🏴‍☠️ Mt Gox Hack (1Feex)', value: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF', defaultHeight: 135303 },
        { id: 'wikileaks', label: '📢 Wikileaks Donation', value: '1HB5XMLmzFVj8ALj6mfBsbifRoD4miY36v', defaultHeight: 89000 },
    ];

    const loadCaseStudy = async (studyId: string) => {
        const study = CASE_STUDIES.find(s => s.id === studyId);
        if (!study) return;
        setSearchQuery(study.value);
        setLoading(true);
        // Clear graph first
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);

        try {
            // OPTIMIZATION: Try loading from static JSON in public folder
            // This prevents bundling 17MB+ files into the client JS and allows browser caching.
            let data: any = null;
            try {
                const res = await fetch(`/data/forensics/${studyId}.json`);
                if (res.ok) {
                    const staticCase = await res.json();
                    // No need to access via key since file contains just the case object
                    if (staticCase && !staticCase.error) {
                        console.log(`[Forensics] Loaded static case via HTTP: ${studyId}`);
                        data = staticCase;
                    }
                }
            } catch (e) {
                console.warn("Static case file lookup failed, falling back to API", e);
            }

            // Fallback to Live API
            let source = 'Static Archive';
            // STRICT MODE: User requested ONLY static JSON for these examples.
            if (!data) {
                console.error("Failed to load static case data.");
                alert("Could not load case study data. Please ensure the static files are generated.");
                return;
            }

            if (!data) return;

            // Create Root Node
            const newNode: Node = {
                id: study.value,
                type: data.type === 'transaction' ? 'tx' : 'address',
                position: { x: 500, y: 400 }, // Shifted down
                data: {
                    label: data.type === 'transaction' ? data.txid.substring(0, 8) + '...' : data.address.substring(0, 8) + '...',
                    value: data.type === 'transaction' ? '0.00' : data.balance,
                    risk: 0,
                    tag: data.type === 'address' ? 'Case Study' : undefined,
                    source, // Track source
                    block_height: data.blockheight || data.block_height || study.defaultHeight, // Fallback to safe default
                    // Store full data for local access
                    ...data
                }
            };
            setNodes([newNode]);

            // If it's an address with UTXOs (from static scan), auto-expand?
            // Optional: for now just show root.

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

        // Prevent Duplicate Nodes (Crash Fix)
        const exists = nodes.find(n => n.id === searchQuery);
        if (exists) {
            alert("Node already in workspace");
            setSelectedNode(exists);
            return;
        }

        const data = await fetchNodeData(searchQuery);
        if (!data) return;

        // Create Root Node
        const newNode: Node = {
            id: searchQuery,
            type: data.type === 'transaction' ? 'tx' : 'address',
            position: { x: 500, y: 400 }, // Shifted down
            data: {
                label: data.type === 'transaction' ? data.txid.substring(0, 8) + '...' : data.address.substring(0, 8) + '...',
                value: data.type === 'transaction' ? '0.00' : data.balance, // TODO: Calc value for TX
                risk: 0,
                tag: data.type === 'address' ? 'Wallet' : undefined,
                source: 'Live Node',
                isHeatmapMode: heatmapMode,
                block_height: data.blockheight || data.block_height // Save Block Height
            }
        };

        setNodes((nds) => nds.concat(newNode));
    };




    // --- Layout Engine ---
    // --- Advanced Layout Engine (Elkjs) ---
    // Note: ELK is async and provides better automatic layout than Dagre
    // --- Advanced Layout Engine (Elkjs) ---
    const getLayoutedElements = useCallback(async (nodes: Node[], edges: Edge[], mode: 'horizontal' | 'vertical' | 'radial' = 'horizontal') => {
        const ELK = await import('elkjs/lib/elk.bundled');
        const elk = new ELK.default();

        let algorithm = 'layered';
        let direction = 'RIGHT';

        if (mode === 'vertical') direction = 'DOWN';
        if (mode === 'radial') algorithm = 'radial';

        const elkOptions: any = {
            'elk.algorithm': algorithm,
            'elk.direction': direction,
            'elk.spacing.nodeNode': '80',
            'elk.padding': '[top=50,left=50,bottom=50,right=50]'
        };

        if (algorithm === 'layered') {
            elkOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = '100';
        }

        const graph = {
            id: 'root',
            layoutOptions: elkOptions,
            children: nodes.map((node) => ({
                id: node.id,
                width: 280,
                height: 160
            })),
            edges: edges.map((edge) => ({
                id: edge.id,
                sources: [edge.source],
                targets: [edge.target]
            }))
        };

        try {
            const layoutedGraph = await elk.layout(graph);

            const layoutedNodes = nodes.map((node) => {
                const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
                if (!elkNode) return node;

                return {
                    ...node,
                    position: {
                        x: elkNode.x || 0,
                        y: elkNode.y || 0
                    }
                };
            });

            return { nodes: layoutedNodes, edges };
        } catch (err) {
            console.error('Elk Layout Failed:', err);
            return { nodes, edges };
        }
    }, []);

    // --- Timeline Layout Engine ---
    // --- Timeline Layout Engine ---
    // --- Timeline Layout Engine ---
    const getTimelineLayout = useCallback((nodes: Node[], edges: Edge[]) => {
        // 1. Clean Data & Sort by Time
        // Filter valid nodes that should be part of the timeline
        const validNodes = nodes.filter(n => n.type === 'tx' || n.type === 'address' || n.type === 'dot');

        const processingNodes = validNodes.map(n => {
            const rawHeight = (n.data as any).block_height;


            // Handle number or string number
            const parsed = Number(rawHeight);
            const ts: number = !isNaN(parsed) && parsed > 0 ? parsed : 0;

            return { ...n, ts, original: n };
        }).sort((a, b) => a.ts - b.ts);

        // Filter valid items for timeline (must have height)
        const timeItems = processingNodes.filter(n => n.ts > 0);
        const nonTimeItems = processingNodes.filter(n => n.ts === 0);

        if (timeItems.length === 0) return { nodes, edges };

        // 2. Group by Block Height
        const blockGroups = new Map<number, typeof timeItems>();
        timeItems.forEach(item => {
            if (!blockGroups.has(item.ts)) blockGroups.set(item.ts, []);
            blockGroups.get(item.ts)?.push(item);
        });

        // 3. Create Group Nodes & Position Children
        const finalNodes: Node[] = [...nonTimeItems.map(i => i.original)];
        const sortedBlocks = Array.from(blockGroups.keys()).sort((a, b) => a - b);

        let currentX = 0;
        const GROUP_GAP = 100; // Gap between blocks
        const NODE_WIDTH = 250;
        const NODE_X_GAP = 20;
        const NODE_Y_GAP = 120;

        sortedBlocks.forEach(blockHeight => {
            const groupItems = blockGroups.get(blockHeight) || [];

            // Calculate Group Dimensions
            // Grid layout for children within the group
            const itemsPerRow = Math.ceil(Math.sqrt(groupItems.length));
            // Ensure at least 1 item width
            const gridCols = Math.max(1, itemsPerRow);
            const gridRows = Math.ceil(groupItems.length / gridCols);

            const groupWidth = Math.max(320, (gridCols * (NODE_WIDTH + NODE_X_GAP)) + 40);
            const groupHeight = (gridRows * NODE_Y_GAP) + 80; // Header offset + rows

            // Create Group Node
            const groupId = `block-group-${blockHeight}`;
            const groupNode: Node = {
                id: groupId,
                type: 'blockGroup',
                data: { label: `${groupItems.length} Txns`, height: blockHeight },
                position: { x: currentX, y: 0 },
                style: { width: groupWidth, height: groupHeight }
            };
            finalNodes.push(groupNode);

            // Position Children Relative to Group
            groupItems.forEach((item, index) => {
                const col = index % gridCols;
                const row = Math.floor(index / gridCols);

                // Clone and verify parent relationship
                const childNode = {
                    ...item.original,
                    parentId: groupId, // Attach to Group
                    extent: 'parent' as 'parent',  // Constrain to Group
                    position: {
                        x: 20 + (col * (NODE_WIDTH + NODE_X_GAP)),
                        y: 50 + (row * NODE_Y_GAP)
                    }
                };
                finalNodes.push(childNode);
            });

            currentX += groupWidth + GROUP_GAP;
        });

        return { nodes: finalNodes, edges };
    }, []);


    const handleAutoLayout = useCallback(async (mode?: 'horizontal' | 'vertical' | 'radial') => {
        const targetMode = mode || layoutMode;
        setLoading(true);
        if (mode) setLayoutMode(mode);

        try {
            const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(
                nodes,
                edges,
                targetMode
            );
            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
        } catch (e) {
            console.error("Layout error", e);
        } finally {
            setLoading(false);
        }
    }, [nodes, edges, setNodes, setEdges, getLayoutedElements]);

    // --- Export Functions ---
    const handleExportCSV = useCallback(() => {
        const headers = ["ID", "Type", "Label", "Value (BTC)", "Risk Score", "Tag"];
        const rows = nodes.map(n => [
            n.id,
            n.type,
            n.data.label,
            n.data.value || n.data.balance || "0",
            n.data.risk || "0",
            n.data.tag || ""
        ].join(","));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `forensics_data_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [nodes]);

    const handleExportImage = useCallback(() => {
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) return;

        setLoading(true);
        toPng(viewport, { backgroundColor: '#020617', style: { transform: 'scale(1)' } }) // Captures viewport
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `forensics_graph_${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
                setLoading(false);
            })
            .catch((err) => {
                console.error('Snapshot failed', err);
                setLoading(false);
            });
    }, []);

    // --- Graph Interaction ---
    const expandTxNode = useCallback((node: Node, txData: any, direction: 'in' | 'out' | 'both' = 'both') => {
        try {
            console.log("Expanding Tx Node:", { id: node.id, direction, txData });

            if (!txData) {
                console.error("No txData provided for expansion");
                // alert("Error: Missing transaction data. Cannot trace."); // Removed intrusive alert
                return;
            }

            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];
            const spacingY = 150;

            // 1. Expand Outputs (Trace Dest)
            if (direction === 'out' || direction === 'both') {
                if (txData.vout && Array.isArray(txData.vout)) {
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
                                    tag: 'Recipient',
                                    isHeatmapMode: heatmapMode,
                                    block_height: txData.blockheight // Inherit time
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
                                style: getEdgeStyle(out.value)
                            });
                        }
                    });
                }
            }

            // 2. Expand Inputs (Trace Source / Ancestry)
            if (direction === 'in' || direction === 'both') {
                if (txData.vin && Array.isArray(txData.vin)) {
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
                                    risk: 0,
                                    isHeatmapMode: heatmapMode,
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
            }

            setNodes((nds) => nds.concat(newNodes));
            setEdges((eds) => eds.concat(newEdges));
            return newNodes;
        } catch (e: any) {
            console.error("Trace Logic Failed:", e);
            alert(`Trace Failed: ${e.message}`);
        }
    }, [nodes, edges, setNodes, setEdges]);


    // --- Blast Mode (Bulk Expansion) ---
    const expandBurst = useCallback((node: Node, count: number = 1000) => {
        setLoading(true);
        // Simulate Grid Layout for 1000 items
        const cols = Math.ceil(Math.sqrt(count));
        const spacing = 15; // Tight spacing for dots
        const startX = node.position.x + 300;
        const startY = node.position.y - ((cols * spacing) / 2);

        const newNodes: Node[] = [];
        // Omit edges for performance in Blast Mode

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;

            const riskScore = Math.floor(Math.random() * 100);
            const value = (Math.random() * 0.5).toFixed(4);

            newNodes.push({
                id: `blast-${node.id}-${i}`,
                type: 'dot',
                position: {
                    x: startX + (col * spacing),
                    y: startY + (row * spacing)
                },
                data: {
                    label: `utxo-${i}`,
                    value: value,
                    risk: riskScore,
                    isHeatmapMode: heatmapMode,
                    block_height: node.data.block_height // Inherit Parent Time
                },
                draggable: false,
                connectable: false,
            });
        }

        setTimeout(() => {
            setNodes((nds) => [...nds, ...newNodes]);
            setLoading(false);
        }, 100);

        // Auto-Fit View to show the massive new graph
        setTimeout(() => {
            const fitBtn = document.querySelector('.react-flow__controls-fitview');
            if (fitBtn) (fitBtn as HTMLButtonElement).click();
        }, 600);
    }, [heatmapMode, setNodes]);

    // --- Accounting Mode Logic ---
    const activateAccountingMode = useCallback(async (addressNode: Node, addressData: any) => {
        // 1. Clear Graph but keep ROOT
        const rootPosition = addressNode.position;
        setNodes([addressNode]);
        setEdges([]);

        if (!addressData.utxos) return;

        // GROUPING LOGIC: Group by Year
        const utxosByYear: Record<string, any[]> = {};

        addressData.utxos.forEach((utxo: any) => {
            let year = "Unknown";
            if (utxo.status && utxo.status.block_time) {
                year = new Date(utxo.status.block_time * 1000).getFullYear().toString();
            } else if (utxo.block_height) {
                // Rough approximation if time missing (Genesis block 0 is 2009)
                if (utxo.block_height < 32000) year = "2009";
                else if (utxo.block_height < 100000) year = "2010";
                else year = "Legacy";
            }
            // Fallback for Genesis (often missing timestamp in explicit UTXO set if not enriched)
            if (utxo.value >= 50) year = "2009"; // Genesis block reward eras

            if (!utxosByYear[year]) utxosByYear[year] = [];
            utxosByYear[year].push(utxo);
        });

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const years = Object.keys(utxosByYear).sort();

        // TIMELINE LAYOUT CONFIG
        const START_X = rootPosition.x - (years.length * 150) / 2; // Center timeline
        const SPACING_X = 200;
        const TIMELINE_Y = rootPosition.y + 300;

        years.forEach((year, index) => {
            const groupUtxos = utxosByYear[year];
            const totalValue = groupUtxos.reduce((acc, u) => acc + u.value, 0);

            const nodeId = `cluster-year-${year}`;

            newNodes.push({
                id: nodeId,
                type: 'default',
                position: {
                    x: START_X + (index * SPACING_X),
                    y: TIMELINE_Y
                },
                data: {
                    label: `${year} (${groupUtxos.length})`,
                    value: totalValue.toFixed(2) + ' BTC',
                    type: 'cluster', // Tag to identify logic handling
                    year: year,
                    utxos: groupUtxos
                },
                style: {
                    backgroundColor: '#0f172a',
                    border: '1px solid #fbbf24',
                    color: '#fbbf24',
                    width: 140,
                    borderRadius: '12px',
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.15)'
                }
            });

            newEdges.push({
                id: `e-root-${nodeId}`,
                source: nodeId,
                target: addressNode.id,
                animated: true,
                style: { stroke: '#fbbf24', strokeDasharray: '5,5' },
                label: `${groupUtxos.length} txs`
            });
        });

        setNodes((nds) => nds.concat(newNodes));
        setEdges((eds) => eds.concat(newEdges));

        // Notifying user
        // Alert removed for better UX

    }, [setNodes, setEdges]);


    const onNodeClick = useCallback(async (event: any, node: Node) => {
        setSelectedNode(node);
        setSelectedNodeData(null); // Clear previous data to show loading state

        // --- CLUSTER EXPANSION LOGIC ---
        if (node.data.type === 'cluster') {
            // Expand this cluster into individual UTXOs
            // Reuse the Grid Layout logic we had before, but only for this cluster's UTXOs
            const clusterData = node.data as any;

            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            // Grid Layout relative to the Cluster Node
            const COLS = 5; // Smaller grid for expanded cluster
            const COL_WIDTH = 250;
            const ROW_HEIGHT = 150;
            const rootPos = node.position;

            clusterData.utxos.forEach((utxo: any, index: number) => {
                const nodeId = `${utxo.txid}:${utxo.vout}`;
                // Avoid duplicates if already expanded
                if (nodes.find(n => n.id === nodeId)) return;

                const col = index % COLS;
                const row = Math.floor(index / COLS);

                // Position below the cluster
                newNodes.push({
                    id: nodeId,
                    type: 'tx',
                    position: {
                        x: rootPos.x - ((COLS * COL_WIDTH) / 2) + (col * COL_WIDTH),
                        y: rootPos.y + 200 + (row * ROW_HEIGHT)
                    },
                    data: {
                        label: `UTXO: ${utxo.amount.toFixed(4)}`,
                        value: utxo.amount.toFixed(8),
                        risk: 0,
                        txid: utxo.txid // Crucial for Trace Source
                    }
                });

                newEdges.push({
                    id: `e-${node.id}-${nodeId}`,
                    source: node.id,
                    target: nodeId,
                    style: { stroke: '#fbbf24', strokeWidth: 1 },
                    label: ''
                });
            });

            setNodes((nds) => nds.concat(newNodes));
            setEdges((eds) => eds.concat(newEdges));
            return;
        }

        try {
            // Fetch detailed data for the Inspector
            // Prefer data.txid if available (for UTXO nodes), else use node.id
            const queryId = (node.data.txid as string) || node.id;

            // OPTIMIZATION: Check if node already has full data (Static Mode)
            const hasFullData = (node.data.vin && node.data.vout) || node.data.utxos;
            if (hasFullData) {
                console.log("Using cached/static node data for inspector", node.id);
                setSelectedNodeData({
                    id: node.id,
                    type: node.type,
                    // Spread all cached data
                    ...node.data
                });
                return;
            }

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
    }, [nodes, edges, setNodes, setEdges]); // Updated dependency array

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

            console.log(`Deep Trace Complete. Expanded ${subset.length} ancestry paths.`);
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
            <div className="absolute top-8 left-4 z-50 md:left-24 pointer-events-none">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Forensics Workbench
                </h1>
                <p className="text-xs text-slate-500 mt-1">Professional Audit Board</p>
            </div>

            {/* Case Studies Floating Dock (New Style) */}
            <div className="absolute top-24 left-4 z-40 w-12 hover:w-64 transition-all duration-300 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col gap-2 p-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pl-2 pt-2">
                        Case Files
                    </div>
                    {CASE_STUDIES.map(study => (
                        <button
                            key={study.id}
                            onClick={() => loadCaseStudy(study.id)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-cyan-400 transition-all whitespace-nowrap"
                            title={study.label}
                        >
                            <span className="text-lg filter drop-shadow-lg">{study.label.split(' ')[0]}</span>
                            <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {study.label.substring(study.label.indexOf(' ') + 1)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>




            {/* Main Content: Flex Row */}
            <div className="flex-1 flex flex-row h-full overflow-hidden relative mt-0 border-t border-slate-900 text-white">

                {/* 1. Graph Container (Left / Center) */}
                <div className="flex-1 h-full relative bg-slate-950">

                    {/* Search Bar - Moved Inside Graph to shift with Inspector */}
                    <div className="absolute top-6 right-4 z-50 flex gap-2 w-[300px]">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter TxID or Address... (Cmd+F)"
                            id="search-input"
                            className="flex-1 bg-slate-900/90 backdrop-blur border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 shadow-lg"
                        />
                        <button onClick={handleSearch} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20">
                            {loading ? '...' : <Search size={18} />}
                        </button>
                    </div>

                    {/* Toolbar - Moved Inside Graph */}
                    <div className="absolute top-20 right-4 z-40 bg-slate-900/90 backdrop-blur border border-slate-700/50 rounded-lg p-1.5 flex gap-1 shadow-xl">
                        <div className="flex bg-slate-800 rounded p-0.5 mr-2">
                            <button
                                onClick={() => handleAutoLayout('horizontal')}
                                className={`p-1.5 rounded ${layoutMode === 'horizontal' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Horizontal Layout"
                            >
                                <ArrowRight size={14} />
                            </button>
                            <button
                                onClick={() => handleAutoLayout('vertical')}
                                className={`p-1.5 rounded ${layoutMode === 'vertical' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Vertical Layout"
                            >
                                <ArrowRight size={14} className="rotate-90" />
                            </button>
                            <button
                                onClick={() => handleAutoLayout('radial')}
                                className={`p-1.5 rounded ${layoutMode === 'radial' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Radial Layout"
                            >
                                <Network size={14} />
                            </button>
                        </div>
                        <button
                            onClick={toggleHeatmap}
                            className={`p-2 rounded-md transition-colors ${heatmapMode ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'text-slate-400 hover:bg-slate-800 hover:text-red-400'}`}
                            title="Risk Heatmap"
                        >
                            <ShieldAlert size={18} />
                        </button>
                        <button
                            onClick={() => {
                                const layout = getTimelineLayout(nodes, edges);
                                setNodes(layout.nodes);
                                // setEdges(layout.edges);
                                setTimeout(() => document.querySelector<HTMLElement>('.react-flow__controls-fitview')?.click(), 200);
                            }}
                            className={`p-2 rounded-md transition-colors text-slate-400 hover:bg-slate-800 hover:text-cyan-400`}
                            title="Timeline View (Block Height)"
                        >
                            <Clock size={18} />
                        </button>
                        <div className="w-px h-6 bg-slate-700 mx-1"></div>
                        <button onClick={handleExportCSV} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-blue-400 transition-colors" title="Export CSV"><FileText size={18} /></button>
                        <button onClick={handleExportImage} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-indigo-400 transition-colors" title="Export Image"><Camera size={18} /></button>
                        <button className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-cyan-400 transition-colors" title="Add Node"><Plus size={18} /></button>
                        <button onClick={saveEvidence} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-emerald-400 transition-colors" title="Save Graph"><Save size={18} /></button>
                    </div>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onNodeContextMenu={onNodeContextMenu}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                        ref={ref}
                        fitViewOptions={{ padding: 0.3 }}
                        className="bg-slate-950"
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

                        {/* Controls Bottom-Left */}
                        <div className="absolute bottom-4 left-4 z-50">
                            <Controls
                                showInteractive={false}
                                className="!bg-slate-900 !border-slate-700 shadow-xl [&>button]:!bg-slate-900 [&>button]:!border-slate-700 [&>button]:!fill-slate-400 hover:[&>button]:!fill-white hover:[&>button]:!bg-slate-800"
                            />
                        </div>



                        {/* Context Menu */}
                        {menu && (
                            <div
                                className="absolute z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[160px]"
                                style={{ top: menu.top, left: menu.left, bottom: menu.bottom as any, right: menu.right as any }}
                            >
                                <div className="p-2 text-xs text-slate-500 border-b border-slate-800 font-mono">
                                    Node Actions
                                </div>
                                <button
                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors flex items-center gap-2"
                                    onClick={() => {
                                        if (selectedNode) expandTxNode(selectedNode, selectedNode.data, 'in');
                                        setMenu(null);
                                    }}
                                >
                                    <ArrowLeft size={14} /> Trace Source
                                </button>
                                <button
                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center gap-2"
                                    onClick={() => {
                                        if (selectedNode) expandTxNode(selectedNode, selectedNode.data, 'out');
                                        setMenu(null);
                                    }}
                                >
                                    <ArrowRight size={14} /> Trace Dest
                                </button>
                                <button
                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-purple-400 transition-colors flex items-center gap-2"
                                    onClick={() => {
                                        if (selectedNode) expandBurst(selectedNode, 1000);
                                        setMenu(null);
                                    }}
                                >
                                    <Network size={14} /> Blast Expand (1k)
                                </button>
                                <div className="h-px bg-slate-800 my-1"></div>
                                <button
                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors flex items-center gap-2"
                                    onClick={() => {
                                        if (menu) propagateRisk(menu.id, 100);
                                        setMenu(null);
                                    }}
                                >
                                    <ShieldAlert size={14} /> Mark Suspicious
                                </button>
                                <button
                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-400 transition-colors flex items-center gap-2"
                                    onClick={() => {
                                        setNodes((nds) => nds.filter((n) => n.id !== menu.id));
                                        setMenu(null);
                                    }}
                                >
                                    <X size={14} /> Hide Node
                                </button>
                            </div>
                        )}
                    </ReactFlow>
                </div>

                {/* 2. Inspector Panel (Right, Flex Item, Outside ReactFlow) */}
                <div className={`
                    bg-slate-900 border-l border-slate-800 flex flex-col transition-all duration-300 ease-in-out
                    ${selectedNode ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full border-none overflow-hidden'}
                `}>
                    {selectedNode && (
                        loading && !selectedNodeData ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                                <Loader2 className="animate-spin w-8 h-8 text-cyan-500" />
                                <span className="text-xs font-mono">Analyzing Node...</span>
                            </div>
                        ) : selectedNodeData ? (
                            <div className="p-4 space-y-6 overflow-y-auto h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
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

                                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Network size={12} />} Deep Trace (2 Layers)
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
                                            {JSON.stringify({
                                                ...selectedNodeData,
                                                // Truncate large arrays for display performance
                                                utxos: selectedNodeData.utxos?.length > 10
                                                    ? [...selectedNodeData.utxos.slice(0, 10), `... ${selectedNodeData.utxos.length - 10} more items`]
                                                    : selectedNodeData.utxos,
                                                vin: selectedNodeData.vin?.length > 10
                                                    ? [...selectedNodeData.vin.slice(0, 10), `... ${selectedNodeData.vin.length - 10} more items`]
                                                    : selectedNodeData.vin,
                                                vout: selectedNodeData.vout?.length > 10
                                                    ? [...selectedNodeData.vout.slice(0, 10), `... ${selectedNodeData.vout.length - 10} more items`]
                                                    : selectedNodeData.vout
                                            }, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Select a node to inspect details.
                            </div>
                        )
                    )}
                </div>
            </div>
        </main>
    );
}

