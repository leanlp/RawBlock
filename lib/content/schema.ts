import { z } from "zod";

const nodeTypeSchema = z.enum([
  "primitive",
  "mechanism",
  "rule",
  "upgrade",
  "property",
  "attack",
  "vulnerability",
  "assumption",
]);

const canonicalLessonSchema = z.enum([
  "what-is-bitcoin",
  "transactions",
  "utxo-model",
  "blocks",
  "mining",
  "difficulty",
  "consensus",
  "security-and-attacks",
]);

const sourceTypeSchema = z.enum([
  "whitepaper",
  "BIP",
  "core-docs",
  "dev-guide",
  "mailing-list",
  "reference",
]);

const claimSourceRefSchema = z.object({
  title: z.string().min(3),
  url: z.string().url(),
  type: sourceTypeSchema,
});

const claimSourceSchema = z.object({
  claim: z.string().min(12),
  sources: z.array(claimSourceRefSchema).min(2).max(4),
});

const deepDiveSectionSchema = z.object({
  heading: z.string().min(3),
  bullets: z.array(z.string().min(10)).min(2),
});

const realDataDefinitionSchema = z.object({
  key: z.enum([
    "blockHeight",
    "feeFast",
    "feeHalfHour",
    "feeHour",
    "hashrateEh",
    "blocksUntilHalving",
    "daysUntilHalving",
    "lastUpdated",
  ]),
  label: z.string().min(3),
  description: z.string().min(10),
  display: z.string().min(3),
});

export const academyNodeContentSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(3),
  type: nodeTypeSchema,
  difficulty: z.number().int().min(1).max(4),
  canonicalLesson: canonicalLessonSchema,
  pathMappings: z.array(z.string().min(3)).min(1),
  summary: z.string().min(20).max(240),
  story: z.string().min(100).max(900),
  deepDive: z.array(deepDiveSectionSchema).min(2),
  keyTakeaways: z.array(z.string().min(8)).min(3).max(6),
  realData: z.array(realDataDefinitionSchema).min(2),
  securityNotes: z.array(z.string().min(8)).min(2),
  linkedVulnerabilities: z.array(z.string().min(3)),
  linkedAttacks: z.array(z.string().min(3)),
  linkedAssumptions: z.array(z.string().min(3)),
  policyRules: z.array(z.string().min(8)).min(1),
  consensusRules: z.array(z.string().min(8)).min(1),
  policyVsConsensusExplanation: z.string().min(20),
  caseStudies: z
    .array(
      z.object({
        title: z.string().min(5),
        year: z.number().int().min(2009).max(2100),
        summary: z.string().min(20),
      }),
    )
    .min(1),
  explorerDeepLinks: z
    .array(
      z.object({
        label: z.string().min(3),
        url: z.string().url(),
      }),
    )
    .min(1),
  claimSources: z.array(claimSourceSchema).min(2),
  furtherReading: z
    .array(
      z.object({
        title: z.string().min(3),
        url: z.string().url(),
      }),
    )
    .min(2),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const academyNodeContentListSchema = z.array(academyNodeContentSchema);

const sharedResearchSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(5),
  year: z.number().int().min(2009).max(2100),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.string().min(3),
  linkedNodeIds: z.array(z.string().min(3)).min(1),
  summary: z.string().min(20),
  sources: z.array(claimSourceRefSchema).min(1),
});

export const researchVulnerabilitySchema = sharedResearchSchema.extend({
  cve: z.string().optional(),
  affectedVersions: z.array(z.string().min(1)).min(1),
  impact: z.string().min(10),
  mitigation: z.string().min(10),
});

export const researchAttackSchema = sharedResearchSchema.extend({
  targetLayer: z.enum(["consensus", "network", "mining", "mempool", "economic"]),
  attackerCapabilities: z.array(z.string().min(5)).min(2),
  mitigations: z.array(z.string().min(5)).min(2),
  observedInWild: z.boolean(),
});

export const researchAssumptionSchema = sharedResearchSchema.extend({
  assumptionType: z.enum(["cryptographic", "economic", "network", "game-theory"]),
  dependsOn: z.array(z.string().min(3)).min(1),
  weakenedBy: z.array(z.string().min(3)).default([]),
});

export const researchPolicyConsensusSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(5),
  layer: z.enum(["consensus", "policy"]),
  linkedNodeIds: z.array(z.string().min(3)).min(1),
  description: z.string().min(12),
  rationale: z.string().min(12),
  sources: z.array(claimSourceRefSchema).min(1),
});

export const researchVulnerabilityListSchema = z.array(researchVulnerabilitySchema);
export const researchAttackListSchema = z.array(researchAttackSchema);
export const researchAssumptionListSchema = z.array(researchAssumptionSchema);
export const researchPolicyConsensusListSchema = z.array(researchPolicyConsensusSchema);

export type AcademyNodeContent = z.infer<typeof academyNodeContentSchema>;
export type AcademyNodeContentList = z.infer<typeof academyNodeContentListSchema>;
export type ResearchVulnerability = z.infer<typeof researchVulnerabilitySchema>;
export type ResearchAttack = z.infer<typeof researchAttackSchema>;
export type ResearchAssumption = z.infer<typeof researchAssumptionSchema>;
export type ResearchPolicyConsensus = z.infer<typeof researchPolicyConsensusSchema>;
