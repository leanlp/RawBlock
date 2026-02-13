"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  MiniMap,
  Panel,
  useReactFlow,
  useNodesInitialized,
  type Edge as FlowEdge,
  type Node as FlowNode,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { graphStore } from "@/lib/graph/store";
import { getCanonicalPath } from "@/lib/graph/pathEngine";
import { NODE_TYPE_PRESENTATION } from "@/lib/graph/nodeTypePresentation";

const TYPE_ORDER = [
  "primitive",
  "rule",
  "mechanism",
  "upgrade",
  "attack",
  "vulnerability",
  "assumption",
  "property",
] as const;

const TYPE_COLORS: Record<(typeof TYPE_ORDER)[number], string> = {
  primitive: "#06b6d4",
  rule: "#22c55e",
  mechanism: "#3b82f6",
  upgrade: "#a855f7",
  attack: "#ef4444",
  vulnerability: "#f43f5e",
  assumption: "#14b8a6",
  property: "#f59e0b",
};

const MIN_GRAPH_ZOOM = 0.5;
const MAX_GRAPH_ZOOM = 3;
const ZOOM_TRANSITION_MS = 300;

const DIFFICULTY_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#f59e0b",
  4: "#ef4444",
};

const RELATION_LEGEND = [
  { type: "DEPENDS_ON", meaning: "A concept requires another prerequisite." },
  { type: "PART_OF", meaning: "A component belongs to a larger structure." },
  { type: "VALIDATED_BY", meaning: "A rule/mechanism verifies another element." },
  { type: "INTRODUCES", meaning: "An upgrade/process introduces a new capability." },
  { type: "CREATES", meaning: "A process creates a new object/state." },
  { type: "SPENDS", meaning: "An input consumes an existing UTXO state." },
  { type: "IS_UNSPENT_FORM_OF", meaning: "UTXO is the unspent state of an output." },
  { type: "EXPLOITS", meaning: "An attack/vulnerability targets a weakness." },
  { type: "MITIGATED_BY", meaning: "A control/rule reduces attack impact." },
  { type: "STRENGTHENS", meaning: "Improves resilience or confidence." },
  { type: "WEAKENS", meaning: "Reduces resilience or trust assumptions." },
  { type: "POLICY_ONLY", meaning: "Relay/mempool behavior, not consensus validity." },
  {
    type: "NOT_CONSENSUS_CRITICAL",
    meaning: "A mechanism affects operations, not global validity rules.",
  },
] as const;

type ConfidenceLabel = "Consensus" | "Policy" | "Observed" | "Inference";

const CONFIDENCE_STYLES: Record<ConfidenceLabel, { border: string; bg: string; text: string }> = {
  Consensus: { border: "rgba(34, 197, 94, 0.55)", bg: "rgba(34, 197, 94, 0.16)", text: "#bbf7d0" },
  Policy: { border: "rgba(59, 130, 246, 0.55)", bg: "rgba(59, 130, 246, 0.16)", text: "#bfdbfe" },
  Observed: { border: "rgba(245, 158, 11, 0.55)", bg: "rgba(245, 158, 11, 0.16)", text: "#fde68a" },
  Inference: { border: "rgba(168, 85, 247, 0.55)", bg: "rgba(168, 85, 247, 0.16)", text: "#e9d5ff" },
};

function getNodeConfidence(node: { id: string; type: string; title: string }): ConfidenceLabel {
  const key = `${node.id} ${node.title}`.toLowerCase();
  if (key.includes("policy") || key.includes("mempool replacement") || key.includes("min relay")) {
    return "Policy";
  }
  if (node.type === "attack" || node.type === "vulnerability") {
    if (
      key.includes("cve") ||
      key.includes("2010") ||
      key.includes("2013") ||
      key.includes("2018") ||
      key.includes("malleability")
    ) {
      return "Observed";
    }
    return "Inference";
  }
  if (node.type === "rule" || node.type === "primitive" || node.type === "upgrade") {
    return "Consensus";
  }
  return "Inference";
}

function getEdgeConfidence(edgeType: string): ConfidenceLabel {
  if (edgeType === "POLICY_ONLY" || edgeType === "NOT_CONSENSUS_CRITICAL") return "Policy";
  if (edgeType === "EXPLOITS") return "Observed";
  if (
    edgeType === "DEPENDS_ON" ||
    edgeType === "PART_OF" ||
    edgeType === "VALIDATED_BY" ||
    edgeType === "CREATES" ||
    edgeType === "SPENDS" ||
    edgeType === "IS_UNSPENT_FORM_OF" ||
    edgeType === "INTRODUCES"
  ) {
    return "Consensus";
  }
  return "Inference";
}

type GraphThemePalette = {
  pageBg: string;
  sectionBg: string;
  sectionBorder: string;
  textPrimary: string;
  textMuted: string;
  textSubtle: string;
  nodeBg: string;
  nodeText: string;
  nodeMeta: string;
  nodeChipBg: string;
  nodeChipBorder: string;
  edgeDefault: string;
  tooltipBg: string;
  tooltipBorder: string;
  minimapMask: string;
};

