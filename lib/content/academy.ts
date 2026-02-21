import { academyNodeContentSeed as enSeed } from "@/content/academy/nodes";
import { academyNodeContentSeed as esSeed } from "@/content/academy/nodes.es";
import {
  academyNodeContentListSchema,
  type AcademyNodeContent,
} from "@/lib/content/schema";
import { type Locale } from "@/lib/i18n";

const parsedEn = academyNodeContentListSchema.parse(enSeed);
const byIdEn = new Map<string, AcademyNodeContent>(parsedEn.map((node) => [node.id, node]));

const parsedEs = academyNodeContentListSchema.parse(esSeed);
const byIdEs = new Map<string, AcademyNodeContent>(parsedEs.map((node) => [node.id, node]));

export function getAcademyNodeContent(nodeId: string, locale: Locale): AcademyNodeContent | undefined {
  return locale === "es" ? byIdEs.get(nodeId) : byIdEn.get(nodeId);
}

export function getAllAcademyNodeContent(locale: Locale): AcademyNodeContent[] {
  return locale === "es" ? parsedEs : parsedEn;
}

export function hasAcademyNodeContent(nodeId: string, locale: Locale): boolean {
  return locale === "es" ? byIdEs.has(nodeId) : byIdEn.has(nodeId);
}
