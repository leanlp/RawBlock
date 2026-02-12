import { attackModels } from "@/data/security/attack-models";
import { graphStore } from "@/lib/graph/store";
import type { AttackModel, Edge, GraphNode } from "@/lib/graph/types";

export interface AttackTraversal {
  model: AttackModel;
  exploitedNodes: GraphNode[];
  mitigatedByNodes: GraphNode[];
  traversalEdges: Edge[];
}

function edgeForTraversal(from: string, to: string, type: Edge["type"]): Edge {
  return { from, to, type };
}

export function getAttackModels(): AttackModel[] {
  return attackModels;
}

export function getAttackModelById(id: string): AttackModel | undefined {
  return attackModels.find((model) => model.id === id);
}

export function getAttackModelsForNode(nodeId: string): AttackModel[] {
  return attackModels.filter(
    (model) =>
      model.exploitsNodes.includes(nodeId) || model.mitigatedBy.includes(nodeId),
  );
}

export function buildAttackTraversal(attackModelId: string): AttackTraversal | undefined {
  const model = getAttackModelById(attackModelId);
  if (!model) {
    return undefined;
  }

  const exploitedNodes = model.exploitsNodes
    .map((nodeId) => graphStore.getNode(nodeId))
    .filter((node): node is GraphNode => node !== undefined);

  const mitigatedByNodes = model.mitigatedBy
    .map((nodeId) => graphStore.getNode(nodeId))
    .filter((node): node is GraphNode => node !== undefined);

  const traversalEdges: Edge[] = [
    ...model.exploitsNodes.map((nodeId) => edgeForTraversal(model.id, nodeId, "EXPLOITS")),
    ...model.mitigatedBy.map((nodeId) => edgeForTraversal(model.id, nodeId, "MITIGATED_BY")),
  ];

  return {
    model,
    exploitedNodes,
    mitigatedByNodes,
    traversalEdges,
  };
}