const DARK_THEME: GraphThemePalette = {
  pageBg: "#020617",
  sectionBg: "rgba(15, 23, 42, 0.5)",
  sectionBorder: "#1e293b",
  textPrimary: "#e2e8f0",
  textMuted: "#94a3b8",
  textSubtle: "#64748b",
  nodeBg: "#020617",
  nodeText: "#f8fafc",
  nodeMeta: "#94a3b8",
  nodeChipBg: "rgba(15, 23, 42, 0.8)",
  nodeChipBorder: "rgba(51, 65, 85, 0.95)",
  edgeDefault: "#475569",
  tooltipBg: "rgba(2, 6, 23, 0.95)",
  tooltipBorder: "rgba(51, 65, 85, 0.8)",
  minimapMask: "rgba(2,6,23,0.65)",
};

const LIGHT_THEME: GraphThemePalette = {
  pageBg: "#f8fafc",
  sectionBg: "rgba(255, 255, 255, 0.95)",
  sectionBorder: "#cbd5e1",
  textPrimary: "#0f172a",
  textMuted: "#334155",
  textSubtle: "#475569",
  nodeBg: "#ffffff",
  nodeText: "#0f172a",
  nodeMeta: "#334155",
  nodeChipBg: "rgba(241, 245, 249, 0.95)",
  nodeChipBorder: "rgba(148, 163, 184, 0.8)",
  edgeDefault: "#64748b",
  tooltipBg: "rgba(255, 255, 255, 0.98)",
  tooltipBorder: "rgba(148, 163, 184, 0.75)",
  minimapMask: "rgba(226,232,240,0.72)",
};

function lanePosition(type: string, row: number): { x: number; y: number } {
  const lane = Math.max(0, TYPE_ORDER.indexOf(type as (typeof TYPE_ORDER)[number]));
  return {
    x: lane * 290,
    y: row * 110,
  };
}

function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, MIN_GRAPH_ZOOM), MAX_GRAPH_ZOOM);
}

function GraphZoomPanel({
  zoomLevel,
  onZoomLabelChange,
  theme,
}: {
  zoomLevel: number;
  onZoomLabelChange: (zoom: number) => void;
  theme: GraphThemePalette;
}) {
  const { getViewport, setViewport, setCenter, getNodes } = useReactFlow();
  const canZoomOut = zoomLevel > MIN_GRAPH_ZOOM + 0.001;
  const canZoomIn = zoomLevel < MAX_GRAPH_ZOOM - 0.001;

  const applyZoomValue = (raw: number) => {
    const nextZoom = clampZoom(raw);
    const current = getViewport();
    onZoomLabelChange(nextZoom);
    setViewport({ ...current, zoom: nextZoom }, { duration: ZOOM_TRANSITION_MS });
  };

  const handleZoomIn = () => {
    if (!canZoomIn) return;
    const current = getViewport();
    const nextZoom = clampZoom(current.zoom * 1.2);
    onZoomLabelChange(nextZoom);
    setViewport({ ...current, zoom: nextZoom }, { duration: ZOOM_TRANSITION_MS });
  };

  const handleZoomOut = () => {
    if (!canZoomOut) return;
    const current = getViewport();
    const nextZoom = clampZoom(current.zoom / 1.2);
    onZoomLabelChange(nextZoom);
    setViewport({ ...current, zoom: nextZoom }, { duration: ZOOM_TRANSITION_MS });
  };

  const handleReset = () => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      onZoomLabelChange(1);
      setViewport({ x: 0, y: 0, zoom: 1 }, { duration: ZOOM_TRANSITION_MS });
      return;
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    nodes.forEach((node) => {
      const width = node.measured?.width ?? 240;
      const height = node.measured?.height ?? 72;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const nextZoom = 1;

    onZoomLabelChange(nextZoom);
    setCenter(centerX, centerY, { zoom: nextZoom, duration: ZOOM_TRANSITION_MS });
  };

  return (
    <Panel position="top-right">
      <div
        className="w-44 rounded-lg border p-2 shadow-xl"
        style={{ borderColor: theme.sectionBorder, background: theme.sectionBg }}
      >
        <p className="mb-2 text-[10px] uppercase tracking-wide" style={{ color: theme.textMuted }}>
          Zoom
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={!canZoomOut}
            className="h-7 w-7 rounded border hover:border-cyan-500/60 disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              borderColor: theme.sectionBorder,
              background: theme.sectionBg,
              color: theme.textPrimary,
            }}
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={!canZoomIn}
            className="h-7 w-7 rounded border hover:border-cyan-500/60 disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              borderColor: theme.sectionBorder,
              background: theme.sectionBg,
              color: theme.textPrimary,
            }}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded border px-2 py-1 text-[11px] hover:border-cyan-500/60"
            style={{
              borderColor: theme.sectionBorder,
              background: theme.sectionBg,
              color: theme.textMuted,
            }}
          >
            Reset
          </button>
        </div>
        <input
          type="range"
          min={MIN_GRAPH_ZOOM}
          max={MAX_GRAPH_ZOOM}
          step={0.01}
          value={zoomLevel}
          onInput={(event) => {
            applyZoomValue(Number((event.target as HTMLInputElement).value));
          }}
          onChange={(event) => {
            applyZoomValue(Number(event.target.value));
          }}
          className="mt-2 w-full"
          aria-label="Graph zoom level"
        />
        <p className="mt-1 text-[10px]" style={{ color: theme.textMuted }}>
          {Math.round(zoomLevel * 100)}%
        </p>
      </div>
    </Panel>
  );
}

