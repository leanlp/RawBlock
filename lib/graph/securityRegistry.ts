import { vulnerabilities } from "@/data/security/vulnerabilities";
import type { Vulnerability } from "@/lib/graph/types";

export function getVulnerabilities(): Vulnerability[] {
  return vulnerabilities;
}

export function getVulnerabilityById(id: string): Vulnerability | undefined {
  return vulnerabilities.find((vulnerability) => vulnerability.id === id);
}

export function getVulnerabilitiesForNode(nodeId: string): Vulnerability[] {
  return vulnerabilities.filter((vulnerability) => vulnerability.relatedNodes.includes(nodeId));
}

export function getVulnerabilitiesBySeverity(
  severity: Vulnerability["severity"],
): Vulnerability[] {
  return vulnerabilities.filter((vulnerability) => vulnerability.severity === severity);
}

export function getVulnerabilitiesByExploitationType(
  exploitationType: Vulnerability["exploitationType"],
): Vulnerability[] {
  return vulnerabilities.filter(
    (vulnerability) => vulnerability.exploitationType === exploitationType,
  );
}
