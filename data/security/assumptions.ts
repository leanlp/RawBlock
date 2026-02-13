import type { SecurityAssumption } from "@/lib/graph/types";

export const securityAssumptions: SecurityAssumption[] = [
  {
    id: "hashpower-majority-assumption",
    statement: "Majority of hashpower follows protocol-valid chain selection.",
    category: "economic",
    dependsOn: ["proof-of-work", "mining"],
    weakenedBy: ["attack-51-percent", "selfish-mining"],
  },
  {
    id: "sha256-preimage-resistance-assumption",
    statement: "SHA256 remains preimage resistant for practical adversaries.",
    category: "cryptographic",
    dependsOn: ["proof-of-work", "block-header"],
  },
  {
    id: "independent-validation-assumption",
    statement: "Nodes independently validate blocks and transactions.",
    category: "network",
    dependsOn: ["consensus-rules", "transaction", "block"],
    weakenedBy: ["eclipse-attack"],
  },
  {
    id: "network-topology-assumption",
    statement: "Network propagation remains sufficiently connected and low-latency.",
    category: "network",
    dependsOn: ["mempool", "reorg"],
    weakenedBy: ["selfish-mining", "eclipse-attack"],
  },
];
