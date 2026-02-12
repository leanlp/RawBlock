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
    MiniMap,
    Connection,
    Handle,
    Position,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PageHeader from "../../../components/PageHeader";
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
      group relative min-w-44 md:min-w-56 ${bgClass} backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl 
      transition-all duration-700 ease-out
      md:hover:scale-125 hover:z-50 hover:shadow-[0_0_40px_-5px_rgba(56,189,248,0.5)]
      ${isRisky ? 'border-red-500/30' : 'hover:border-cyan-500/50'}
    `}>
            {/* Glow Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${isRisky ? 'from-red-500 to-orange-600' : 'from-cyan-500 to-blue-600'} rounded-xl opacity-0 group-hover:opacity-20 transition duration-1000 blur`}></div>

            {/* HOVER CARD OVERLAY (Appears on top) */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[80vw] max-w-md hidden group-hover:block z-[60] pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600 p-3 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Full Transaction ID</div>
                    <div className="text-xs font-mono text-cyan-300 break-all leading-tight select-all">{data.label}</div>
                    <div className="mt-2 text-xs text-slate-500">Click to Inspect</div>
                </div>
            </div>

            <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-3 !h-3 !-left-1.5" />

            <div className="relative p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Transaction</span>
                        <span className="text-xs font-mono text-slate-200 truncate max-w-36" title={data.label}>
                            {data.label.substring(0, 8)}...{data.label.substring(data.label.length - 8)}
                        </span>
                    </div>
                    {isRisky ? (
                        <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
        <div className={`group
        relative min-w-44 md:min-w-56 ${bgClass} backdrop-blur rounded-full border border-slate-700 shadow-xl flex items-center gap-3 p-1.5 pr-6 
        transition-all duration-700 ease-out
        hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]
        md:hover:scale-125 hover:z-50
      `}>
            {/* HOVER CARD OVERLAY */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-[75vw] max-w-sm hidden group-hover:block z-[60] pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600 p-3 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Wallet Address</div>
                    <div className="text-xs font-mono text-purple-300 break-all leading-tight select-all">{data.label}</div>
                    <div className="mt-2 text-xs text-emerald-400 font-bold">Balance: {data.balance} BTC</div>
                </div>
            </div>

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
                <div className="text-xs font-mono text-slate-200 truncate max-w-32">{data.label.substring(0, 6)}...{data.label.substring(data.label.length - 6)}</div>
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
        <div className="min-w-[80vw] max-w-md h-full bg-slate-900/40 border-2 border-dashed border-slate-700/50 rounded-xl p-4 flex flex-col justify-end relative group transition-all hover:bg-slate-900/60 hover:border-slate-600">
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
    const [notification, setNotification] = useState<{ type: 'error' | 'success', message: string } | null>(null);

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

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
    const [flowInstance, setFlowInstance] = useState<any>(null);

    const handleZoomIn = useCallback(() => {
        if (!flowInstance) return;
        const currentZoom = flowInstance.getZoom?.() ?? 1;
        const nextZoom = Math.min(2, currentZoom * 1.2);
        flowInstance.zoomTo?.(nextZoom, { duration: 150 });
    }, [flowInstance]);

    const handleZoomOut = useCallback(() => {
        if (!flowInstance) return;
        const currentZoom = flowInstance.getZoom?.() ?? 1;
        const nextZoom = Math.max(0.2, currentZoom / 1.2);
        flowInstance.zoomTo?.(nextZoom, { duration: 150 });
    }, [flowInstance]);

    const handleFitView = useCallback(() => {
        flowInstance?.fitView?.({ padding: 0.3, duration: 150 });
    }, [flowInstance]);

    // --- Touch Long-Press State for Mobile Context Menu ---
    const touchStartRef = React.useRef<{ x: number; y: number; nodeId: string; timeout: NodeJS.Timeout | null }>({ x: 0, y: 0, nodeId: '', timeout: null });

    const handleTouchStart = useCallback((event: React.TouchEvent, node: Node) => {
        const touch = event.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            nodeId: node.id,
            timeout: setTimeout(() => {
                // Long press detected - open context menu
                const pane = ref.current?.getBoundingClientRect();
                setMenu({
                    id: node.id,
                    top: touch.clientY < (pane?.height || 0) - 200 ? touch.clientY : undefined as any,
                    bottom: touch.clientY >= (pane?.height || 0) - 200 ? (pane?.height || 0) - touch.clientY : undefined,
                    left: touch.clientX < (pane?.width || 0) - 200 ? touch.clientX : undefined as any,
                    right: touch.clientX >= (pane?.width || 0) - 200 ? (pane?.width || 0) - touch.clientX : undefined,
                });
                setSelectedNode(node);
            }, 200) // 200ms long-press threshold
        };
    }, [setMenu, setSelectedNode]);

    const handleTouchMove = useCallback((event: React.TouchEvent) => {
        const touch = event.touches[0];
        const dx = Math.abs(touch.clientX - touchStartRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);
        // Cancel if moved more than 6px
        if (dx > 6 || dy > 6) {
            if (touchStartRef.current.timeout) {
                clearTimeout(touchStartRef.current.timeout);
                touchStartRef.current.timeout = null;
            }
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (touchStartRef.current.timeout) {
            clearTimeout(touchStartRef.current.timeout);
            touchStartRef.current.timeout = null;
        }
    }, []);

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
        { id: 'pizza', label: '🍕 Pizza Address (Laszlo)', value: '1XPTgYs9xZ64oM22f7QWpZnqbL6N3Fp1xH', defaultHeight: 57044 },
        { id: 'genesis', label: '🏛️ Satoshi Genesis', value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', defaultHeight: 0 },
        { id: 'mtgox', label: '🏴‍☠️ Mt Gox Hack (1Feex)', value: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF', defaultHeight: 135303 },
        { id: 'wikileaks', label: '📢 Wikileaks Donation', value: '1HB5XMLmzFVj8ALj6mfBsbifRoD4miY36v', defaultHeight: 89000 },
    ];



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
            setNotification({ type: 'error', message: "Failed to fetch data: " + e.message });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;

        const exists = nodes.find(n => n.id === searchQuery);
        if (exists) {
            setNotification({ type: 'error', message: "Node already in workspace" });
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

    const handleExportImage = useCallback(async () => {
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) return;

        setLoading(true);
        try {
            const { toBlob } = await import('html-to-image');
            const blob = await toBlob(viewport, { backgroundColor: '#020617' });

            if (!blob) {
                throw new Error('Failed to generate image');
            }

            const file = new File([blob], `forensics_graph_${Date.now()}.png`, { type: 'image/png' });

            // Try Web Share API for mobile native sharing
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: 'Forensics Graph' });
                } catch (shareError: any) {
                    // User cancelled or share failed - fall back to download
                    if (shareError.name !== 'AbortError') {
                        downloadBlob(blob);
                    }
                }
            } else {
                // Fallback: direct download
                downloadBlob(blob);
            }
        } catch (err) {
            console.error('Snapshot failed', err);
        } finally {
            setLoading(false);
        }

        function downloadBlob(blob: Blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `forensics_graph_${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
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
            setNotification({ type: 'error', message: `Trace Failed: ${e.message}` });
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
    // --- Accounting Mode Logic ---
    const activateAccountingMode = useCallback(async (addressNode: Node, addressData: any) => {
        // 1. Clear Graph but keep ROOT
        const rootPosition = addressNode.position;
        setNodes([addressNode]);
        setEdges([]);

        if (!addressData.utxos || addressData.utxos.length === 0) return;

        // 2. Data Preparation & Sorting
        // Sort UTXOs by height/date desc (newest first) or asc? 
        // Forensic usually wants to see the history. Oldest first (Genesis) makes sense for these cases.
        const sortedUtxos = [...addressData.utxos].sort((a: any, b: any) => {
            const hA = a.block_height || a.height || 0;
            const hB = b.block_height || b.height || 0;
            return hA - hB; // ASCENDING: Oldest first (Genesis at top/start)
        });

        const BURST_LIMIT = 50;
        const initialBatch = sortedUtxos.slice(0, BURST_LIMIT);
        const remaining = sortedUtxos.slice(BURST_LIMIT);

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        // 3. Layout Configuration (Radial / Orbit Layout)
        // Distribute nodes in concentric circles around the root address.
        // Ring 1: First 20 nodes at Radius 500px
        // Ring 2: Next 30 nodes at Radius 850px
        const CENTER_X = rootPosition.x;
        const CENTER_Y = rootPosition.y;

        initialBatch.forEach((utxo: any, index: number) => {
            // Determine Ring
            const ringIndex = Math.floor(index / 20); // 0 or 1 (for 50 items)
            const itemsInRing = Math.min(20, initialBatch.length - (ringIndex * 20)); // How many in this specific ring

            // Calculate Angle
            // We want to distribute them evenly in the ring.
            // Index within the ring:
            const indexInRing = index % 20;
            const angleStep = (2 * Math.PI) / (ringIndex === 0 ? 20 : 30); // Use fixed denominator for stability or dynamic?
            // Dynamic is better for perfect circle:
            // const angleStep = (2 * Math.PI) / Math.min(20, initialBatch.length - (ringIndex * 20)); 

            // Let's use a nice distribution. 
            // Ring 1: 0..19. Angle = index * (360/20)
            const angle = indexInRing * ((2 * Math.PI) / (ringIndex === 0 ? 20 : 30));

            // Radius
            const radius = 500 + (ringIndex * 350); // 500, 850...

            const x = CENTER_X + radius * Math.cos(angle);
            const y = CENTER_Y + radius * Math.sin(angle);

            // Fix Date Logic (Year Detection)
            let year = "Unknown";
            const height = utxo.block_height || utxo.height; // FIXED: Support both formats
            if (utxo.status?.block_time) {
                year = new Date(utxo.status.block_time * 1000).getFullYear().toString();
            } else if (height) {
                if (height < 32000) year = "2009";
                else if (height < 100000) year = "2010";
                else if (height < 150000) year = "2011"; // Approx
                else year = "Legacy";
            }

            // Fix Value Logic
            const rawValue = utxo.value !== undefined ? utxo.value : utxo.amount;
            const valStr = rawValue !== undefined ? rawValue.toString() : "0";

            // Genesis override
            if (height === 0 || (parseFloat(valStr) >= 50 && year === "Unknown")) year = "2009";

            const nodeId = `utxo-${utxo.txid}-${utxo.vout}`;

            newNodes.push({
                id: nodeId,
                type: 'tx',
                position: { x, y },
                data: {
                    label: `${valStr} BTC`,
                    value: valStr,
                    risk: 0,
                    tag: year,
                    type: 'utxo_leaf',
                    ...utxo
                }
            });

            newEdges.push({
                id: `e-root-${nodeId}`,
                source: addressNode.id,
                target: nodeId,
                animated: true,
                type: 'default', // Curve works best for radial
                style: { stroke: '#5eead4', strokeWidth: 1.5, opacity: 0.6 } // Cyan/Teal
            });
        });

        // 4. Handle Overflow (Load More Node)
        if (remaining.length > 0) {
            const overflowNodeId = `overflow-${addressNode.id}`;
            // Place overflow at bottom center of the outer ring
            newNodes.push({
                id: overflowNodeId,
                type: 'default',
                position: {
                    x: CENTER_X,
                    y: CENTER_Y + 1000 // Below the outer ring
                },
                data: {
                    label: `Load ${remaining.length} More...`,
                    action: 'load_more_utxos',
                    remainingUtxos: remaining
                },
                style: {
                    background: '#1e293b',
                    color: '#94a3b8',
                    border: '1px dashed #475569',
                    borderRadius: '8px',
                    width: 180,
                    cursor: 'pointer'
                }
            });

            newEdges.push({
                id: `e-overflow-${overflowNodeId}`,
                source: addressNode.id,
                target: overflowNodeId,
                style: { stroke: '#334155', strokeDasharray: '4 4' }
            });
        }

        setNodes([addressNode, ...newNodes]);
        setEdges(newEdges);

        // Auto-Fit
        setTimeout(() => {
            const fitBtn = document.querySelector('.react-flow__controls-fitview');
            if (fitBtn) (fitBtn as HTMLButtonElement).click();
        }, 500);

    }, [setNodes, setEdges]);


    // MOVED: loadCaseStudy here to access activateAccountingMode
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
            let data: any = null;
            try {
                const res = await fetch(`/data/forensics/${studyId}.json`);
                if (res.ok) {
                    const staticCase = await res.json();
                    if (staticCase && !staticCase.error) {
                        data = staticCase;
                    }
                }
            } catch (e) { console.warn("Static fetch fail", e); }

            if (!data) {
                setNotification({ type: 'error', message: "Could not load case study. Static files missing." });
                return;
            }

            // Create Root Node
            const newNode: Node = {
                id: study.value,
                type: data.type === 'transaction' ? 'tx' : 'address',
                position: { x: 500, y: 400 },
                data: {
                    label: data.type === 'transaction' ? data.txid.substring(0, 8) + '...' : data.address.substring(0, 8) + '...',
                    value: data.type === 'transaction' ? '0.00' : data.balance,
                    risk: 0,
                    tag: data.type === 'address' ? 'Case Study' : undefined,
                    source: 'Static Archive',
                    block_height: data.blockheight || data.block_height || study.defaultHeight,
                    ...data
                }
            };

            // Auto-Expand if UTXOs exist (Historic Data)
            if (data.type === 'address' && data.utxos && data.utxos.length > 0) {
                console.log("Auto-Expanding Case Study UTXOs...");
                setNodes([newNode]); // Set root first
                // Use a small timeout to let the state settle or call logic directly
                // Calling logic directly passes the 'newNode' which is what we want
                activateAccountingMode(newNode, data);
            } else {
                setNodes([newNode]);
            }

        } finally {
            setLoading(false);
        }
    };


    const onNodeClick = useCallback(async (event: any, node: Node) => {
        // --- LOAD MORE LOGIC (Radial Expansion) ---
        if (node.data.action === 'load_more_utxos') {
            const remaining = (node.data.remainingUtxos as any[]) || [];
            if (remaining.length === 0) return;

            setLoading(true);

            // 1. Calculate Batch
            const BATCH_SIZE = 50;
            const nextBatch = remaining.slice(0, BATCH_SIZE);
            const nextRemaining = remaining.slice(BATCH_SIZE);

            // 2. Determine Start State for Layout
            // Count existing UTXO nodes to continue the spiral/rings
            const currentUtxoCount = nodes.filter(n => n.type === 'tx').length;
            const addressNode = nodes.find(n => n.type === 'address' || n.type === 'cluster' || n.id === node.parentId) || nodes[0]; // Fallback to root
            const CENTER_X = addressNode.position.x;
            const CENTER_Y = addressNode.position.y;

            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            nextBatch.forEach((utxo: any, i: number) => {
                const globalIndex = currentUtxoCount + i;

                // Dynamic Ring Logic:
                // Ring 0: 20 items
                // Ring 1: 30 items
                // Ring 2+: 40 items...
                // This is an approximation to avoid complex loop calculation every click.
                // Simplified: Just assume rings of 30 after the first 20.
                let ringIndex = 0;
                let indexInRing = globalIndex;

                if (globalIndex < 20) {
                    ringIndex = 0;
                } else {
                    // Offset by first 20
                    const adjusted = globalIndex - 20;
                    ringIndex = 1 + Math.floor(adjusted / 30);
                    indexInRing = adjusted % 30;
                }

                const ringCapacity = ringIndex === 0 ? 20 : 30;
                const angle = indexInRing * ((2 * Math.PI) / ringCapacity);
                const radius = 500 + (ringIndex * 300); // Tighten radius slightly for outer rings? 350 was okay. Keep 300-350.

                const x = CENTER_X + radius * Math.cos(angle);
                const y = CENTER_Y + radius * Math.sin(angle);

                // Re-use logic for Year/Value
                let year = "Unknown";
                const height = utxo.block_height || utxo.height;
                const rawValue = utxo.value !== undefined ? utxo.value : utxo.amount;
                const valStr = rawValue !== undefined ? rawValue.toString() : "0";

                if (height < 32000) year = "2009";
                else if (height < 100000) year = "2010";
                else year = "Later";

                // Genesis overrides
                if (height === 0 || (parseFloat(valStr) >= 50 && year === "Unknown")) year = "2009";

                const nodeId = `utxo-${utxo.txid}-${utxo.vout}`;
                newNodes.push({
                    id: nodeId,
                    type: 'tx',
                    position: { x, y },
                    data: {
                        label: `${valStr} BTC`,
                        value: valStr,
                        risk: 0,
                        tag: year,
                        type: 'utxo_leaf',
                        ...utxo
                    }
                });

                newEdges.push({
                    id: `e-${addressNode.id}-${nodeId}`,
                    source: addressNode.id,
                    target: nodeId,
                    type: 'default',
                    animated: true,
                    style: { stroke: '#5eead4', strokeWidth: 1.5, opacity: 0.6 }
                });
            });

            // 3. Handle Next Load More
            if (nextRemaining.length > 0) {
                const newOverflowId = `overflow-${Date.now()}`;
                // Place it further down
                const lastNode = newNodes[newNodes.length - 1];

                newNodes.push({
                    id: newOverflowId,
                    type: 'default',
                    position: {
                        x: CENTER_X,
                        y: lastNode.position.y + 400 // Push it down below the cluster
                    },
                    data: {
                        label: `Load ${nextRemaining.length} More...`,
                        action: 'load_more_utxos',
                        remainingUtxos: nextRemaining
                    },
                    style: {
                        background: '#1e293b',
                        color: '#94a3b8',
                        border: '1px dashed #475569',
                        borderRadius: '8px',
                        width: 180,
                        cursor: 'pointer'
                    }
                });

                newEdges.push({
                    id: `e-overflow-${newOverflowId}`,
                    source: addressNode.id,
                    target: newOverflowId,
                    style: { stroke: '#334155', strokeDasharray: '4 4' }
                });
            }

            // Remove the Old Load More Node
            setNodes((nds) => nds.filter(n => n.id !== node.id).concat(newNodes));
            setEdges((eds) => eds.filter(e => e.target !== node.id).concat(newEdges)); // Remove edge to old button

            setTimeout(() => setLoading(false), 300);
            return;
        }

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

        setNotification({ type: 'success', message: `Taint Simulation: Propagated High Risk to ${visited.size - 1} downstream nodes.` });
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
        <main className="h-screen w-full bg-slate-950 flex flex-col relative overflow-hidden">
            {/* Standardized Header */}
            <div className="bg-slate-950 px-4 md:px-8 pt-4 z-50 shadow-sm relative">
                <PageHeader
                    title="Forensics Workbench"
                    subtitle="Professional Audit Board & Taint Analysis"
                    icon={<ShieldAlert className="w-8 h-8 text-cyan-400" />}
                    gradient="from-cyan-400 to-blue-500"
                />
            </div>

            {/* Notifications */}
            {notification && (
                <div className={`
                    absolute top-32 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300
                    ${notification.type === 'error' ? 'bg-red-500/10 border border-red-500/50 text-red-200' : 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-200'}
                    backdrop-blur-xl
                `}>
                    {notification.type === 'error' ? <ShieldAlert size={20} /> : <ShieldAlert size={20} />}
                    <span className="font-semibold">{notification.message}</span>
                </div>
            )}

            {/* Case Studies Icon Rail */}
            <div className="hidden md:block absolute top-48 left-4 z-40 w-16 bg-slate-900/85 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col items-center gap-2 p-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cases</div>
                    {CASE_STUDIES.map(study => (
                        <button
                            key={study.id}
                            onClick={() => loadCaseStudy(study.id)}
                            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-cyan-500/15 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all"
                            title={study.label}
                            aria-label={study.label}
                        >
                            <span className="text-lg filter drop-shadow-lg">{study.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Case Buttons */}
            <div className="md:hidden px-4 pb-3">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-2 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                    {CASE_STUDIES.map(study => (
                        <button
                            key={study.id}
                            onClick={() => loadCaseStudy(study.id)}
                            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-cyan-500/15 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all flex-shrink-0"
                            title={study.label}
                            aria-label={study.label}
                        >
                            <span className="text-lg filter drop-shadow-lg">{study.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>




            {/* Main Content: Flex Row */}
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative mt-0 border-t border-slate-900 text-white">

                {/* 1. Graph Container (Left / Center) */}
                <div className="flex-1 h-full relative bg-slate-950">

                    {/* Command Center (Relocated to Top Right) */}
                    <div className="absolute top-4 right-4 z-30 md:z-50 flex flex-col items-end gap-3 w-[calc(100%-2rem)] md:w-auto pointer-events-none">

                        {/* 1. Search Bar */}
                        <div className="flex gap-2 w-full md:w-full md:max-w-md pointer-events-auto shadow-2xl shadow-cyan-900/20">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter TxID or Address... (Cmd+F)"
                                id="search-input"
                                className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-500"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                            </button>
                        </div>

                        {/* 2. Toolbar (Controls) */}
                        <div className="hidden md:flex bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl md:rounded-full p-2 md:p-1.5 flex-wrap md:flex-nowrap justify-center gap-2 md:gap-1 shadow-xl pointer-events-auto items-center max-w-full overflow-x-auto no-scrollbar">
                            <div className="flex bg-slate-800/50 rounded-full p-1 mr-2 gap-1">
                                <button
                                    onClick={() => handleAutoLayout('horizontal')}
                                    className={`p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full transition-all ${layoutMode === 'horizontal' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    title="Horizontal Layout"
                                >
                                    <ArrowRight size={14} />
                                </button>
                                <button
                                    onClick={() => handleAutoLayout('vertical')}
                                    className={`p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full transition-all ${layoutMode === 'vertical' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    title="Vertical Layout"
                                >
                                    <ArrowRight size={14} className="rotate-90" />
                                </button>
                                <button
                                    onClick={() => handleAutoLayout('radial')}
                                    className={`p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full transition-all ${layoutMode === 'radial' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    title="Radial Layout"
                                >
                                    <Network size={14} />
                                </button>
                            </div>

                            <div className="hidden md:block w-px h-4 bg-slate-700 mx-0.5"></div>

                            <button
                                onClick={toggleHeatmap}
                                className={`min-h-11 min-w-11 inline-flex items-center justify-center p-2 rounded-full transition-all ${heatmapMode ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/50' : 'text-slate-400 hover:bg-slate-800 hover:text-red-400'}`}
                                title="Risk Heatmap"
                            >
                                <ShieldAlert size={16} />
                            </button>
                            <button
                                onClick={() => {
                                    const layout = getTimelineLayout(nodes, edges);
                                    setNodes(layout.nodes);
                                    // setEdges(layout.edges);
                                    setTimeout(() => document.querySelector<HTMLElement>('.react-flow__controls-fitview')?.click(), 200);
                                }}
                                className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 rounded-full transition-all text-slate-400 hover:bg-slate-800 hover:text-blue-400"
                                title="Timeline View (Block Height)"
                            >
                                <Clock size={16} />
                            </button>

                            <div className="hidden md:block w-px h-4 bg-slate-700 mx-0.5"></div>

                            <button className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center hover:bg-slate-800 rounded-md text-slate-400 hover:text-cyan-400 transition-colors" title="Add Node"><Plus size={18} /></button>
                            <button onClick={saveEvidence} className="hidden md:inline-flex p-2 min-h-11 min-w-11 items-center justify-center hover:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-400 transition-colors" title="Save Evidence"><Save size={16} /></button>
                            <button onClick={handleExportCSV} className="hidden md:inline-flex p-2 min-h-11 min-w-11 items-center justify-center hover:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-400 transition-colors" title="Export CSV"><FileText size={16} /></button>
                            <button onClick={handleExportImage} className="hidden md:inline-flex p-2 min-h-11 min-w-11 items-center justify-center hover:bg-slate-800 rounded-full text-slate-400 hover:text-indigo-400 transition-colors" title="Export Image"><Camera size={16} /></button>
                        </div>
                    </div>
                    <ReactFlow
                        proOptions={{ hideAttribution: true }}
                        onInit={setFlowInstance}
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

                        {/* Custom Zoom Controls Bottom-Left */}
                        <div className="absolute bottom-4 left-4 z-30 md:z-50">
                            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                                <button
                                    onClick={handleZoomIn}
                                    className="w-11 h-11 inline-flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 border-b border-slate-700 transition-colors"
                                    title="Zoom In"
                                    aria-label="Zoom In"
                                >
                                    +
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    className="w-11 h-11 inline-flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 border-b border-slate-700 transition-colors"
                                    title="Zoom Out"
                                    aria-label="Zoom Out"
                                >
                                    −
                                </button>
                                <button
                                    onClick={handleFitView}
                                    className="w-11 h-11 inline-flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold"
                                    title="Fit View"
                                    aria-label="Fit View"
                                >
                                    FIT
                                </button>
                            </div>
                        </div>

                        {/* Mobile Node Actions Button (Visible when node is selected) */}
                        {selectedNode && (
                            <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <button
                                    onClick={() => {
                                        // Open context menu at bottom center
                                        const rect = ref.current?.getBoundingClientRect();
                                        setMenu({
                                            id: selectedNode.id,
                                            top: undefined as any,
                                            bottom: 120,
                                            left: (rect?.width || 300) / 2 - 80,
                                            right: undefined
                                        });
                                    }}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-full shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all active:scale-95"
                                >
                                    <Network size={18} />
                                    <span>Node Actions</span>
                                </button>
                            </div>
                        )}



                        {/* Context Menu */}
                        {menu && (
                            <div
                                className="absolute z-30 md:z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-40"
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

                {/* 2. Inspector Panel (Right, Flex Item on Desktop, Absolute Bottom Sheet on Mobile) */}
                <div className={`
                    bg-slate-900 border-l border-t md:border-t-0 border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-[60]
                    absolute md:relative bottom-0 md:bottom-auto right-0 md:right-auto
                    ${selectedNode
                        ? 'w-full h-[60vh] md:w-80 md:h-full opacity-100 translate-y-0 md:translate-x-0 cursor-auto'
                        : 'w-full md:w-0 h-0 md:h-full opacity-0 translate-y-full md:translate-x-full border-none overflow-hidden'}
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
                                        <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white min-h-11 min-w-11 inline-flex items-center justify-center"><X size={16} /></button>
                                    </div>
                                    <h2 className="text-sm font-mono text-white break-all bg-slate-950 p-2 rounded border border-slate-800 select-all">
                                        {selectedNode.id}
                                    </h2>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
