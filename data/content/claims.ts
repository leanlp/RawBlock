export interface Claim {
  id: string;
  text: string;
  source_url: string;
  last_verified_at: string;
}

export const claims: Claim[] = [
  {
    id: "btc-fixed-supply-21m",
    text: "Bitcoin has a capped total supply of 21,000,000 BTC enforced by consensus rules.",
    source_url: "https://en.bitcoin.it/wiki/Controlled_supply",
    last_verified_at: "2026-02-12",
  },
  {
    id: "btc-utxo-model",
    text: "Bitcoin uses a UTXO model where transactions spend prior outputs and create new outputs.",
    source_url: "https://developer.bitcoin.org/devguide/transactions.html",
    last_verified_at: "2026-02-12",
  },
  {
    id: "btc-block-header-links-prevhash",
    text: "Each block header commits to the previous block hash, linking blocks into a tamper-evident chain.",
    source_url: "https://developer.bitcoin.org/reference/block_chain.html#block-headers",
    last_verified_at: "2026-02-12",
  },
  {
    id: "btc-subsidy-halving-210k",
    text: "Bitcoin block subsidy halves every 210,000 blocks.",
    source_url: "https://developer.bitcoin.org/reference/block_chain.html#block-headers",
    last_verified_at: "2026-02-12",
  },
  {
    id: "btc-difficulty-retarget-2016",
    text: "Bitcoin retargets mining difficulty every 2016 blocks to maintain approximately 10-minute blocks.",
    source_url: "https://developer.bitcoin.org/reference/block_chain.html#target-nbits",
    last_verified_at: "2026-02-12",
  },
  {
    id: "btc-consensus-vs-policy",
    text: "Consensus rules determine block/transaction validity for all nodes, while policy rules are local relay/mempool decisions.",
    source_url: "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/mempool-replacements.md",
    last_verified_at: "2026-02-12",
  },
  {
    id: "btc-pseudonymous-not-anonymous",
    text: "Bitcoin is pseudonymous rather than anonymous because transactions are public and traceable at the address graph level.",
    source_url: "https://en.bitcoin.it/wiki/Privacy",
    last_verified_at: "2026-02-12",
  },
  {
    id: "wallets-store-keys",
    text: "Wallet software stores keys and signing material, not coins.",
    source_url: "https://developer.bitcoin.org/devguide/wallets.html",
    last_verified_at: "2026-02-12",
  },
  {
    id: "address-not-same-as-pubkey",
    text: "Bitcoin addresses are encoded destinations derived from scripts/keys and are not identical to raw public keys.",
    source_url: "https://developer.bitcoin.org/devguide/transactions.html#p2pkh-script-validation",
    last_verified_at: "2026-02-12",
  },
  {
    id: "base-layer-throughput-about-7tps",
    text: "Bitcoin base-layer throughput is commonly estimated at roughly 5-7 transactions per second.",
    source_url: "https://en.bitcoin.it/wiki/Scalability",
    last_verified_at: "2026-02-12",
  },
  {
    id: "lightning-production-mainnet",
    text: "Lightning Network is live on Bitcoin mainnet and broadly used for low-latency payments.",
    source_url: "https://lightning.network/",
    last_verified_at: "2026-02-12",
  },
  {
    id: "coinbase-lightning-support",
    text: "Coinbase supports Lightning Network for bitcoin transfers.",
    source_url: "https://www.coinbase.com/blog/coinbase-integrates-bitcoin-lightning",
    last_verified_at: "2026-02-12",
  },
  {
    id: "kraken-lightning-support",
    text: "Kraken supports Lightning Network deposits and withdrawals.",
    source_url: "https://support.kraken.com/hc/articles/5068216131988",
    last_verified_at: "2026-02-12",
  },
  {
    id: "binance-lightning-support",
    text: "Binance supports Lightning Network transfers for bitcoin.",
    source_url: "https://www.binance.com/en/support/announcement/binance-opens-bitcoin-lightning-network-withdrawals-and-deposits-0f4f2f975cbe4e02a67f318c4a80f4f3",
    last_verified_at: "2026-02-12",
  },
  {
    id: "bitfinex-lightning-support",
    text: "Bitfinex supports Lightning Network for bitcoin transactions.",
    source_url: "https://support.bitfinex.com/hc/articles/900005961786",
    last_verified_at: "2026-02-12",
  },
  {
    id: "segwit-activated-2017",
    text: "SegWit activated on Bitcoin mainnet in 2017.",
    source_url: "https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki",
    last_verified_at: "2026-02-12",
  },
  {
    id: "taproot-activated-2021",
    text: "Taproot activated on Bitcoin mainnet in 2021.",
    source_url: "https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki",
    last_verified_at: "2026-02-12",
  },
];

export const claimsById: Record<string, Claim> = Object.fromEntries(
  claims.map((claim) => [claim.id, claim]),
) as Record<string, Claim>;

export const NODE_CLAIM_IDS: Record<string, string[]> = {
  "what-is-bitcoin": ["btc-fixed-supply-21m"],
  "transactions-lifecycle": ["btc-utxo-model"],
  "utxo-model": ["btc-utxo-model"],
  "blocks-and-headers": ["btc-block-header-links-prevhash"],
  "mining-and-subsidy": ["btc-subsidy-halving-210k"],
  "difficulty-adjustment-2016": ["btc-difficulty-retarget-2016"],
  "consensus-rules-vs-policy": ["btc-consensus-vs-policy"],
  "pseudonymity-not-anonymity": ["btc-pseudonymous-not-anonymous"],
  "wallets-hold-keys-not-coins": ["wallets-store-keys"],
  "address-vs-public-key": ["address-not-same-as-pubkey"],
  "lightning-network-maturity": [
    "base-layer-throughput-about-7tps",
    "lightning-production-mainnet",
    "coinbase-lightning-support",
    "kraken-lightning-support",
    "binance-lightning-support",
    "bitfinex-lightning-support",
  ],
  "segwit-and-taproot-upgrades": [
    "segwit-activated-2017",
    "taproot-activated-2021",
  ],
};

export function getClaimsForNode(nodeId: string): Claim[] {
  const ids = NODE_CLAIM_IDS[nodeId] ?? [];
  return ids.map((id) => claimsById[id]).filter(Boolean);
}
