"use client";

import { useMemo } from "react";
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

const TYPE_ORDER = [
  "primitive",
  "rule",
  "mechanism",
  "upgrade",
  "attack",
  "property",
] as const;

const TYPE_COLORS: Record<(typeof TYPE_ORDER)[number], string> = {
  primitive: "#06b6d4",
  rule: "#22c55e",
  mechanism: "#3b82f6",
  upgrade: "#a855f7",
  attack: "#ef4444",
  property: "#f59e0b",
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

  const { nodes, edges } = useMemo(() => {
    const rowByType = new Map<string, number>();

    const flowNodes: FlowNode[] = graphStore.nodes.map((node) => {
      const row = rowByType.get(node.type) ?? 0;
      rowByType.set(node.type, row + 1);
      const position = lanePosition(node.type, row);

      return {
        id: node.id,
        position,
        data: {
          label: (
            <div className="space-y-1">
              <div className="font-semibold text-slate-100">{node.title}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                {node.type} · d{node.difficulty}
              </div>
            </div>
          ),
        },
        style: {
          border: `1px solid ${TYPE_COLORS[node.type] ?? "#64748b"}`,
          background: "#020617",
          borderRadius: 10,
          color: "#e2e8f0",
          width: 240,
          padding: 10,
          boxShadow: "0 6px 24px rgba(2, 6, 23, 0.45)",
          cursor: "pointer",
        },
      };
    });

    const flowEdges: FlowEdge[] = graphStore.edges.map((edge, i) => ({
      id: `${edge.type}-${edge.from}-${edge.to}-${i}`,
      source: edge.from,
      target: edge.to,
      label: edge.type,
      style: { stroke: "#475569", strokeWidth: 1.2 },
      labelStyle: { fill: "#94a3b8", fontSize: 10 },
      animated: edge.type === "STRENGTHENS" || edge.type === "WEAKENS",
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Bitcoin Map</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Protocol Knowledge Graph</h1>
          <p className="text-sm text-slate-400">
            Click any node to open its Academy page. Graph is rendered directly from structured node and edge data.
          </p>
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
        </div>

        <div className="h-[78vh] rounded-xl border border-slate-800 bg-slate-900/40">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onNodeClick={(_, node) => router.push(`/academy/${node.id}`)}
            nodesDraggable
            panOnScroll
            attributionPosition="bottom-left"
          >
            <MiniMap
              nodeStrokeWidth={2}
              nodeColor={(node) => {
                const raw = graphStore.getNode(node.id);
                return raw ? TYPE_COLORS[raw.type] ?? "#64748b" : "#64748b";
              }}
              maskColor="rgba(2,6,23,0.65)"
            />
            <Controls />
            <Background gap={20} size={1} color="#1e293b" />
          </ReactFlow>
        </div>
      </div>
    </main>
  );
}
