export type GlossaryEntry = {
  key: string;
  term: string;
  aliases: string[];
  definition: string;
};

export const GLOSSARY: Record<string, GlossaryEntry> = {
  utxo: {
    key: "utxo",
    term: "UTXO",
    aliases: ["utxo", "utxos", "unspent transaction output"],
    definition: "Unspent Transaction Output. A spendable bitcoin output created by a prior transaction.",
  },
  "proof-of-work": {
    key: "proof-of-work",
    term: "Proof-of-Work",
    aliases: ["proof-of-work", "proof of work", "pow"],
    definition: "Consensus mechanism where miners expend hashpower to find valid blocks below the target threshold.",
  },
  "coinbase-transaction": {
    key: "coinbase-transaction",
    term: "Coinbase Transaction",
    aliases: ["coinbase transaction", "coinbase"],
    definition: "The first transaction in a block that pays the block subsidy and collected fees to the miner.",
  },
  "block-subsidy": {
    key: "block-subsidy",
    term: "Block Subsidy",
    aliases: ["block subsidy", "subsidy"],
    definition: "Protocol-defined new bitcoin issuance in each block, halving every 210,000 blocks.",
  },
  mempool: {
    key: "mempool",
    term: "Mempool",
    aliases: ["mempool"],
    definition: "Node-local pool of valid, unconfirmed transactions awaiting block inclusion.",
  },
  reorg: {
    key: "reorg",
    term: "Reorg",
    aliases: ["reorg", "reorganization"],
    definition: "Chain tip replacement when a competing branch with more accumulated work becomes the best chain.",
  },
  segwit: {
    key: "segwit",
    term: "SegWit",
    aliases: ["segwit", "segregated witness"],
    definition: "2017 Bitcoin upgrade separating witness data, fixing transaction malleability vectors, and improving capacity efficiency.",
  },
  taproot: {
    key: "taproot",
    term: "Taproot",
    aliases: ["taproot"],
    definition: "2021 Bitcoin soft fork adding Schnorr signatures and improved script-path privacy/efficiency.",
  },
  pseudonymity: {
    key: "pseudonymity",
    term: "Pseudonymity",
    aliases: ["pseudonymity", "pseudonymous"],
    definition: "Addresses are public identifiers without embedded legal identity, but transaction flows remain publicly traceable.",
  },
  "consensus-rules": {
    key: "consensus-rules",
    term: "Consensus Rules",
    aliases: ["consensus rules", "consensus"],
    definition: "Network-wide validation rules every full node enforces to determine valid blocks and transactions.",
  },
  "block-header": {
    key: "block-header",
    term: "Block Header",
    aliases: ["block header", "headers"],
    definition: "Compact block metadata containing previous hash, merkle root, timestamp, nBits, nonce, and version.",
  },
  "lightning-network": {
    key: "lightning-network",
    term: "Lightning Network",
    aliases: ["lightning network", "lightning"],
    definition: "Bitcoin Layer 2 payment network for fast, low-fee routed payments settled periodically on-chain.",
  },
  "base-layer": {
    key: "base-layer",
    term: "Base Layer",
    aliases: ["base layer", "layer 1", "l1"],
    definition: "The Bitcoin blockchain itself, optimized for global consensus and final settlement.",
  },
  "full-node": {
    key: "full-node",
    term: "Full Node",
    aliases: ["full node", "full nodes", "node", "nodes"],
    definition: "Software that independently validates blocks and transactions against consensus rules.",
  },
  miner: {
    key: "miner",
    term: "Miner",
    aliases: ["miner", "miners", "mining"],
    definition: "Participant that assembles candidate blocks and performs proof-of-work to extend the chain.",
  },
  "coinbase-payout": {
    key: "coinbase-payout",
    term: "Coinbase Payout",
    aliases: ["coinbase payout", "coinbase output", "coinbase outputs"],
    definition: "The first transaction output set in a block, paying block subsidy plus collected transaction fees.",
  },
};

export const GLOSSARY_ENTRIES = Object.values(GLOSSARY);
