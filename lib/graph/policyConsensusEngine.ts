import { validationRules } from "@/data/security/validation-rules";
import type { ValidationRule } from "@/lib/graph/types";

export function getValidationRules(): ValidationRule[] {
  return validationRules;
}

export function getValidationRuleById(id: string): ValidationRule | undefined {
  return validationRules.find((rule) => rule.id === id);
}

export function getValidationRulesByLayer(
  layer: ValidationRule["layer"],
): ValidationRule[] {
  return validationRules.filter((rule) => rule.layer === layer);
}

export function getValidationRulesForNode(nodeId: string): ValidationRule[] {
  return validationRules.filter((rule) => rule.appliesTo.includes(nodeId));
}