function GraphFitController({
  containerRef,
  fitVersion,
  suspendAutoFit,
  allowAutoFit,
  onAutoFitApplied,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  fitVersion: string;
  suspendAutoFit: boolean;
  allowAutoFit: boolean;
  onAutoFitApplied?: () => void;
}) {
  const { getNodes, setViewport } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  const fitToContent = useCallback((duration = 220) => {
    const container = containerRef.current;
    if (!container) return;

    const nodes = getNodes();
    if (nodes.length === 0) return;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    nodes.forEach((node) => {
      const width = node.measured?.width ?? 240;
      const height = node.measured?.height ?? 72;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const boundsWidth = Math.max(maxX - minX, 1);
    const boundsHeight = Math.max(maxY - minY, 1);
    const viewportWidth = Math.max(container.clientWidth, 1);
    const viewportHeight = Math.max(container.clientHeight, 1);

    const computedZoom = clampZoom(
      0.9 /
        Math.max(
          boundsWidth / viewportWidth,
          boundsHeight / viewportHeight,
        ),
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const tx = viewportWidth / 2 - computedZoom * centerX;
    const ty = viewportHeight / 2 - computedZoom * centerY;

    requestAnimationFrame(() => {
      setViewport({ x: tx, y: ty, zoom: computedZoom }, { duration });
      onAutoFitApplied?.();
    });
  }, [containerRef, getNodes, onAutoFitApplied, setViewport]);

  useEffect(() => {
    if (suspendAutoFit || !allowAutoFit || !nodesInitialized) return;
    fitToContent(260);
  }, [fitToContent, fitVersion, suspendAutoFit, allowAutoFit, nodesInitialized]);

  useEffect(() => {
    if (suspendAutoFit || !allowAutoFit || !nodesInitialized) return;
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        fitToContent(160);
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [containerRef, fitToContent, suspendAutoFit, allowAutoFit, nodesInitialized]);

  return null;
}

export default function BitcoinMapPage() {
  const router = useRouter();
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const [showFullGraph, setShowFullGraph] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const [showOnlyVulnerabilities, setShowOnlyVulnerabilities] = useState(false);
  const [showOnlyAttackEdges, setShowOnlyAttackEdges] = useState(false);
  const [showOnlyAssumptions, setShowOnlyAssumptions] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<"story" | "graph">(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
      ? "story"
      : "graph",
  );
  const [mobileStoryIndex, setMobileStoryIndex] = useState(0);
  const threatMode =
    showFullGraph &&
    (showOnlyVulnerabilities || showOnlyAttackEdges || showOnlyAssumptions);
  const canonicalPath = getCanonicalPath();
  const theme = isDarkTheme ? DARK_THEME : LIGHT_THEME;
  const canonicalNodeSet = useMemo(
    () => new Set(canonicalPath.orderedNodes),
    [canonicalPath.orderedNodes],
  );
  const canonicalStepPairs = useMemo(() => {
    const pairs = new Set<string>();
    for (let i = 0; i < canonicalPath.orderedNodes.length - 1; i += 1) {
      const from = canonicalPath.orderedNodes[i];
      const to = canonicalPath.orderedNodes[i + 1];
      pairs.add(`${from}->${to}`);
    }
    return pairs;
  }, [canonicalPath.orderedNodes]);
  const hoveredNode = hoveredNodeId ? graphStore.getNode(hoveredNodeId) : null;
  const selectedNode = selectedNodeId ? graphStore.getNode(selectedNodeId) : null;
  const maxMobileStoryIndex = Math.max(canonicalPath.orderedNodes.length - 1, 0);
  const activeMobileStoryIndex = Math.min(mobileStoryIndex, maxMobileStoryIndex);
  const mobileStoryNodeId = canonicalPath.orderedNodes[activeMobileStoryIndex] ?? null;
  const mobileStoryNode = mobileStoryNodeId ? graphStore.getNode(mobileStoryNodeId) : null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      setIsDarkTheme(media.matches);
    };

    syncTheme();
    media.addEventListener("change", syncTheme);
    return () => media.removeEventListener("change", syncTheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 768px)");
    const syncViewport = () => {
      const isMobile = media.matches;
      setIsMobileViewport(isMobile);
      if (isMobile) {
        setMobileViewMode("story");
      }
    };

    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  const effectiveFocusMode = focusMode;
  const effectiveFocusedNodeId =
    focusedNodeId ?? (isMobileViewport ? canonicalPath.orderedNodes[0] ?? null : null);

  const mobileSourceNodes = useMemo(() => {
    const baseNodes = showFullGraph
      ? graphStore.nodes
      : graphStore.nodes.filter((node) => canonicalNodeSet.has(node.id));

    return baseNodes.map((node) => ({
      id: node.id,
      title: node.title,
      type: node.type,
    }));
  }, [showFullGraph, canonicalNodeSet]);

  const handleViewportChange = useCallback((_: unknown, viewport: Viewport) => {
    setZoomLevel(viewport.zoom);
  }, []);

  const handleZoomLabelChange = useCallback((nextZoom: number) => {
    setZoomLevel(clampZoom(nextZoom));
  }, []);

  const handleCanvasWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const { nodes, edges } = useMemo(() => {
    const attackEdgeTypes = new Set(["EXPLOITS", "MITIGATED_BY"]);
    const rowByType = new Map<string, number>();
    const canonicalPathEdgeSet = new Set(
      Array.from(canonicalStepPairs).map((edge) => edge),
    );

    const query = searchQuery.trim().toLowerCase();
    const sourceNodes = (showFullGraph
      ? graphStore.nodes
      : graphStore.nodes.filter((node) => canonicalNodeSet.has(node.id)))
      .filter((node) => {
        if (!query) return true;
        return (
          node.title.toLowerCase().includes(query) ||
          node.id.toLowerCase().includes(query) ||
          NODE_TYPE_PRESENTATION[node.type].label.toLowerCase().includes(query)
        );
      });
    const baseEdges = showFullGraph
      ? graphStore.edges
      : graphStore.edges.filter((edge) =>
          canonicalPathEdgeSet.has(`${edge.from}->${edge.to}`),
        );
    const attackEdges = baseEdges.filter((edge) => attackEdgeTypes.has(edge.type));

    const modeEnabled = threatMode;

    const nodeIdSet = new Set<string>();

    if (!modeEnabled) {
      sourceNodes.forEach((node) => nodeIdSet.add(node.id));
    }

    if (showOnlyVulnerabilities) {
      sourceNodes
        .filter((node) => node.type === "vulnerability")
        .forEach((node) => nodeIdSet.add(node.id));
    }

    if (showOnlyAssumptions) {
      sourceNodes
        .filter((node) => node.type === "assumption")
        .forEach((node) => nodeIdSet.add(node.id));
    }

    if (showOnlyAttackEdges) {
      attackEdges.forEach((edge) => {
        nodeIdSet.add(edge.from);
        nodeIdSet.add(edge.to);
      });
    }

    const visibleNodes = sourceNodes.filter((node) => nodeIdSet.has(node.id));
    const visibleEdges = (showOnlyAttackEdges ? attackEdges : baseEdges).filter(
      (edge) => nodeIdSet.has(edge.from) && nodeIdSet.has(edge.to),
    );
    const focusedNodeIds = new Set<string>();

    if (effectiveFocusMode && effectiveFocusedNodeId) {
      focusedNodeIds.add(effectiveFocusedNodeId);
      visibleEdges.forEach((edge) => {
        if (edge.from === effectiveFocusedNodeId || edge.to === effectiveFocusedNodeId) {
          focusedNodeIds.add(edge.from);
          focusedNodeIds.add(edge.to);
        }
      });
    }

    const focusActive = effectiveFocusMode && effectiveFocusedNodeId !== null;
    const activeNodes = focusActive
      ? visibleNodes.filter((node) => focusedNodeIds.has(node.id))
      : visibleNodes;
    const activeEdges = focusActive
      ? visibleEdges.filter(
          (edge) =>
            focusedNodeIds.has(edge.from) &&
            focusedNodeIds.has(edge.to) &&
            (edge.from === effectiveFocusedNodeId || edge.to === effectiveFocusedNodeId),
        )
      : visibleEdges;

    const shouldStagger = activeNodes.length <= 120;
    const flowNodes: FlowNode[] = activeNodes.map((node, index) => {
      const row = rowByType.get(node.type) ?? 0;
      rowByType.set(node.type, row + 1);
      const position = lanePosition(node.type, row);
      const nodeConfidence = getNodeConfidence(node);
      const confidenceStyle = CONFIDENCE_STYLES[nodeConfidence];

      const isPathNode = canonicalNodeSet.has(node.id);
      const isFocusedNode = focusActive && node.id === effectiveFocusedNodeId;
      const muted = !threatMode && !isPathNode;

      return {
        id: node.id,
        position,
        data: {
          label: (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold" style={{ color: theme.nodeText }}>
                  <span className="mr-1">{NODE_TYPE_PRESENTATION[node.type].icon}</span>
                  {node.title}
                </div>
                <div
                  className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5"
                  style={{
                    borderColor: theme.nodeChipBorder,
                    background: theme.nodeChipBg,
                  }}
                  title={`Difficulty ${node.difficulty}/4`}
                >
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={`${node.id}-difficulty-${level}`}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          level <= node.difficulty
                            ? DIFFICULTY_COLORS[node.difficulty]
                            : "rgba(100, 116, 139, 0.45)",
                        opacity: level <= node.difficulty ? 0.95 : 0.45,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: theme.nodeMeta }}>
                {NODE_TYPE_PRESENTATION[node.type].label} · d{node.difficulty}
              </div>
              <div
                className="inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                style={{
                  borderColor: confidenceStyle.border,
                  background: confidenceStyle.bg,
                  color: confidenceStyle.text,
                }}
              >
                {nodeConfidence}
              </div>
            </div>
          ),
        },
        style: {
          border: isFocusedNode
            ? "2px solid #f59e0b"
            : isPathNode
              ? "2px solid #22d3ee"
              : `1px solid ${TYPE_COLORS[node.type] ?? "#64748b"}`,
          background: theme.nodeBg,
          borderRadius: 10,
          color: theme.nodeText,
          width: 240,
          padding: 10,
          boxShadow: isFocusedNode
            ? "0 0 0 2px rgba(245, 158, 11, 0.3), 0 14px 34px rgba(245, 158, 11, 0.22)"
            : isPathNode
              ? "0 0 0 2px rgba(34, 211, 238, 0.22), 0 12px 30px rgba(6, 182, 212, 0.25)"
              : "0 6px 24px rgba(2, 6, 23, 0.45)",
          cursor: "pointer",
          opacity: muted ? 0.45 : 1,
          transition: isNodeDragging
            ? "none"
            : "opacity 380ms ease-out, box-shadow 220ms ease-out, border-color 220ms ease-out",
          animation: isNodeDragging
            ? "none"
            : `rawblockNodeFadeIn 380ms ease-out ${shouldStagger ? Math.min(index * 12, 180) : 0}ms both`,
        },
      };
    });

    const flowEdges: FlowEdge[] = activeEdges.map((edge, i) => {
      const isPathEdge = canonicalStepPairs.has(`${edge.from}->${edge.to}`);
      const muted = !threatMode && !isPathEdge;

      return {
        id: `${edge.type}-${edge.from}-${edge.to}-${i}`,
        source: edge.from,
        target: edge.to,
        label: edge.type,
        style: {
          stroke: isPathEdge ? "#22d3ee" : theme.edgeDefault,
          strokeWidth: isPathEdge ? 2.6 : 1.2,
          opacity: muted ? 0.22 : 0.9,
          transition: "opacity 420ms ease-out, stroke 220ms ease-out",
          animation: `rawblockEdgeFadeIn 420ms ease-out ${Math.min(i * 4, 140)}ms both`,
        },
        labelStyle: {
          fill: isPathEdge ? "#0891b2" : theme.textSubtle,
          fontSize: isPathEdge ? 11 : 10,
        },
        animated:
          !isNodeDragging &&
          (isPathEdge ||
            edge.type === "STRENGTHENS" ||
            edge.type === "WEAKENS" ||
            edge.type === "EXPLOITS"),
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [
    canonicalNodeSet,
    canonicalStepPairs,
    showFullGraph,
    effectiveFocusMode,
    effectiveFocusedNodeId,
    showOnlyVulnerabilities,
    showOnlyAttackEdges,
    showOnlyAssumptions,
    threatMode,
    isNodeDragging,
    theme.edgeDefault,
    theme.nodeBg,
    theme.nodeChipBg,
    theme.nodeChipBorder,
    theme.nodeMeta,
    theme.nodeText,
    theme.textSubtle,
    searchQuery,
  ]);
  const graphFitVersion = useMemo(
    () =>
      [
        showFullGraph,
        effectiveFocusMode,
        effectiveFocusedNodeId ?? "none",
        showOnlyVulnerabilities,
        showOnlyAttackEdges,
        showOnlyAssumptions,
        nodes.length,
        edges.length,
      ].join("|"),
    [
      showFullGraph,
      effectiveFocusMode,
      effectiveFocusedNodeId,
      showOnlyVulnerabilities,
      showOnlyAttackEdges,
      showOnlyAssumptions,
      nodes.length,
      edges.length,
    ],
  );
  const hasSearchMiss = searchQuery.trim().length > 0 && nodes.length === 0;

  const selectedOutgoing = useMemo(() => {
    if (!selectedNodeId) return [];
    return graphStore.getOutgoingEdges(selectedNodeId).slice(0, 8);
  }, [selectedNodeId]);

  const selectedIncoming = useMemo(() => {
    if (!selectedNodeId) return [];
    return graphStore.getIncomingEdges(selectedNodeId).slice(0, 8);
  }, [selectedNodeId]);

  const selectedNodeConfidence = selectedNode ? getNodeConfidence(selectedNode) : null;
  const selectedNodeConfidenceStyle = selectedNodeConfidence
    ? CONFIDENCE_STYLES[selectedNodeConfidence]
    : null;

  return (
    <main
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ background: theme.pageBg, color: theme.textPrimary }}
    >
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Knowledge Graph</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Protocol Knowledge Graph</h1>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            {isMobileViewport && mobileViewMode === "story"
              ? "Mobile Story mode is active. Step through the canonical path before exploring the full graph."
              : effectiveFocusMode
              ? "Focus Mode is active. Click a node to isolate it with direct prerequisites and dependents."
              : "Click any node to inspect concept context, relations, and confidence before navigating to Academy."}
          </p>
          {!threatMode ? (
            <p className="text-xs text-cyan-300">
              Highlighting canonical path: {canonicalPath.title} ({canonicalPath.orderedNodes.length} steps)
            </p>
          ) : null}
          {effectiveFocusMode && effectiveFocusedNodeId ? (
            <p className="text-xs text-amber-300">
              Focused concept: {graphStore.getNode(effectiveFocusedNodeId)?.title ?? effectiveFocusedNodeId}
            </p>
          ) : null}
        </header>

        <details className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs md:hidden">
          <summary className="cursor-pointer list-none text-slate-300">
            Options & Legend
          </summary>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {TYPE_ORDER.map((type) => (
              <span
                key={type}
                className="rounded-full border px-2 py-1 uppercase tracking-wide"
                style={{ borderColor: TYPE_COLORS[type], color: TYPE_COLORS[type] }}
              >
                {NODE_TYPE_PRESENTATION[type].icon} {NODE_TYPE_PRESENTATION[type].label}
              </span>
            ))}
            <span
              className="rounded-full border px-2 py-1"
              style={{ borderColor: theme.sectionBorder, color: theme.textMuted }}
            >
              Difficulty: 1 easy → 4 advanced
            </span>
          </div>
        </details>

        <div className="hidden flex-wrap gap-2 text-xs md:flex">
          {TYPE_ORDER.map((type) => (
            <span
              key={type}
              className="rounded-full border px-2 py-1 uppercase tracking-wide"
              style={{ borderColor: TYPE_COLORS[type], color: TYPE_COLORS[type] }}
            >
              {NODE_TYPE_PRESENTATION[type].icon} {NODE_TYPE_PRESENTATION[type].label}
            </span>
          ))}
          <span
            className="ml-2 rounded-full border px-2 py-1"
            style={{ borderColor: theme.sectionBorder, color: theme.textMuted }}
          >
            Difficulty: 1 easy → 4 advanced
          </span>
        </div>

        {isMobileViewport ? (
          <div className="grid grid-cols-2 gap-2 rounded-xl border p-2" style={{ borderColor: theme.sectionBorder, background: theme.sectionBg }}>
            <button
              type="button"
              onClick={() => setMobileViewMode("story")}
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                mobileViewMode === "story"
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                  : "border-slate-700 bg-slate-950/70 text-slate-300"
              }`}
            >
              Story
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode("graph")}
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                mobileViewMode === "graph"
                  ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
                  : "border-slate-700 bg-slate-950/70 text-slate-300"
              }`}
            >
              Graph
            </button>
          </div>
        ) : null}

	        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className="space-y-4 rounded-xl p-4 text-sm xl:sticky xl:top-24 xl:self-start"
            style={{ border: `1px solid ${theme.sectionBorder}`, background: theme.sectionBg }}
          >
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>
                Search
              </h2>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title, id, or type..."
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: theme.sectionBorder,
                  background: theme.sectionBg,
                  color: theme.textPrimary,
                }}
              />
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>
                View Mode
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFullGraph(false);
                    setFocusMode(true);
                    setFocusedNodeId(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    !showFullGraph
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                      : "border-slate-700 bg-slate-950/70 text-slate-300"
                  }`}
                >
                  Focused
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFullGraph(true);
                    setFocusMode(false);
                    setFocusedNodeId(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    showFullGraph
                      ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
                      : "border-slate-700 bg-slate-950/70 text-slate-300"
                  }`}
                >
                  Full
                </button>
              </div>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {!showFullGraph
                  ? "Focused view highlights learning-path context and node isolation."
                  : "Full view renders all mapped concepts and relations."}
              </p>
              {isMobileViewport ? (
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
                    Mobile Focus Node
                  </span>
                  <select
                    value={effectiveFocusedNodeId ?? ""}
                    onChange={(event) => setFocusedNodeId(event.target.value || null)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: theme.sectionBorder,
                      background: theme.sectionBg,
                      color: theme.textPrimary,
                    }}
                  >
                    {mobileSourceNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {NODE_TYPE_PRESENTATION[node.type].icon} {node.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>
                Filters
              </h2>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={showOnlyVulnerabilities}
                  disabled={!showFullGraph}
                  onChange={(event) => setShowOnlyVulnerabilities(event.target.checked)}
                />
                Vulnerabilities
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={showOnlyAttackEdges}
                  disabled={!showFullGraph}
                  onChange={(event) => setShowOnlyAttackEdges(event.target.checked)}
                />
                Attacks
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={showOnlyAssumptions}
                  disabled={!showFullGraph}
                  onChange={(event) => setShowOnlyAssumptions(event.target.checked)}
                />
                Assumptions
              </label>
              {!showFullGraph ? (
                <p className="text-[11px]" style={{ color: theme.textMuted }}>
                  Switch to Full view to apply security-only filters.
                </p>
              ) : null}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>
                Relation Legend
              </h2>
              <ul className="max-h-56 space-y-1 overflow-auto pr-1 text-[11px]">
                {RELATION_LEGEND.map((item) => (
                  <li key={item.type} className="rounded-md border border-slate-800 bg-slate-950/50 px-2 py-1">
                    <p className="font-mono text-[10px] text-cyan-300">{item.type}</p>
                    <p style={{ color: theme.textMuted }}>{item.meaning}</p>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

	          <div className="space-y-4">
	            {isMobileViewport && mobileViewMode === "story" ? (
	              <section
	                className="rounded-xl p-4"
	                style={{ border: `1px solid ${theme.sectionBorder}`, background: theme.sectionBg }}
	              >
	                {mobileStoryNode ? (
	                  <div className="space-y-3">
	                    <div className="flex items-center justify-between gap-2 text-xs" style={{ color: theme.textMuted }}>
	                      <span>Step {activeMobileStoryIndex + 1} / {canonicalPath.orderedNodes.length}</span>
	                      <span>{NODE_TYPE_PRESENTATION[mobileStoryNode.type].icon} {NODE_TYPE_PRESENTATION[mobileStoryNode.type].label}</span>
	                    </div>
	                    <h3 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>
	                      {mobileStoryNode.title}
	                    </h3>
	                    <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
	                      {mobileStoryNode.summary}
	                    </p>
	                    <div className="flex gap-2">
	                      <button
	                        type="button"
	                        onClick={() => setMobileStoryIndex((prev) => Math.max(0, prev - 1))}
	                        disabled={activeMobileStoryIndex === 0}
	                        className="rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
	                        style={{ borderColor: theme.sectionBorder, color: theme.textPrimary }}
	                      >
	                        Previous
	                      </button>
	                      <button
	                        type="button"
	                        onClick={() =>
	                          setMobileStoryIndex((prev) => Math.min(canonicalPath.orderedNodes.length - 1, prev + 1))
	                        }
	                        disabled={activeMobileStoryIndex >= canonicalPath.orderedNodes.length - 1}
	                        className="rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
	                        style={{ borderColor: theme.sectionBorder, color: theme.textPrimary }}
	                      >
	                        Next
	                      </button>
	                      <button
	                        type="button"
	                        onClick={() => {
	                          setSelectedNodeId(mobileStoryNode.id);
	                          setFocusedNodeId(mobileStoryNode.id);
	                          setMobileViewMode("graph");
	                        }}
	                        className="ml-auto rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
	                      >
	                        Open on Graph
	                      </button>
	                    </div>
	                  </div>
	                ) : (
	                  <p className="text-sm" style={{ color: theme.textMuted }}>
	                    No story steps available for the current mode.
	                  </p>
	                )}
	              </section>
	            ) : (
	              <div
	                ref={graphContainerRef}
	                className="relative h-[70vh] md:h-[78vh] overflow-hidden rounded-xl"
	                style={{ border: `1px solid ${theme.sectionBorder}`, background: theme.sectionBg }}
	                onWheel={handleCanvasWheel}
	              >
	                <ReactFlow
	                  nodes={nodes}
	                  edges={edges}
	                  minZoom={MIN_GRAPH_ZOOM}
	                  maxZoom={MAX_GRAPH_ZOOM}
	                  zoomOnPinch
	                  zoomOnScroll
	                  panOnScroll={false}
	                  zoomOnDoubleClick={false}
	                  preventScrolling
	                  onMove={handleViewportChange}
	                  onNodeClick={(_, node) => {
	                    setSelectedNodeId(node.id);
	                    if (effectiveFocusMode) {
	                      setFocusedNodeId(node.id);
	                      return;
	                    }
	                  }}
	                  onPaneClick={() => {
	                    if (effectiveFocusMode) {
	                      setFocusedNodeId(null);
	                    }
	                    setHoveredNodeId(null);
	                  }}
	                  onNodeMouseEnter={(event, node) => {
	                    setHoveredNodeId(node.id);
	                    setTooltipPosition({ x: event.clientX, y: event.clientY });
	                  }}
	                  onNodeMouseMove={(event, node) => {
	                    if (hoveredNodeId !== node.id) {
	                      setHoveredNodeId(node.id);
	                    }
	                    setTooltipPosition({ x: event.clientX, y: event.clientY });
	                  }}
	                  onNodeMouseLeave={() => {
	                    setHoveredNodeId(null);
	                  }}
	                  onNodeDragStart={() => {
	                    setIsNodeDragging(true);
	                    setHoveredNodeId(null);
	                  }}
	                  onNodeDragStop={() => {
	                    window.setTimeout(() => {
	                      setIsNodeDragging(false);
	                    }, 110);
	                  }}
	                  nodesDraggable
	                  attributionPosition="bottom-left"
	                >
	                  <GraphFitController
	                    containerRef={graphContainerRef}
	                    fitVersion={graphFitVersion}
	                    suspendAutoFit={isNodeDragging}
	                    allowAutoFit
	                  />
	                  <GraphZoomPanel
	                    zoomLevel={zoomLevel}
	                    onZoomLabelChange={handleZoomLabelChange}
	                    theme={theme}
	                  />
	                  <MiniMap
	                    nodeStrokeWidth={2}
	                    nodeColor={(node) => {
	                      const raw = graphStore.getNode(node.id);
	                      if (!raw) return "#64748b";
	                      if (!threatMode && canonicalNodeSet.has(raw.id)) return "#22d3ee";
	                      return TYPE_COLORS[raw.type] ?? "#64748b";
	                    }}
	                    maskColor={theme.minimapMask}
	                  />
	                  <Background gap={20} size={1} color="#1e293b" />
	                </ReactFlow>
	                {hasSearchMiss ? (
	                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 p-4">
	                    <div className="pointer-events-auto max-w-md rounded-xl border border-slate-700 bg-slate-950/90 p-4 text-center">
	                      <p className="text-sm font-semibold text-slate-100">No graph matches for {searchQuery.trim()}</p>
	                      <p className="mt-1 text-xs text-slate-300">
	                        Try a broader term like segwit, utxo, policy, or clear the search.
	                      </p>
	                      <button
	                        type="button"
	                        onClick={() => setSearchQuery("")}
	                        className="mt-3 rounded-md border border-cyan-500/50 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200"
	                      >
	                        Clear Search
	                      </button>
	                    </div>
	                  </div>
	                ) : null}
	                {hoveredNode ? (
	                  <div
	                    className="pointer-events-none fixed z-50 max-w-xs rounded-lg border p-3 shadow-2xl"
	                    style={{
	                      left: tooltipPosition.x + 14,
	                      top: tooltipPosition.y + 14,
	                      borderColor: theme.tooltipBorder,
	                      background: theme.tooltipBg,
	                    }}
	                  >
	                    <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
	                      {hoveredNode.title}
	                    </p>
	                    <p className="mt-1 text-[11px]" style={{ color: theme.textSubtle }}>
	                      {NODE_TYPE_PRESENTATION[hoveredNode.type].label} · difficulty {hoveredNode.difficulty}/4
	                    </p>
	                    <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textMuted }}>
	                      {hoveredNode.summary}
	                    </p>
	                  </div>
	                ) : null}
	              </div>
	            )}

	            {selectedNode ? (
	              <section
	                className="space-y-3 rounded-xl p-4"
	                style={{ border: `1px solid ${theme.sectionBorder}`, background: theme.sectionBg }}
	              >
	                <div className="flex flex-wrap items-center gap-2">
	                  <h3 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
	                    {NODE_TYPE_PRESENTATION[selectedNode.type].icon} {selectedNode.title}
	                  </h3>
	                  {selectedNodeConfidence && selectedNodeConfidenceStyle ? (
	                    <span
	                      className="inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
	                      style={{
	                        borderColor: selectedNodeConfidenceStyle.border,
	                        background: selectedNodeConfidenceStyle.bg,
	                        color: selectedNodeConfidenceStyle.text,
	                      }}
	                    >
	                      {selectedNodeConfidence}
	                    </span>
	                  ) : null}
	                  <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide" style={{ borderColor: theme.sectionBorder, color: theme.textMuted }}>
	                    {NODE_TYPE_PRESENTATION[selectedNode.type].label}
	                  </span>
	                </div>
	                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
	                  {selectedNode.summary}
	                </p>
	                <div className="grid gap-3 md:grid-cols-2">
	                  <div className="space-y-1">
	                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.textMuted }}>
	                      Outgoing Relations
	                    </p>
	                    {selectedOutgoing.length === 0 ? (
	                      <p className="text-xs" style={{ color: theme.textSubtle }}>No outgoing relations.</p>
	                    ) : (
	                      <ul className="space-y-1 text-xs">
	                        {selectedOutgoing.map((edge, idx) => {
	                          const target = graphStore.getNode(edge.to);
	                          const edgeConfidence = getEdgeConfidence(edge.type);
	                          const edgeStyle = CONFIDENCE_STYLES[edgeConfidence];
	                          return (
	                            <li key={`${edge.type}-${edge.to}-${idx}`} className="rounded-md border px-2 py-1" style={{ borderColor: theme.sectionBorder }}>
	                              <p style={{ color: theme.textPrimary }}>
	                                {edge.type} → {target?.title ?? edge.to}
	                              </p>
	                              <span className="mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide" style={{ borderColor: edgeStyle.border, background: edgeStyle.bg, color: edgeStyle.text }}>
	                                {edgeConfidence}
	                              </span>
	                            </li>
	                          );
	                        })}
	                      </ul>
	                    )}
	                  </div>
	                  <div className="space-y-1">
	                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.textMuted }}>
	                      Incoming Relations
	                    </p>
	                    {selectedIncoming.length === 0 ? (
	                      <p className="text-xs" style={{ color: theme.textSubtle }}>No incoming relations.</p>
	                    ) : (
	                      <ul className="space-y-1 text-xs">
	                        {selectedIncoming.map((edge, idx) => {
	                          const source = graphStore.getNode(edge.from);
	                          const edgeConfidence = getEdgeConfidence(edge.type);
	                          const edgeStyle = CONFIDENCE_STYLES[edgeConfidence];
	                          return (
	                            <li key={`${edge.type}-${edge.from}-${idx}`} className="rounded-md border px-2 py-1" style={{ borderColor: theme.sectionBorder }}>
	                              <p style={{ color: theme.textPrimary }}>
	                                {source?.title ?? edge.from} → {edge.type}
	                              </p>
	                              <span className="mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide" style={{ borderColor: edgeStyle.border, background: edgeStyle.bg, color: edgeStyle.text }}>
	                                {edgeConfidence}
	                              </span>
	                            </li>
	                          );
	                        })}
	                      </ul>
	                    )}
	                  </div>
	                </div>
	                <div className="flex justify-end">
	                  <button
	                    type="button"
	                    onClick={() => router.push(`/academy/${selectedNode.id}`)}
	                    className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
	                  >
	                    Open Academy Page
	                  </button>
	                </div>
	              </section>
	            ) : null}
	          </div>
	        </div>
	      </div>
      <style jsx global>{`
        @keyframes rawblockNodeFadeIn {
          0% {
            opacity: 0.05;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes rawblockEdgeFadeIn {
          0% {
            opacity: 0.01;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
