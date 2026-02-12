import { getAllAcademyNodeContent } from "@/lib/content/academy";
import {
  getResearchAssumptions,
  getResearchAttacks,
  getResearchPolicyVsConsensus,
  getResearchVulnerabilities,
} from "@/lib/content/research";

export function validateContentSchemas() {
  // Accessors already parse via zod at module load.
  getAllAcademyNodeContent();
  getResearchVulnerabilities();
  getResearchAttacks();
  getResearchAssumptions();
  getResearchPolicyVsConsensus();
}
