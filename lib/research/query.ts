import type { ReadonlyURLSearchParams } from "next/navigation";

export interface ResearchQuery {
  severity?: "critical" | "high" | "medium";
  year?: number;
  layer?: "consensus" | "policy" | "network" | "mining" | "economic";
  affectedVersion?: string;
}

const validSeverities = new Set<NonNullable<ResearchQuery["severity"]>>([
  "critical",
  "high",
  "medium",
]);

const validLayers = new Set<NonNullable<ResearchQuery["layer"]>>([
  "consensus",
  "policy",
  "network",
  "mining",
  "economic",
]);

export function parseResearchQuery(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): ResearchQuery {
  const severityRaw = searchParams.get("severity");
  const yearRaw = searchParams.get("year");
  const layerRaw = searchParams.get("layer");
  const affectedVersionRaw = searchParams.get("affectedVersion");

  const severityCandidate = severityRaw as NonNullable<ResearchQuery["severity"]> | null;
  const severity = severityCandidate && validSeverities.has(severityCandidate)
    ? severityCandidate
    : undefined;

  const parsedYear = yearRaw ? Number.parseInt(yearRaw, 10) : undefined;
  const year = Number.isFinite(parsedYear) ? parsedYear : undefined;

  const layerCandidate = layerRaw as NonNullable<ResearchQuery["layer"]> | null;
  const layer = layerCandidate && validLayers.has(layerCandidate)
    ? layerCandidate
    : undefined;

  const affectedVersion = affectedVersionRaw?.trim() || undefined;

  return { severity, year, layer, affectedVersion };
}

export function buildResearchQueryString(query: ResearchQuery): string {
  const params = new URLSearchParams();
  if (query.severity) params.set("severity", query.severity);
  if (typeof query.year === "number") params.set("year", String(query.year));
  if (query.layer) params.set("layer", query.layer);
  if (query.affectedVersion) params.set("affectedVersion", query.affectedVersion);
  return params.toString();
}
