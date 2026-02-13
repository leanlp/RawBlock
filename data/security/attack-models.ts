import type { AttackModel } from "@/lib/graph/types";

export const attackModels: AttackModel[] = [
  {
    id: "double-spend",
    title: "Double Spend Attack",
    attackerCapabilities: [
      "Broadcast conflicting transactions",
      "Exploit transaction propagation timing",
      "Leverage merchant zero-confirmation acceptance",
    ],
    targetLayer: "mempool",
    exploitsNodes: ["utxo", "mempool", "transaction"],
    mitigatedBy: ["confirmation", "proof-of-work", "finality"],
    costModel: "Low to medium, depending on confirmation requirements and coordination.",
    realWorldObserved: true,
  },
  {
    id: "attack-51-percent",
    title: "51% Attack",
    attackerCapabilities: [
      "Sustain majority hashpower share",
      "Privately mine and release longer work chain",
      "Censor selected transactions and blocks",
    ],
    targetLayer: "mining",
    exploitsNodes: [
      "proof-of-work",
      "difficulty-target",
      "reorg",
      "mining",
      "hashpower-majority-assumption",
    ],
    mitigatedBy: ["decentralized-hash-distribution", "confirmation", "finality"],
    costModel: "Very high ongoing electricity and hardware cost plus opportunity cost.",
    realWorldObserved: true,
  },
  {
    id: "selfish-mining",
    title: "Selfish Mining",
    attackerCapabilities: [
      "Withhold discovered blocks strategically",
      "Release private chain to invalidate honest work",
      "Exploit block propagation asymmetry",
    ],
    targetLayer: "mining",
    exploitsNodes: ["selfish-mining", "reorg", "mining", "network-topology-assumption"],
    mitigatedBy: ["faster-block-propagation", "decentralized-hash-distribution"],
    costModel: "Medium to high; requires sustained hashpower and network advantage.",
    realWorldObserved: false,
  },
];
