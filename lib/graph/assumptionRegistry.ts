import { securityAssumptions } from "@/data/security/assumptions";
import type { SecurityAssumption } from "@/lib/graph/types";

export function getSecurityAssumptions(): SecurityAssumption[] {
  return securityAssumptions;
}

export function getSecurityAssumptionById(
  id: string,
): SecurityAssumption | undefined {
  return securityAssumptions.find((assumption) => assumption.id === id);
}

export function getSecurityAssumptionsForNode(nodeId: string): SecurityAssumption[] {
  return securityAssumptions.filter(
    (assumption) =>
      assumption.id === nodeId ||
      assumption.dependsOn.includes(nodeId) ||
      (assumption.weakenedBy?.includes(nodeId) ?? false),
  );
}
