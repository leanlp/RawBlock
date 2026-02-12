"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge as FlowEdge,
  type Node as FlowNode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { graphStore } from "@/lib/graph/store";
import { getCanonicalPath } from "@/lib/graph/pathEngine";

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

const DIFFICULTY_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#f59e0b",
  4: "#ef4444",
};

function lanePosition(type: string, row: number): { x: number; y: number } {
  const lane = Math.max(0, TYPE_ORDER.indexOf(type as (typeof TYPE_ORDER)[number]));
  return {
    x: lane * 290,
    y: row * 110,
  };
}

export default function BitcoinMapPage() {
  const router = useRouter();
  const [showFullGraph, setShowFullGraph] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showOnlyVulnerabilities, setShowOnlyVulnerabilities] = useState(false);
  const [showOnlyAttackEdges, setShowOnlyAttackEdges] = useState(false);
  const [showOnlyAssumptions, setShowOnlyAssumptions] = useState(false);
  const threatMode =
    showFullGraph &&
    (showOnlyVulnerabilities || showOnlyAttackEdges || showOnlyAssumptions);
  const canonicalPath = getCanonicalPath();
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

  const { nodes, edges } = useMemo(() => {
    const attackEdgeTypes = new Set(["EXPLOITS", "MITIGATED_BY"]);
    const rowByType = new Map<string, number>();
    const canonicalPathEdgeSet = new Set(
      Array.from(canonicalStepPairs).map((edge) => edge),
    );

    const sourceNodes = showFullGraph
      ? graphStore.nodes
      : graphStore.nodes.filter((node) => canonicalNodeSet.has(node.id));
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

    if (focusMode && focusedNodeId) {
      focusedNodeIds.add(focusedNodeId);
      visibleEdges.forEach((edge) => {
        if (edge.from === focusedNodeId || edge.to === focusedNodeId) {
          focusedNodeIds.add(edge.from);
          focusedNodeIds.add(edge.to);
        }
      });
    }

    const focusActive = focusMode && focusedNodeId !== null;
    const activeNodes = focusActive
      ? visibleNodes.filter((node) => focusedNodeIds.has(node.id))
      : visibleNodes;
    const activeEdges = focusActive
      ? visibleEdges.filter(
          (edge) =>
            focusedNodeIds.has(edge.from) &&
            focusedNodeIds.has(edge.to) &&
            (edge.from === focusedNodeId || edge.to === focusedNodeId),
        )
      : visibleEdges;

    const flowNodes: FlowNode[] = activeNodes.map((node) => {
      const row = rowByType.get(node.type) ?? 0;
      rowByType.set(node.type, row + 1);
      const position = lanePosition(node.type, row);

      const isPathNode = canonicalNodeSet.has(node.id);
      const isFocusedNode = focusActive && node.id === focusedNodeId;
      const muted = !threatMode && !isPathNode;

      return {
        id: node.id,
        position,
        data: {
          label: (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-100">{node.title}</div>
                <div
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700/90 bg-slate-900/80 px-1.5 py-0.5"
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
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                {node.type} · d{node.difficulty}
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
          background: "#020617",
          borderRadius: 10,
          color: "#e2e8f0",
          width: 240,
          padding: 10,
          boxShadow: isFocusedNode
            ? "0 0 0 2px rgba(245, 158, 11, 0.3), 0 14px 34px rgba(245, 158, 11, 0.22)"
            : isPathNode
              ? "0 0 0 2px rgba(34, 211, 238, 0.22), 0 12px 30px rgba(6, 182, 212, 0.25)"
              : "0 6px 24px rgba(2, 6, 23, 0.45)",
          cursor: "pointer",
          opacity: muted ? 0.45 : 1,
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
          stroke: isPathEdge ? "#22d3ee" : "#475569",
          strokeWidth: isPathEdge ? 2.6 : 1.2,
          opacity: muted ? 0.22 : 0.9,
        },
        labelStyle: {
          fill: isPathEdge ? "#67e8f9" : "#94a3b8",
          fontSize: isPathEdge ? 11 : 10,
        },
        animated:
          isPathEdge ||
          edge.type === "STRENGTHENS" ||
          edge.type === "WEAKENS" ||
          edge.type === "EXPLOITS",
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [
    canonicalNodeSet,
    canonicalStepPairs,
    showFullGraph,
    focusMode,
    focusedNodeId,
    showOnlyVulnerabilities,
    showOnlyAttackEdges,
    showOnlyAssumptions,
    threatMode,
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Bitcoin Map</p>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {threatMode ? "Bitcoin Threat Map" : "Protocol Knowledge Graph"}
          </h1>
          <p className="text-sm text-slate-400">
            {focusMode
              ? "Focus Mode is active. Click a node to isolate it with direct prerequisites and dependents."
              : "Click any node to open its Academy page. Graph is rendered directly from structured node and edge data."}
          </p>
          {!threatMode ? (
            <p className="text-xs text-cyan-300">
              Highlighting canonical path: {canonicalPath.title} ({canonicalPath.orderedNodes.length} steps)
            </p>
          ) : null}
          {focusMode && focusedNodeId ? (
            <p className="text-xs text-amber-300">
              Focused concept: {graphStore.getNode(focusedNodeId)?.title ?? focusedNodeId}
            </p>
          ) : null}
        </header>

        <div className="flex flex-wrap gap-2 text-xs">
          {TYPE_ORDER.map((type) => (
            <span
              key={type}
              className="rounded-full border px-2 py-1 uppercase tracking-wide"
              style={{ borderColor: TYPE_COLORS[type], color: TYPE_COLORS[type] }}
            >
              {type}
            </span>
          ))}
          <span className="ml-2 rounded-full border border-slate-700 px-2 py-1 text-slate-300">
            Difficulty: 1 easy → 4 advanced
          </span>
        </div>

        <section className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm md:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setShowFullGraph((prev) => !prev);
              setFocusedNodeId(null);
            }}
            className={`md:col-span-3 flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
              showFullGraph
                ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
                : "border-slate-700 bg-slate-950/70 text-slate-200"
            }`}
          >
            <span className="font-medium">
              Full Graph: {showFullGraph ? "On" : "Off"}{" "}
              {!showFullGraph ? "(Focused Learning View)" : "(Complete Concept Map)"}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${
                showFullGraph
                  ? "border-cyan-400/70 text-cyan-300"
                  : "border-slate-600 text-slate-400"
              }`}
            >
              {showFullGraph ? "Showing All Nodes" : "Showing Canonical Path"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFocusMode((prev) => !prev);
              setFocusedNodeId(null);
            }}
            className={`md:col-span-3 flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
              focusMode
                ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                : "border-slate-700 bg-slate-950/70 text-slate-200"
            }`}
          >
            <span className="font-medium">
              Focus Mode: {focusMode ? "On" : "Off"}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${
                focusMode
                  ? "border-amber-400/70 text-amber-300"
                  : "border-slate-600 text-slate-400"
              }`}
            >
              {focusMode
                ? focusedNodeId
                  ? "Node Isolated"
                  : "Select a Node"
                : "Navigation Enabled"}
            </span>
          </button>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlyVulnerabilities}
              disabled={!showFullGraph}
              onChange={(event) => setShowOnlyVulnerabilities(event.target.checked)}
            />
            Show only vulnerabilities
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlyAttackEdges}
              disabled={!showFullGraph}
              onChange={(event) => setShowOnlyAttackEdges(event.target.checked)}
            />
            Show only attack edges
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlyAssumptions}
              disabled={!showFullGraph}
              onChange={(event) => setShowOnlyAssumptions(event.target.checked)}
            />
            Show only security assumptions
          </label>
        </section>

        <div className="relative h-[78vh] rounded-xl border border-slate-800 bg-slate-900/40">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onNodeClick={(_, node) => {
              if (focusMode) {
                setFocusedNodeId(node.id);
                return;
              }
              router.push(`/academy/${node.id}`);
            }}
            onPaneClick={() => {
              if (focusMode) {
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
            nodesDraggable
            panOnScroll
            attributionPosition="bottom-left"
          >
            <MiniMap
              nodeStrokeWidth={2}
              nodeColor={(node) => {
                const raw = graphStore.getNode(node.id);
                if (!raw) return "#64748b";
                if (!threatMode && canonicalNodeSet.has(raw.id)) return "#22d3ee";
                return TYPE_COLORS[raw.type] ?? "#64748b";
              }}
              maskColor="rgba(2,6,23,0.65)"
            />
            <Controls />
            <Background gap={20} size={1} color="#1e293b" />
          </ReactFlow>
          {hoveredNode ? (
            <div
              className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-slate-700/80 bg-slate-950/95 p-3 shadow-2xl"
              style={{
                left: tooltipPosition.x + 14,
                top: tooltipPosition.y + 14,
              }}
            >
              <p className="text-sm font-semibold text-slate-100">{hoveredNode.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{hoveredNode.summary}</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
