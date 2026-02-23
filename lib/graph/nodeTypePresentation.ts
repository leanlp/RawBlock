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

export function getLocalizedNodeTypeLabel(type: NodeType, locale: string): string {
  if (locale !== "es") {
    return NODE_TYPE_PRESENTATION[type].label;
  }

  const esLabels: Record<NodeType, string> = {
    primitive: "Primitiva",
    rule: "Regla",
    mechanism: "Mecanismo",
    upgrade: "Actualizacion",
    attack: "Ataque",
    vulnerability: "Vulnerabilidad",
    assumption: "Supuesto",
    property: "Propiedad",
  };

  return esLabels[type];
}
