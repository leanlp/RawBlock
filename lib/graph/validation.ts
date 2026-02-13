import { securityAssumptions } from "@/data/security/assumptions";
import { attackModels } from "@/data/security/attack-models";
import { vulnerabilities } from "@/data/security/vulnerabilities";
import type { Edge, GraphNode, Vulnerability } from "@/lib/graph/types";

const vulnerabilityRelationshipEdgeTypes = new Set<Edge["type"]>([
  "EXPLOITS",
  "WEAKENS",
  "STRENGTHENS",
  "MITIGATED_BY",
]);

export function verifyUniqueNodeIds(nodes: GraphNode[]): void {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const node of nodes) {
    if (seen.has(node.id)) {
      duplicates.push(node.id);
      continue;
    }
    seen.add(node.id);
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate graph node ids detected: ${duplicates.join(", ")}`,
    );
  }
}

export function verifyEdgeReferencesCanonicalNodes(
  nodes: GraphNode[],
  edges: Edge[],
): void {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const missingRefs: string[] = [];

  for (const edge of edges) {
    if (!nodeIds.has(edge.from)) {
      missingRefs.push(`missing source "${edge.from}"`);
    }
    if (!nodeIds.has(edge.to)) {
      missingRefs.push(`missing target "${edge.to}"`);
    }
  }

  if (missingRefs.length > 0) {
    throw new Error(
      `Edge canonical reference violation: ${missingRefs.join(", ")}`,
    );
  }
}

export function verifyAssumptionNodeParity(nodes: GraphNode[]): void {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const missingAssumptionNodeIds = securityAssumptions
    .map((assumption) => assumption.id)
    .filter((assumptionId) => !nodeIds.has(assumptionId));

  if (missingAssumptionNodeIds.length > 0) {
    throw new Error(
      `Assumption/node parity violation: missing GraphNode entries for assumption ids: ${missingAssumptionNodeIds.join(", ")}`,
    );
  }
}

export function verifyAttackModelNodeParity(nodes: GraphNode[]): void {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const parityIssues: string[] = [];

  for (const model of attackModels) {
    const node = nodeById.get(model.id);
    if (!node) {
      parityIssues.push(`missing GraphNode for attack model id "${model.id}"`);
      continue;
    }
    if (node.type !== "attack") {
      parityIssues.push(
        `attack model "${model.id}" must map to GraphNode type "attack" (found "${node.type}")`,
      );
    }
  }

  if (parityIssues.length > 0) {
    throw new Error(`Attack model/node parity violation: ${parityIssues.join(", ")}`);
  }
}

export function verifyAttackModelReferencesCanonicalNodes(
  nodes: GraphNode[],
): void {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const missingReferences: string[] = [];

  for (const model of attackModels) {
    for (const nodeId of [...model.exploitsNodes, ...model.mitigatedBy]) {
      if (!nodeIds.has(nodeId)) {
        missingReferences.push(`${model.id} -> ${nodeId}`);
      }
    }
  }

  if (missingReferences.length > 0) {
    throw new Error(
      `Attack model reference violation: non-canonical node references: ${missingReferences.join(", ")}`,
    );
  }
}

export function verifyVulnerabilityEdgeParity(
  edges: Edge[],
  registry: Vulnerability[] = vulnerabilities,
): void {
  const missingRelationships: string[] = [];

  for (const vulnerability of registry) {
    for (const relatedNodeId of vulnerability.relatedNodes) {
      const hasRelationshipEdge = edges.some(
        (edge) =>
          edge.from === vulnerability.id &&
          edge.to === relatedNodeId &&
          vulnerabilityRelationshipEdgeTypes.has(edge.type),
      );

      if (!hasRelationshipEdge) {
        missingRelationships.push(`${vulnerability.id} -> ${relatedNodeId}`);
      }
    }
  }

  if (missingRelationships.length > 0) {
    throw new Error(
      `Vulnerability edge parity violation: missing explicit edges for relatedNodes: ${missingRelationships.join(", ")}`,
    );
  }
}

export function verifyNoDirectTransactionUtxoLegacyEdges(edges: Edge[]): void {
  const invalid = edges.filter(
    (edge) =>
      (edge.from === "transaction" && edge.to === "utxo") ||
      (edge.from === "utxo" && edge.to === "transaction"),
  );

  if (invalid.length > 0) {
    const details = invalid
      .map((edge) => `${edge.from} -[${edge.type}]-> ${edge.to}`)
      .join(", ");
    throw new Error(
      `Transaction/UTXO relation violation: direct edges are not allowed (${details}). Model via transaction -> output (CREATES), utxo -> output (IS_UNSPENT_FORM_OF), and input -> utxo (SPENDS).`,
    );
  }
}

export function verifyGraphIntegrity(nodes: GraphNode[], edges: Edge[]): void {
  verifyUniqueNodeIds(nodes);
  verifyAssumptionNodeParity(nodes);
  verifyAttackModelNodeParity(nodes);
  verifyAttackModelReferencesCanonicalNodes(nodes);
  verifyEdgeReferencesCanonicalNodes(nodes, edges);
  verifyVulnerabilityEdgeParity(edges);
  verifyNoDirectTransactionUtxoLegacyEdges(edges);
}
