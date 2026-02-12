import vulnerabilitiesSeed from "@/content/research/vulnerabilities.json";
import attacksSeed from "@/content/research/attacks.json";
import assumptionsSeed from "@/content/research/assumptions.json";
import policyConsensusSeed from "@/content/research/policy-vs-consensus.json";
import {
  researchAttackListSchema,
  researchAssumptionListSchema,
  researchPolicyConsensusListSchema,
  researchVulnerabilityListSchema,
  type ResearchAttack,
  type ResearchAssumption,
  type ResearchPolicyConsensus,
  type ResearchVulnerability,
} from "@/lib/content/schema";

const vulnerabilities = researchVulnerabilityListSchema.parse(vulnerabilitiesSeed);
const attacks = researchAttackListSchema.parse(attacksSeed);
const assumptions = researchAssumptionListSchema.parse(assumptionsSeed);
const policyVsConsensus = researchPolicyConsensusListSchema.parse(policyConsensusSeed);

export function getResearchVulnerabilities(): ResearchVulnerability[] {
  return vulnerabilities;
}

export function getResearchAttacks(): ResearchAttack[] {
  return attacks;
}

export function getResearchAssumptions(): ResearchAssumption[] {
  return assumptions;
}

export function getResearchPolicyVsConsensus(): ResearchPolicyConsensus[] {
  return policyVsConsensus;
}

export function getResearchVulnerabilitiesForNode(nodeId: string): ResearchVulnerability[] {
  return vulnerabilities.filter((item) => item.linkedNodeIds.includes(nodeId));
}

export function getResearchAttacksForNode(nodeId: string): ResearchAttack[] {
  return attacks.filter((item) => item.linkedNodeIds.includes(nodeId));
}

export function getResearchAssumptionsForNode(nodeId: string): ResearchAssumption[] {
  return assumptions.filter((item) => item.linkedNodeIds.includes(nodeId));
}

export function getResearchPolicyVsConsensusForNode(nodeId: string): ResearchPolicyConsensus[] {
  return policyVsConsensus.filter((item) => item.linkedNodeIds.includes(nodeId));
}
