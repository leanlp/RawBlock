import type { NodeType } from "@/lib/graph/types";

export type NodeTypePresentation = {
  icon: string;
  label: string;
};

export const NODE_TYPE_PRESENTATION: Record<NodeType, NodeTypePresentation> = {
  primitive: { icon: "🧱", label: "Primitive" },
  rule: { icon: "📜", label: "Rule" },
  mechanism: { icon: "⚙️", label: "Mechanism" },
  upgrade: { icon: "🛠️", label: "Upgrade" },
  attack: { icon: "⚠️", label: "Attack" },
  vulnerability: { icon: "🧨", label: "Vulnerability" },
  assumption: { icon: "🧭", label: "Assumption" },
  property: { icon: "🔷", label: "Property" },
};
