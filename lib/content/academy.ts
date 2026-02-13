import { academyNodeContentSeed } from "@/content/academy/nodes";
import {
  academyNodeContentListSchema,
  type AcademyNodeContent,
} from "@/lib/content/schema";

const parsed = academyNodeContentListSchema.parse(academyNodeContentSeed);

const byId = new Map<string, AcademyNodeContent>(parsed.map((node) => [node.id, node]));

export function getAcademyNodeContent(nodeId: string): AcademyNodeContent | undefined {
  return byId.get(nodeId);
}

export function getAllAcademyNodeContent(): AcademyNodeContent[] {
  return parsed;
}

export function hasAcademyNodeContent(nodeId: string): boolean {
  return byId.has(nodeId);
}
