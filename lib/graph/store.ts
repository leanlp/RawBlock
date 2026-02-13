import { graphEdges } from "@/data/graph/edges";
import { graphNodes } from "@/data/graph/nodes";
import { verifyGraphIntegrity } from "@/lib/graph/validation";
import type { Edge, GraphNode } from "@/lib/graph/types";

interface GraphIndexes {
  byId: Map<string, GraphNode>;
  outgoing: Map<string, Edge[]>;
  incoming: Map<string, Edge[]>;
}

export interface GraphStore {
  readonly nodes: GraphNode[];
  readonly edges: Edge[];
  getNode(id: string): GraphNode | undefined;
  hasNode(id: string): boolean;
  getOutgoingEdges(id: string): Edge[];
  getIncomingEdges(id: string): Edge[];
  getNeighbors(id: string): GraphNode[];
}

function indexGraph(nodes: GraphNode[], edges: Edge[]): GraphIndexes {
  const byId = new Map<string, GraphNode>();
  const outgoing = new Map<string, Edge[]>();
  const incoming = new Map<string, Edge[]>();

  for (const node of nodes) {
    byId.set(node.id, node);
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }

  for (const edge of edges) {
    outgoing.get(edge.from)?.push(edge);
    incoming.get(edge.to)?.push(edge);
  }

  return { byId, outgoing, incoming };
}

export function createGraphStore(
  nodes: GraphNode[] = graphNodes,
  edges: Edge[] = graphEdges,
): GraphStore {
  const graphNodesCopy = [...nodes];
  const graphEdgesCopy = [...edges];
  verifyGraphIntegrity(graphNodesCopy, graphEdgesCopy);
  const indexes = indexGraph(graphNodesCopy, graphEdgesCopy);

  return {
    nodes: graphNodesCopy,
    edges: graphEdgesCopy,
    getNode: (id: string) => indexes.byId.get(id),
    hasNode: (id: string) => indexes.byId.has(id),
    getOutgoingEdges: (id: string) => [...(indexes.outgoing.get(id) ?? [])],
    getIncomingEdges: (id: string) => [...(indexes.incoming.get(id) ?? [])],
    getNeighbors: (id: string) => {
      const neighborIds = new Set<string>();
      const outgoing = indexes.outgoing.get(id) ?? [];
      const incoming = indexes.incoming.get(id) ?? [];

      for (const edge of outgoing) {
        neighborIds.add(edge.to);
      }

      for (const edge of incoming) {
        neighborIds.add(edge.from);
      }

      return [...neighborIds]
        .map((neighborId) => indexes.byId.get(neighborId))
        .filter((node): node is GraphNode => Boolean(node));
    },
  };
}

export const graphStore = createGraphStore();
