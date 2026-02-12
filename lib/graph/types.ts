export type NodeType =
  | "primitive"
  | "rule"
  | "mechanism"
  | "upgrade"
  | "attack"
  | "property";

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  summary: string;
  difficulty: 1 | 2 | 3 | 4;
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
    | "EXPLOITED_BY"
    | "STRENGTHENS"
    | "WEAKENS"
    | "INTRODUCED_BY";
}
