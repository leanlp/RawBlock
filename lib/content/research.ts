import vulnerabilitiesSeed from "@/content/research/vulnerabilities.json";
import attacksSeed from "@/content/research/attacks.json";
import assumptionsSeed from "@/content/research/assumptions.json";
import policyConsensusSeed from "@/content/research/policy-vs-consensus.json";

import vulnerabilitiesSeedEs from "@/content/research/vulnerabilities.es.json";
import attacksSeedEs from "@/content/research/attacks.es.json";
import assumptionsSeedEs from "@/content/research/assumptions.es.json";
import policyConsensusSeedEs from "@/content/research/policy-vs-consensus.es.json";

import { type Locale } from "@/lib/i18n";

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

const vulnerabilitiesEn = researchVulnerabilityListSchema.parse(vulnerabilitiesSeed);
const attacksEn = researchAttackListSchema.parse(attacksSeed);
const assumptionsEn = researchAssumptionListSchema.parse(assumptionsSeed);
const policyVsConsensusEn = researchPolicyConsensusListSchema.parse(policyConsensusSeed);

const vulnerabilitiesEs = researchVulnerabilityListSchema.parse(vulnerabilitiesSeedEs);
const attacksEs = researchAttackListSchema.parse(attacksSeedEs);
const assumptionsEs = researchAssumptionListSchema.parse(assumptionsSeedEs);
const policyVsConsensusEs = researchPolicyConsensusListSchema.parse(policyConsensusSeedEs);

export function getResearchVulnerabilities(locale: Locale): ResearchVulnerability[] {
  return locale === "es" ? vulnerabilitiesEs : vulnerabilitiesEn;
}

export function getResearchAttacks(locale: Locale): ResearchAttack[] {
  return locale === "es" ? attacksEs : attacksEn;
}

export function getResearchAssumptions(locale: Locale): ResearchAssumption[] {
  return locale === "es" ? assumptionsEs : assumptionsEn;
}

export function getResearchPolicyVsConsensus(locale: Locale): ResearchPolicyConsensus[] {
  return locale === "es" ? policyVsConsensusEs : policyVsConsensusEn;
}

export function getResearchVulnerabilitiesForNode(nodeId: string, locale: Locale): ResearchVulnerability[] {
  return getResearchVulnerabilities(locale).filter((item) => item.linkedNodeIds.includes(nodeId));
}

export function getResearchAttacksForNode(nodeId: string, locale: Locale): ResearchAttack[] {
  return getResearchAttacks(locale).filter((item) => item.linkedNodeIds.includes(nodeId));
}

export function getResearchAssumptionsForNode(nodeId: string, locale: Locale): ResearchAssumption[] {
  return getResearchAssumptions(locale).filter((item) => item.linkedNodeIds.includes(nodeId));
}

export function getResearchPolicyVsConsensusForNode(nodeId: string, locale: Locale): ResearchPolicyConsensus[] {
  return getResearchPolicyVsConsensus(locale).filter((item) => item.linkedNodeIds.includes(nodeId));
}
