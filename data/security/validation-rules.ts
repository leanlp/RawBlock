import type { ValidationRule } from "@/lib/graph/types";

export const validationRules: ValidationRule[] = [
  {
    id: "consensus-block-weight-limit",
    layer: "consensus",
    description: "Block weight must not exceed consensus maximum.",
    appliesTo: ["block", "block-header"],
    enforcedBy: "full-node",
  },
  {
    id: "consensus-no-double-spend",
    layer: "consensus",
    description: "Transactions and blocks must not include double spends of the same UTXO.",
    appliesTo: ["transaction", "utxo", "input"],
    enforcedBy: "full-node",
  },
  {
    id: "consensus-script-must-evaluate-true",
    layer: "consensus",
    description: "Spend validation requires script execution success.",
    appliesTo: ["script", "transaction", "input"],
    enforcedBy: "full-node",
  },
  {
    id: "policy-standard-script-forms",
    layer: "policy",
    description: "Default relay policy accepts standard script templates only.",
    appliesTo: ["scriptpubkey", "scriptsig", "mempool"],
    enforcedBy: "miner",
  },
  {
    id: "policy-min-relay-fee",
    layer: "policy",
    description: "Transactions below node relay fee policy may be rejected from mempool.",
    appliesTo: ["mempool", "transaction", "fee-rate"],
    enforcedBy: "miner",
  },
  {
    id: "policy-rbf-signaling",
    layer: "policy",
    description: "Replacement acceptance follows replace-by-fee signaling and fee-bump policy.",
    appliesTo: ["replace-by-fee", "mempool", "transaction"],
    enforcedBy: "miner",
  },
];
