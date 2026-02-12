export type NodeType =
  | "primitive"
  | "rule"
  | "mechanism"
  | "upgrade"
  | "attack"
  | "property"
  | "vulnerability"
  | "assumption";

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  summary: string;
  difficulty: 1 | 2 | 3 | 4;
  claimIds?: string[];
  advancedNotes?: string[];
  furtherReading?: {
    title: string;
    url: string;
  }[];
  explorerLinks?: string[];
  securityNotes?: string[];
  securityCaseStudies?: {
    title: string;
    description: string;
    historicalReference?: string;
  }[];
}

export interface Edge {
  from: string;
  to: string;
  type:
    | "DEPENDS_ON"
    | "VALIDATED_BY"
    | "PART_OF"
    | "EXPLOITS"
    | "EXPLOITED_BY"
    | "STRENGTHENS"
    | "WEAKENS"
    | "MITIGATED_BY"
    | "POLICY_ONLY"
    | "NOT_CONSENSUS_CRITICAL"
    | "INTRODUCED_BY";
}

export interface ValidationRule {
  id: string;
  layer: "consensus" | "policy";
  description: string;
  appliesTo: string[];
  enforcedBy: "full-node" | "miner";
}

export interface Vulnerability {
  id: string;
  title: string;
  cve?: string;
  year: number;
  affectedVersions: string[];
  rootCause: string;
  impact: string;
  fixedBy: string;
  relatedNodes: string[];
  exploitationType: "inflation" | "consensus" | "dos" | "policy" | "economic";
  severity: "critical" | "high" | "medium";
}

export interface AttackModel {
  id: string;
  title: string;
  attackerCapabilities: string[];
  targetLayer: "consensus" | "network" | "mining" | "mempool";
  exploitsNodes: string[];
  mitigatedBy: string[];
  costModel?: string;
  realWorldObserved?: boolean;
}

export interface SecurityAssumption {
  id: string;
  statement: string;
  category: "cryptographic" | "economic" | "network" | "game-theory";
  dependsOn: string[];
  weakenedBy?: string[];
}
