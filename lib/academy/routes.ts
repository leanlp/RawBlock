import { plannedAcademyNodeIds } from "@/lib/content/plannedAcademyNodes";
import { graphStore } from "@/lib/graph/store";

const ROUTABLE_ACADEMY_NODE_IDS = new Set(graphStore.nodes.map((node) => node.id));

function humanizeNodeId(nodeId: string): string {
  return nodeId
    .split("-")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function isAcademyNodeRoutable(nodeId: string): boolean {
  return ROUTABLE_ACADEMY_NODE_IDS.has(nodeId);
}

export function isAcademyNodePlanned(nodeId: string): boolean {
  return plannedAcademyNodeIds.has(nodeId);
}

export function getAcademyNodeLabel(nodeId: string): string {
  return graphStore.getNode(nodeId)?.title ?? humanizeNodeId(nodeId);
}

export function getAcademyNodeHref(nodeId: string): string | null {
  return isAcademyNodeRoutable(nodeId) ? `/academy/${nodeId}` : null;
}

export function getRoutableAcademyNodeIds(): Set<string> {
  return new Set(ROUTABLE_ACADEMY_NODE_IDS);
}

