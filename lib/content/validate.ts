import { getRoutableAcademyNodeIds, isAcademyNodePlanned } from "@/lib/academy/routes";
import { getAllAcademyNodeContent } from "@/lib/content/academy";
import {
  getResearchAssumptions,
  getResearchAttacks,
  getResearchPolicyVsConsensus,
  getResearchVulnerabilities,
} from "@/lib/content/research";
import { graphStore } from "@/lib/graph/store";

function verifyEdgeRoutesResolvable(routableAcademyNodeIds: Set<string>) {
  const unresolvedEdges = graphStore.edges.filter(
    (edge) =>
      !routableAcademyNodeIds.has(edge.from) || !routableAcademyNodeIds.has(edge.to),
  );

  if (unresolvedEdges.length > 0) {
    const summary = unresolvedEdges
      .map((edge) => `${edge.from} -[${edge.type}]-> ${edge.to}`)
      .join(", ");
    throw new Error(
      `Academy route coverage violation: unresolved edge endpoints detected: ${summary}`,
    );
  }
}

function verifyResearchNodeReferencesResolvable(
  routableAcademyNodeIds: Set<string>,
  references: string[],
) {
  const unresolved = [...new Set(references)].filter(
    (nodeId) => !routableAcademyNodeIds.has(nodeId) && !isAcademyNodePlanned(nodeId),
  );

  if (unresolved.length > 0) {
    throw new Error(
      `Research node reference violation: unresolved academy node ids: ${unresolved.join(", ")}`,
    );
  }
}

export function validateContentSchemas() {
  // Accessors already parse via zod at module load.
  getAllAcademyNodeContent();
  const vulnerabilities = getResearchVulnerabilities();
  const attacks = getResearchAttacks();
  const assumptions = getResearchAssumptions();
  const policyVsConsensus = getResearchPolicyVsConsensus();

  const routableAcademyNodeIds = getRoutableAcademyNodeIds();
  verifyEdgeRoutesResolvable(routableAcademyNodeIds);
  verifyResearchNodeReferencesResolvable(routableAcademyNodeIds, [
    ...vulnerabilities.flatMap((item) => item.linkedNodeIds),
    ...attacks.flatMap((item) => item.linkedNodeIds),
    ...assumptions.flatMap((item) => item.linkedNodeIds),
    ...policyVsConsensus.flatMap((item) => item.linkedNodeIds),
  ]);
}
