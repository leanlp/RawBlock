import type { AcademyNodeContentList } from "@/lib/content/schema";

export const academyNodeContentSeed: AcademyNodeContentList = [
  {
    id: "what-is-bitcoin",
    title: "What is Bitcoin",
    type: "property",
    difficulty: 1,
    canonicalLesson: "what-is-bitcoin",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Bitcoin is a decentralized monetary network where independent nodes enforce a fixed supply and shared transaction history.",
    story:
      "A new learner opens Raw Block and expects Bitcoin to be a coin app. Instead, they discover a coordination machine. Every ten minutes, thousands of participants across the world converge on one shared ledger state without asking a bank, company, or government for permission. The practical insight is that Bitcoin is not one server and not one company. It is a protocol where rules are transparent, verification is local, and participation is voluntary. The network only works because many independent operators keep checking every block and transaction. That is why Bitcoin can remain online through political pressure, censorship attempts, and infrastructure failures. Once you understand Bitcoin as a rule system plus an open market of participants, most other topics in this path become easier: mining is cost-backed ordering, nodes are rule enforcers, and wallets are interfaces to keys rather than places where coins are stored.",
    deepDive: [
      {
        heading: "System model",
        bullets: [
          "Bitcoin combines peer-to-peer networking, cryptographic signatures, and proof-of-work ordering.",
          "State changes happen through valid transactions that spend existing UTXOs and create new ones.",
          "No central administrator can mint extra supply outside consensus rules.",
        ],
      },
      {
        heading: "Why it matters",
        bullets: [
          "Independent verification lowers trust requirements compared to custodial ledgers.",
          "Open participation creates censorship resistance and resilience through geography and ownership diversity.",
          "Fixed issuance and predictable halving schedule provide credible monetary constraints.",
        ],
      },
    ],
    keyTakeaways: [
      "Bitcoin is a protocol and network, not a company product.",
      "Consensus rules enforce supply and validity globally.",
      "Nodes validate; miners order; users hold keys.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Current Block Height",
        description: "Latest known chain tip used to anchor all downstream learning modules.",
        display: "Integer with comma separators",
      },
      {
        key: "daysUntilHalving",
        label: "Days Until Next Halving",
        description: "Estimated using blocks remaining and 10-minute average block interval.",
        display: "Whole-day countdown with blocks remaining",
      },
    ],
    securityNotes: [
      "Bitcoin security assumes broad independent validation by full nodes.",
      "Ledger history becomes harder to rewrite as confirmations accumulate.",
    ],
    linkedVulnerabilities: ["value-overflow-2010"],
    linkedAttacks: ["attack-51-percent"],
    linkedAssumptions: ["independent-validation-assumption"],
    policyRules: [
      "Node relay policy may reject low-fee or non-standard transactions.",
      "Policy settings can differ by node without causing consensus forks.",
    ],
    consensusRules: [
      "Block and transaction validity are deterministic under consensus checks.",
      "Supply creation must follow the protocol subsidy schedule.",
    ],
    policyVsConsensusExplanation:
      "Consensus defines validity for the chain itself; policy defines local admission preferences into mempool/relay.",
    caseStudies: [
      {
        title: "2010 Value Overflow Incident",
        year: 2010,
        summary:
          "A consensus bug allowed invalid inflation and showed why strict validation and rapid patch coordination are essential.",
      },
    ],
    explorerDeepLinks: [
      { label: "Latest Blocks", url: "https://mempool.space/blocks" },
      { label: "Difficulty Dashboard", url: "https://mempool.space/mining" },
    ],
    claimSources: [
      {
        claim: "Bitcoin supply is bounded by protocol rules and halvings.",
        sources: [
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
          {
            title: "Bitcoin Core consensus constants",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h",
            type: "core-docs",
          },
        ],
      },
      {
        claim: "Nodes independently validate each block and transaction.",
        sources: [
          {
            title: "Bitcoin Developer Guide: P2P Network",
            url: "https://developer.bitcoin.org/devguide/p2p_network.html",
            type: "dev-guide",
          },
          {
            title: "Bitcoin Wiki: Full node",
            url: "https://en.bitcoin.it/wiki/Full_node",
            type: "reference",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf" },
      {
        title: "Developer Guide Introduction",
        url: "https://developer.bitcoin.org/devguide/index.html",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "transactions-lifecycle",
    title: "Transactions Lifecycle",
    type: "mechanism",
    difficulty: 1,
    canonicalLesson: "transactions",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Transactions move value by consuming old outputs, creating new outputs, and propagating through node mempools before block inclusion.",
    story:
      "A merchant sees a payment notification and asks: is this final? The lifecycle begins when a wallet assembles inputs, signs spend conditions, and broadcasts to peers. Each node checks structure, scripts, and policy before accepting into its mempool. Miners then choose transactions by fee density and template strategy, producing a candidate block. Once mined, the transaction receives its first confirmation, then additional confirmations as more blocks build on top. The key operational point is that lifecycle stages have different risk levels. Mempool presence is not finality. First confirmation is meaningful, and deeper confirmations materially reduce reversal probability. Raw Block makes this visible by linking decoder, mempool, and block views so users can see how transaction state changes over time rather than assuming one static status.",
    deepDive: [
      {
        heading: "Creation and relay",
        bullets: [
          "Wallets perform coin selection and fee-rate estimation before signing.",
          "Relay is gossip-based, so mempool contents differ slightly by node and timing.",
          "Policy checks gate relay, but consensus checks gate final chain inclusion.",
        ],
      },
      {
        heading: "Confirmation and settlement",
        bullets: [
          "Inclusion in a valid block provides first-chain confirmation.",
          "Confirmation depth increases confidence against reorg-driven reversal.",
          "High-value flows often wait for more confirmations before settlement acceptance.",
        ],
      },
    ],
    keyTakeaways: [
      "Mempool acceptance is not final settlement.",
      "Fee rate heavily influences inclusion speed.",
      "Confirmation depth is a risk management dial.",
    ],
    realData: [
      {
        key: "feeFast",
        label: "Fast Fee",
        description: "Recommended sat/vB for near-term inclusion in congested conditions.",
        display: "sat/vB badge",
      },
      {
        key: "feeHalfHour",
        label: "30-Min Fee",
        description: "Recommendation for moderate urgency transactions.",
        display: "sat/vB badge",
      },
    ],
    securityNotes: [
      "Zero-confirmation acceptance is vulnerable to double-spend attempts.",
      "Wallet fee-bumping tools (RBF/CPFP) reduce stuck-transaction risk.",
    ],
    linkedVulnerabilities: ["malleability-pre-segwit"],
    linkedAttacks: ["double-spend"],
    linkedAssumptions: ["network-topology-assumption"],
    policyRules: [
      "Replace-by-fee handling depends on local mempool policy.",
      "Nodes may reject low-fee transactions even if consensus-valid.",
    ],
    consensusRules: [
      "Inputs must reference valid, unspent outputs.",
      "Scripts and signatures must evaluate successfully for each spend.",
    ],
    policyVsConsensusExplanation:
      "Policy influences relay and mempool acceptance; consensus determines whether mined transactions are valid chain history.",
    caseStudies: [
      {
        title: "Pre-SegWit Malleability Operational Failures",
        year: 2014,
        summary:
          "Mutable txid behavior broke unconfirmed transaction tracking and motivated SegWit design priorities.",
      },
    ],
    explorerDeepLinks: [
      { label: "Mempool Queue", url: "https://mempool.space/mempool" },
      { label: "Recent Transactions", url: "https://mempool.space/" },
    ],
    claimSources: [
      {
        claim: "Transactions propagate via peer relay and enter local mempools before mining.",
        sources: [
          {
            title: "Developer Guide: Transactions",
            url: "https://developer.bitcoin.org/devguide/transactions.html",
            type: "dev-guide",
          },
          {
            title: "Developer Guide: P2P Network",
            url: "https://developer.bitcoin.org/devguide/p2p_network.html",
            type: "dev-guide",
          },
        ],
      },
      {
        claim: "Fee rate determines transaction priority under constrained block space.",
        sources: [
          {
            title: "Mempool replacements policy",
            url: "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/mempool-replacements.md",
            type: "core-docs",
          },
          {
            title: "BIP 125 Replace-by-fee",
            url: "https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki",
            type: "BIP",
          },
        ],
      },
    ],
    furtherReading: [
      {
        title: "BIP 125",
        url: "https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki",
      },
      {
        title: "Mempool Policy Docs",
        url: "https://github.com/bitcoin/bitcoin/tree/master/doc/policy",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "utxo-model",
    title: "UTXO Model",
    type: "mechanism",
    difficulty: 1,
    canonicalLesson: "utxo-model",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Bitcoin tracks spendable state as unspent outputs, not account balances, enabling deterministic validation of every spend path.",
    story:
      "A user asks why their wallet shows many tiny pieces instead of one account balance. The answer is the UTXO model: every payment creates outputs with explicit spend conditions, and later transactions consume those outputs as inputs. This model makes validation local and precise. A node does not trust a running balance field. It checks whether each referenced output exists, is unspent, and satisfies script rules. That design simplifies consensus safety but creates practical tradeoffs. Large sets of tiny outputs increase future fees and harm privacy when consolidated carelessly. Wallets therefore optimize coin selection, batching, and change management. In Raw Block, understanding UTXO behavior helps users reason about fees, privacy, and attack surface much better than account-based mental models.",
    deepDive: [
      {
        heading: "Validation mechanics",
        bullets: [
          "Each input points to one previous output and must satisfy its locking script.",
          "A UTXO can be spent exactly once in valid chain history.",
          "The global UTXO set is the authoritative spendability state.",
        ],
      },
      {
        heading: "Operational implications",
        bullets: [
          "Many small UTXOs increase future transaction weight and fees.",
          "Consolidation improves future efficiency but may reduce privacy if done poorly.",
          "Coin selection strategy affects both cost and address-clustering exposure.",
        ],
      },
    ],
    keyTakeaways: [
      "UTXO state is explicit and one-time spendable.",
      "Wallets optimize coin selection to control cost and privacy.",
      "Double-spend prevention is enforced through unique UTXO consumption.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Anchor Height",
        description: "Current chain height to contextualize UTXO snapshots and confirmations.",
        display: "Integer",
      },
      {
        key: "feeHour",
        label: "Low Urgency Fee",
        description: "Useful for consolidation planning during lower fee windows.",
        display: "sat/vB badge",
      },
    ],
    securityNotes: [
      "UTXO uniqueness prevents valid duplicate spends in consensus.",
      "Wallet reuse patterns can leak ownership clustering over time.",
    ],
    linkedVulnerabilities: ["cve-2018-17144"],
    linkedAttacks: ["double-spend"],
    linkedAssumptions: ["independent-validation-assumption"],
    policyRules: [
      "Dust and standardness policies discourage uneconomical outputs.",
      "Relay preferences can shape UTXO hygiene behavior in wallets.",
    ],
    consensusRules: [
      "Inputs must spend unspent outputs exactly once.",
      "Total output value must not exceed total input value plus allowed subsidy on coinbase.",
    ],
    policyVsConsensusExplanation:
      "Consensus protects spend validity; policy nudges economically sensible transaction construction and relay behavior.",
    caseStudies: [
      {
        title: "CVE-2018-17144 Duplicate Input Risk",
        year: 2018,
        summary:
          "A duplicate-input validation regression highlighted how critical UTXO checks are for inflation resistance.",
      },
    ],
    explorerDeepLinks: [
      { label: "UTXO Explorer", url: "https://www.rawblock.net/analysis/utxo" },
      { label: "Address UTXOs", url: "https://mempool.space/address/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
    ],
    claimSources: [
      {
        claim: "Bitcoin uses an unspent output state model rather than account balances.",
        sources: [
          {
            title: "Developer Guide Transactions",
            url: "https://developer.bitcoin.org/devguide/transactions.html",
            type: "dev-guide",
          },
          {
            title: "Bitcoin Wiki UTXO model",
            url: "https://en.bitcoin.it/wiki/Transaction",
            type: "reference",
          },
        ],
      },
      {
        claim: "Duplicate-input handling is consensus critical for inflation safety.",
        sources: [
          {
            title: "CVE-2018-17144 disclosure",
            url: "https://bitcoincore.org/en/2018/09/20/notice/",
            type: "core-docs",
          },
          {
            title: "Bitcoin Core fix PR context",
            url: "https://github.com/bitcoin/bitcoin/pull/14199",
            type: "core-docs",
          },
        ],
      },
    ],
    furtherReading: [
      {
        title: "Developer Reference: Transactions",
        url: "https://developer.bitcoin.org/reference/transactions.html",
      },
      {
        title: "BIP 30",
        url: "https://github.com/bitcoin/bips/blob/master/bip-0030.mediawiki",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "blocks-and-headers",
    title: "Blocks and Headers",
    type: "primitive",
    difficulty: 1,
    canonicalLesson: "blocks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Block headers commit to previous history and transaction set metadata, making tampering detectable and costly to rewrite.",
    story:
      "A node receives a new block and must decide quickly: accept or reject. It starts with the header. The header contains the previous block hash, timestamp, difficulty target, nonce, and merkle root commitment. This tiny structure links every block to prior history and anchors proof-of-work. If any transaction in the block changes, the merkle root changes; if any parent changes, the previous-hash link breaks. This chaining is why users can verify integrity without trusting a central archive. Headers also enable lightweight clients to track chainwork and detect reorganizations. In practice, blocks and headers are the protocol’s compact security boundary: enough data to enforce ordering and commitment, then full transactions for detailed validation.",
    deepDive: [
      {
        heading: "Header fields",
        bullets: [
          "prevhash links parent history and defines chain continuity.",
          "Merkle root commits to included transaction set.",
          "nBits encodes difficulty target for proof-of-work validity.",
        ],
      },
      {
        heading: "Security properties",
        bullets: [
          "Changing historical content requires recomputing proof-of-work for affected blocks.",
          "Header-only validation can quickly reject obviously invalid branches.",
          "Propagation latency can still cause short-lived stale block races.",
        ],
      },
    ],
    keyTakeaways: [
      "Headers are compact commitments to block state and ancestry.",
      "Merkle commitments make transaction tampering evident.",
      "Chain integrity is hash-linked and work-backed.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Tip Height",
        description: "Reference height for exploring recent headers and block intervals.",
        display: "Integer",
      },
      {
        key: "hashrateEh",
        label: "Hashrate",
        description: "Approximate global hashpower securing the header chain.",
        display: "EH/s with 2 decimals",
      },
    ],
    securityNotes: [
      "Header chain selection follows cumulative work, not longest by count.",
      "Short stale races are normal; deep unexpected reorgs are security events.",
    ],
    linkedVulnerabilities: ["cve-2013-2292"],
    linkedAttacks: ["selfish-mining"],
    linkedAssumptions: ["network-topology-assumption"],
    policyRules: [
      "Header relay and orphan handling can vary by implementation policy.",
      "Node policy may prioritize certain peer sources under bandwidth pressure.",
    ],
    consensusRules: [
      "Header hash must satisfy target encoded by nBits.",
      "Header must correctly reference previous accepted block hash.",
    ],
    policyVsConsensusExplanation:
      "Consensus defines header validity and chain selection by work; policy affects relay strategy and temporary buffering behavior.",
    caseStudies: [
      {
        title: "2013 BerkeleyDB Fork Event",
        year: 2013,
        summary:
          "Client-version incompatibility caused temporary chain divergence despite valid-looking headers on each side.",
      },
    ],
    explorerDeepLinks: [
      { label: "Latest Block Headers", url: "https://mempool.space/blocks" },
      { label: "Block Details", url: "https://mempool.space/block/000000000000000000021f95d73bb43fcbfca90f4ed7f1e8d8d7a5f8f278e5d3" },
    ],
    claimSources: [
      {
        claim: "Each block header commits to prior history and transaction merkle root.",
        sources: [
          {
            title: "Developer Reference: Block Headers",
            url: "https://developer.bitcoin.org/reference/block_chain.html#block-headers",
            type: "dev-guide",
          },
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
        ],
      },
      {
        claim: "Chain selection uses cumulative work.",
        sources: [
          {
            title: "Developer Guide: Block Chain",
            url: "https://developer.bitcoin.org/devguide/block_chain.html",
            type: "dev-guide",
          },
          {
            title: "Bitcoin Core consensus logic",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp",
            type: "core-docs",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "BIP 34", url: "https://github.com/bitcoin/bips/blob/master/bip-0034.mediawiki" },
      {
        title: "Developer block chain reference",
        url: "https://developer.bitcoin.org/reference/block_chain.html",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "mining-and-subsidy",
    title: "Mining and Subsidy",
    type: "mechanism",
    difficulty: 2,
    canonicalLesson: "mining",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Miners convert electricity and hardware cost into chain security, earning coinbase payout composed of block subsidy plus transaction fees.",
    story:
      "A miner assembles a candidate block from mempool transactions and starts hashing trillions of times per second. There is no shortcut puzzle to solve; only repeated hash attempts until one header falls below the target threshold. The winning miner broadcasts the block, receives coinbase payout, and everyone else verifies it. This process creates two crucial outcomes at once: transaction ordering and economic deterrence against rewriting history. Over time, subsidy halves while fee revenue becomes increasingly important. That transition is why fee-market literacy matters for both users and operators. Mining is not just issuance; it is the cost anchor that makes censorship and deep reorg attempts expensive.",
    deepDive: [
      {
        heading: "Revenue model",
        bullets: [
          "Coinbase payout = protocol subsidy + aggregated transaction fees.",
          "Subsidy halves every 210,000 blocks and trends toward zero.",
          "Fee pressure can dominate miner revenue during congestion spikes.",
        ],
      },
      {
        heading: "Security function",
        bullets: [
          "Proof-of-work makes chain rewrite attempts computationally and economically costly.",
          "Miner competition aligns toward valid blocks because invalid blocks are rejected by nodes.",
          "Hashpower concentration increases governance and censorship risk.",
        ],
      },
    ],
    keyTakeaways: [
      "Mining secures ordering and settlement, not just issuance.",
      "Subsidy declines while fees matter more over long horizons.",
      "Nodes enforce validity even when miners produce blocks.",
    ],
    realData: [
      {
        key: "hashrateEh",
        label: "Network Hashrate",
        description: "3-day average hashrate proxy from public mining telemetry.",
        display: "EH/s",
      },
      {
        key: "blocksUntilHalving",
        label: "Blocks to Halving",
        description: "Remaining blocks before subsidy epoch transition.",
        display: "Integer countdown",
      },
    ],
    securityNotes: [
      "Higher hashrate raises the cost of deep reorg attacks.",
      "Pool centralization can weaken censorship resistance assumptions.",
    ],
    linkedVulnerabilities: ["value-overflow-2010"],
    linkedAttacks: ["attack-51-percent", "selfish-mining"],
    linkedAssumptions: ["hashpower-majority-assumption", "decentralized-hash-distribution-assumption"],
    policyRules: [
      "Transaction template selection is a miner policy decision.",
      "Policy can influence fee market outcomes without changing consensus validity.",
    ],
    consensusRules: [
      "Coinbase payout must not exceed subsidy plus collected fees.",
      "Proof-of-work target must be met for block acceptance.",
    ],
    policyVsConsensusExplanation:
      "Consensus bounds payout and block validity; miner policy governs which valid transactions are included first.",
    caseStudies: [
      {
        title: "Selfish Mining Strategy Publication",
        year: 2014,
        summary:
          "Showed that strategic withholding can increase expected revenue above honest mining at certain hash-share thresholds.",
      },
    ],
    explorerDeepLinks: [
      { label: "Mining Dashboard", url: "https://mempool.space/mining" },
      { label: "Recent Coinbase Transactions", url: "https://mempool.space/tx/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b" },
    ],
    claimSources: [
      {
        claim: "Coinbase payout is subsidy plus fees and subsidy halves every 210,000 blocks.",
        sources: [
          {
            title: "Developer block subsidy reference",
            url: "https://developer.bitcoin.org/reference/block_chain.html#block-subsidy",
            type: "dev-guide",
          },
          { title: "BIP 42", url: "https://github.com/bitcoin/bips/blob/master/bip-0042.mediawiki", type: "BIP" },
        ],
      },
      {
        claim: "Proof-of-work underpins costly chain rewrite resistance.",
        sources: [
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
          {
            title: "Developer Guide Block Chain",
            url: "https://developer.bitcoin.org/devguide/block_chain.html",
            type: "dev-guide",
          },
        ],
      },
    ],
    furtherReading: [
      {
        title: "bitcoin-dev mining discussions",
        url: "https://lists.linuxfoundation.org/pipermail/bitcoin-dev/",
      },
      {
        title: "Eyal & Sirer Selfish Mining",
        url: "https://www.cs.cornell.edu/~ie53/publications/btcProcFC.pdf",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "difficulty-adjustment-2016",
    title: "Difficulty Adjustment (2016)",
    type: "rule",
    difficulty: 2,
    canonicalLesson: "difficulty",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Bitcoin retargets mining difficulty every 2016 blocks to keep average block production near ten minutes despite hashrate changes.",
    story:
      "Hashrate rarely stays constant. New hardware appears, energy prices shift, and miners relocate. Without adjustment, block timing would drift and monetary issuance would become chaotic. Bitcoin solves this by retargeting every 2016 blocks: if recent blocks arrived too quickly, target tightens; if too slowly, target loosens. This cadence smooths large shocks while keeping consensus deterministic. Operators watch this closely because abrupt hashrate drops can produce temporarily slow blocks until the next retarget. In education terms, difficulty is Bitcoin’s tempo governor. It does not make mining easier in human terms; it updates target thresholds so the global process remains stable over long horizons.",
    deepDive: [
      {
        heading: "Retarget mechanics",
        bullets: [
          "Every 2016 blocks, nodes compare expected elapsed time with observed elapsed time.",
          "New target is adjusted proportionally and then encoded into nBits.",
          "All validating nodes independently compute and enforce the same retarget rule.",
        ],
      },
      {
        heading: "Operational edge cases",
        bullets: [
          "Large hashrate exits can slow confirmation flow until epoch boundary.",
          "Timestamp behavior influences retarget calculations and has been studied for manipulation vectors.",
          "Difficulty trends provide rough security-cost context but are not direct attack-proof guarantees.",
        ],
      },
    ],
    keyTakeaways: [
      "Retarget interval is 2016 blocks by consensus.",
      "Difficulty stabilizes issuance tempo over multi-year periods.",
      "Short-term volatility still exists between retarget windows.",
    ],
    realData: [
      {
        key: "hashrateEh",
        label: "Current Hashrate",
        description: "Used to contextualize expected pressure on upcoming retarget windows.",
        display: "EH/s",
      },
      {
        key: "blockHeight",
        label: "Retarget Context Height",
        description: "Current height indicates distance from next 2016-block boundary.",
        display: "Integer",
      },
    ],
    securityNotes: [
      "Difficulty does not prevent attacks by itself; it scales work requirements.",
      "Timestamp anomalies are monitored because they influence retarget inputs.",
    ],
    linkedVulnerabilities: ["timewarp-theoretical"],
    linkedAttacks: ["attack-51-percent"],
    linkedAssumptions: ["sha256-preimage-resistance-assumption"],
    policyRules: [
      "Node policy may surface warnings around unusual block-time behavior.",
      "Miner timestamp conventions are partly social/policy and partly consensus-bounded.",
    ],
    consensusRules: [
      "Difficulty target must match consensus retarget formula at boundaries.",
      "Header PoW validation uses current target for each block.",
    ],
    policyVsConsensusExplanation:
      "Consensus enforces exact target computation and validity; policy and operations determine monitoring and response to abnormal timing conditions.",
    caseStudies: [
      {
        title: "Timewarp Discussions",
        year: 2012,
        summary:
          "Research and mailing-list threads explored timestamp games that could distort historical retarget behavior under coordination.",
      },
    ],
    explorerDeepLinks: [
      { label: "Difficulty chart", url: "https://mempool.space/graphs/mining/difficulty-adjustment" },
      { label: "Hashrate chart", url: "https://mempool.space/graphs/mining/hashrate-difficulty" },
    ],
    claimSources: [
      {
        claim: "Bitcoin adjusts difficulty every 2016 blocks.",
        sources: [
          {
            title: "Developer block chain reference",
            url: "https://developer.bitcoin.org/reference/block_chain.html#target-nbits",
            type: "dev-guide",
          },
          { title: "Bitcoin Wiki Difficulty", url: "https://en.bitcoin.it/wiki/Difficulty", type: "reference" },
        ],
      },
      {
        claim: "Retargeting is consensus-critical and validated by full nodes.",
        sources: [
          {
            title: "Bitcoin Core pow.cpp",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp",
            type: "core-docs",
          },
          {
            title: "Bitcoin Core validation logic",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp",
            type: "core-docs",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "pow.cpp source", url: "https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp" },
      {
        title: "bitcoin-dev timestamp discussions",
        url: "https://lists.linuxfoundation.org/pipermail/bitcoin-dev/",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "consensus-rules-vs-policy",
    title: "Consensus Rules vs Policy",
    type: "rule",
    difficulty: 2,
    canonicalLesson: "consensus",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Consensus decides what is valid chain history; policy decides what a node relays or mines before confirmation.",
    story:
      "Two nodes can disagree on relay behavior and still remain on one chain. That is the policy-versus-consensus boundary. Consensus rules are hard requirements: if you violate them, blocks are invalid everywhere. Policy rules are local preferences used for mempool hygiene, spam resistance, and fee optimization. This distinction is foundational for newcomers because many debates confuse relay preferences with protocol validity. Raw Block surfaces this explicitly so users can reason about RBF, standardness, and fee filters without mistaking them for consensus changes. Understanding the boundary also clarifies why Bitcoin upgrades are conservative: consensus changes require broad coordination, while policy refinements can iterate faster and independently.",
    deepDive: [
      {
        heading: "Consensus scope",
        bullets: [
          "Defines valid block format, script execution, subsidy bounds, and UTXO spend rules.",
          "Violations trigger block rejection and potential chain splits.",
          "Consensus changes require coordinated protocol rollout and broad adoption.",
        ],
      },
      {
        heading: "Policy scope",
        bullets: [
          "Controls relay admission, replacement handling, and standardness templates.",
          "Policy diversity across nodes is expected and non-forking.",
          "Miners may override default policy in block template decisions.",
        ],
      },
    ],
    keyTakeaways: [
      "Consensus invalidity is global; policy rejection is local.",
      "Policy helps protect resources without redefining money rules.",
      "Do not infer consensus from mempool behavior alone.",
    ],
    realData: [
      {
        key: "feeFast",
        label: "Relay Pressure Signal",
        description: "High recommended fees typically indicate stricter practical relay conditions.",
        display: "sat/vB",
      },
      {
        key: "lastUpdated",
        label: "Policy Snapshot Time",
        description: "Timestamp for the latest fetched fee/policy context.",
        display: "ISO local timestamp",
      },
    ],
    securityNotes: [
      "Conflating policy and consensus can cause serious operator misconfigurations.",
      "Consensus bugs are systemic; policy bugs are usually local and recoverable.",
    ],
    linkedVulnerabilities: ["cve-2018-17144", "cve-2013-2292"],
    linkedAttacks: ["double-spend"],
    linkedAssumptions: ["independent-validation-assumption"],
    policyRules: [
      "Standardness filtering of uncommon scripts in default relay settings.",
      "Minimum relay fee and RBF policy affect mempool admission and replacement.",
    ],
    consensusRules: [
      "Script validity and UTXO constraints define transaction acceptability in blocks.",
      "Block structural rules and proof-of-work target checks are mandatory.",
    ],
    policyVsConsensusExplanation:
      "Policy is a pre-consensus admission layer; consensus is the final and universal validity layer.",
    caseStudies: [
      {
        title: "CVE-2018-17144",
        year: 2018,
        summary:
          "Consensus validation regression demonstrated systemic risk when core validity checks fail.",
      },
    ],
    explorerDeepLinks: [
      {
        label: "Mempool policy docs",
        url: "https://github.com/bitcoin/bitcoin/tree/master/doc/policy",
      },
      {
        label: "RBF policy doc",
        url: "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/mempool-replacements.md",
      },
    ],
    claimSources: [
      {
        claim: "Consensus and policy are separate enforcement layers in Bitcoin Core.",
        sources: [
          {
            title: "consensus.h",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h",
            type: "core-docs",
          },
          {
            title: "policy.h",
            url: "https://github.com/bitcoin/bitcoin/blob/master/src/policy/policy.h",
            type: "core-docs",
          },
        ],
      },
      {
        claim: "RBF and relay replacement behavior are policy-level mechanisms.",
        sources: [
          {
            title: "Mempool replacements",
            url: "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/mempool-replacements.md",
            type: "core-docs",
          },
          {
            title: "BIP 125",
            url: "https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki",
            type: "BIP",
          },
        ],
      },
    ],
    furtherReading: [
      {
        title: "Policy docs",
        url: "https://github.com/bitcoin/bitcoin/tree/master/doc/policy",
      },
      { title: "Validation source", url: "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "pseudonymity-not-anonymity",
    title: "Pseudonymity, Not Anonymity",
    type: "property",
    difficulty: 1,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Bitcoin transactions are public and analyzable; addresses are pseudonyms, not identity-proof anonymity.",
    story:
      "A first-time user hears that Bitcoin is anonymous, then gets surprised when blockchain explorers show every transfer path. The right mental model is pseudonymity. Addresses do not contain legal names, but transaction graphs are public forever, and clustering techniques can link activity patterns to entities. This matters for security, compliance, and personal privacy hygiene. Reused addresses, deterministic withdrawal patterns, and careless consolidation all increase traceability. Raw Block teaches this early so users make better operational choices: rotate receive addresses, understand change outputs, and avoid false assumptions about invisibility. Privacy on Bitcoin is an engineering discipline, not a default guarantee.",
    deepDive: [
      {
        heading: "Visibility model",
        bullets: [
          "All confirmed transactions are publicly inspectable by anyone.",
          "Address graphs can be clustered using heuristics and external metadata.",
          "Off-chain identity leaks can deanonymize on-chain patterns.",
        ],
      },
      {
        heading: "Practical hygiene",
        bullets: [
          "Use new receive addresses for each payment flow.",
          "Treat consolidation transactions as privacy-sensitive events.",
          "Understand exchange KYC linkage before assuming plausible deniability.",
        ],
      },
    ],
    keyTakeaways: [
      "Bitcoin is pseudonymous, not anonymous.",
      "Address reuse weakens privacy significantly.",
      "Privacy outcome depends on behavior, tooling, and counterparties.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Current Ledger Context",
        description: "Public chain continuity means historical traceability persists across heights.",
        display: "Height",
      },
      {
        key: "lastUpdated",
        label: "Analytics Snapshot",
        description: "Timestamp for latest public-network context visible in Raw Block.",
        display: "Date/time",
      },
    ],
    securityNotes: [
      "Address reuse and deterministic withdrawals are common forensic linking vectors.",
      "Public mempool observation can leak timing and origin patterns.",
    ],
    linkedVulnerabilities: [],
    linkedAttacks: ["eclipse-attack"],
    linkedAssumptions: ["network-topology-assumption"],
    policyRules: [
      "Default wallet and exchange policies influence privacy outcomes in practice.",
      "Policy-level metadata retention can amplify on-chain attribution risk.",
    ],
    consensusRules: [
      "Consensus records transaction graph publicly and immutably once confirmed.",
      "Consensus does not encode user identity data fields.",
    ],
    policyVsConsensusExplanation:
      "Consensus makes transaction data public; privacy outcomes are shaped by policy and behavior on top of that public base.",
    caseStudies: [
      {
        title: "Address Clustering Research",
        year: 2013,
        summary:
          "Academic work demonstrated large-scale linkage of addresses and entities using graph heuristics.",
      },
    ],
    explorerDeepLinks: [
      { label: "Address explorer", url: "https://mempool.space/address/bc1qq6hag67dl53wl99vzg42z8eyzfz2xlkv44mqgc" },
      { label: "Transaction graph example", url: "https://mempool.space/tx/4d8f0f9f8adf4f8c6a9d663ccf71fa5f3f8ce5265d8f95dc9ec03bd3f5d5e287" },
    ],
    claimSources: [
      {
        claim: "Bitcoin transaction data is public and traceable.",
        sources: [
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
          { title: "Bitcoin Wiki Privacy", url: "https://en.bitcoin.it/wiki/Privacy", type: "reference" },
        ],
      },
      {
        claim: "Address clustering can infer ownership relationships.",
        sources: [
          {
            title: "Meiklejohn et al.",
            url: "https://www.usenix.org/system/files/conference/imc13/imc13-meiklejohn.pdf",
            type: "reference",
          },
          {
            title: "Developer Guide Wallet Privacy",
            url: "https://developer.bitcoin.org/devguide/wallets.html",
            type: "dev-guide",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "Bitcoin Wiki Privacy", url: "https://en.bitcoin.it/wiki/Privacy" },
      {
        title: "Address reuse guidance",
        url: "https://en.bitcoin.it/wiki/Address_reuse",
      },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "wallets-hold-keys-not-coins",
    title: "Wallets Hold Keys, Not Coins",
    type: "mechanism",
    difficulty: 1,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Wallet software manages private keys and signing policy; the bitcoin itself remains on-chain as spendable outputs.",
    story:
      "A user loses a phone and panics that their bitcoin is gone with it. The crucial correction is that coins are never inside the device. The wallet stores secrets and metadata that prove spending authority over on-chain outputs. If keys are backed up safely, funds remain recoverable from any compatible software. If keys are leaked, an attacker can spend regardless of the original app. This framing changes behavior: users prioritize seed backup integrity, hardware isolation, and transaction verification. Raw Block reinforces the operational model so learners separate UI convenience from true custody security.",
    deepDive: [
      {
        heading: "Custody model",
        bullets: [
          "Private keys and descriptors define spend authority, not coin location.",
          "Seed phrase backup quality determines recovery safety.",
          "Multisig policies distribute compromise risk across devices/parties.",
        ],
      },
      {
        heading: "Failure modes",
        bullets: [
          "Phishing and clipboard malware can redirect signed payouts.",
          "Unverified recovery flows can expose seed phrases to attackers.",
          "Address mismatch during send flow is a common human-layer risk.",
        ],
      },
    ],
    keyTakeaways: [
      "Wallets are key managers, not coin containers.",
      "Backups and key isolation are primary security controls.",
      "Spending authority follows keys, not devices.",
    ],
    realData: [
      {
        key: "lastUpdated",
        label: "Wallet Safety Snapshot",
        description: "Timestamp indicating freshness of network context for key-management decisions.",
        display: "Date/time",
      },
      {
        key: "feeHour",
        label: "Consolidation Fee Context",
        description: "Useful for planning secure wallet maintenance transactions.",
        display: "sat/vB",
      },
    ],
    securityNotes: [
      "Seed phrase exposure is equivalent to full custody loss.",
      "Hardware signing and verification screens reduce malware risk.",
    ],
    linkedVulnerabilities: [],
    linkedAttacks: ["address-reuse"],
    linkedAssumptions: ["independent-validation-assumption"],
    policyRules: [
      "Wallet defaults (change handling, RBF flags, consolidation timing) are policy-level choices.",
      "Custodial withdrawal policy can expose behavioral fingerprints.",
    ],
    consensusRules: [
      "Only valid signatures/scripts unlock spending conditions.",
      "Consensus tracks outputs and spend status independent of wallet app state.",
    ],
    policyVsConsensusExplanation:
      "Consensus decides whether a signed spend is valid; wallet policy decides how and when signatures are produced.",
    caseStudies: [
      {
        title: "Exchange Withdrawal Clustering",
        year: 2021,
        summary:
          "Operational wallet policies at exchanges often create identifiable transaction patterns.",
      },
    ],
    explorerDeepLinks: [
      { label: "Wallet guide", url: "https://developer.bitcoin.org/devguide/wallets.html" },
      { label: "Raw Block Key Lab", url: "https://www.rawblock.net/lab/keys" },
    ],
    claimSources: [
      {
        claim: "Wallets manage private keys that control UTXOs.",
        sources: [
          {
            title: "Developer Guide Wallets",
            url: "https://developer.bitcoin.org/devguide/wallets.html",
            type: "dev-guide",
          },
          {
            title: "BIP 32",
            url: "https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki",
            type: "BIP",
          },
        ],
      },
      {
        claim: "Loss of keys, not app binaries, determines custody loss.",
        sources: [
          {
            title: "BIP 39",
            url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",
            type: "BIP",
          },
          {
            title: "Bitcoin Optech wallet guidance",
            url: "https://bitcoinops.org/en/topics/wallets/",
            type: "reference",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "BIP 32", url: "https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki" },
      { title: "BIP 39", url: "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "address-vs-public-key",
    title: "Address vs Public Key",
    type: "primitive",
    difficulty: 2,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "Addresses are encoded script destinations, while public keys are cryptographic primitives used for signature verification.",
    story:
      "A beginner copies an address and assumes it is the same thing as a public key. In legacy and modern script types, that shortcut fails. Addresses are human-friendly encodings of script templates or key hashes. Public keys are cryptographic points used in signature checks. With SegWit and Taproot, this distinction became even more important because address formats signal spending semantics and checksum protections. Getting this right helps users avoid compatibility mistakes, understand why some outputs reveal keys only at spend time, and appreciate why address parsing is not just cosmetic formatting.",
    deepDive: [
      {
        heading: "Encoding layers",
        bullets: [
          "Base58 and Bech32/Bech32m encode destination data with checksums.",
          "Addresses often represent hashes or scripts, not raw public keys.",
          "Output type determines witness structure and spending path behavior.",
        ],
      },
      {
        heading: "Security implications",
        bullets: [
          "Address checksum failures catch many copy/paste errors.",
          "Misinterpreting address type can cause wallet interoperability issues.",
          "Taproot key-path and script-path semantics require correct bech32m handling.",
        ],
      },
    ],
    keyTakeaways: [
      "Address != public key in modern Bitcoin usage.",
      "Address format conveys script semantics and checksum model.",
      "SegWit/Taproot upgrades changed destination encoding expectations.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Current Format Epoch",
        description: "Height context for modern address adoption patterns.",
        display: "Height",
      },
      {
        key: "lastUpdated",
        label: "Address Parsing Snapshot",
        description: "Timestamp for latest protocol-state context shown in Raw Block.",
        display: "Date/time",
      },
    ],
    securityNotes: [
      "Checksum validation reduces accidental address corruption.",
      "Type confusion can lead to failed sends or incompatible spend scripts.",
    ],
    linkedVulnerabilities: ["malleability-pre-segwit"],
    linkedAttacks: [],
    linkedAssumptions: ["sha256-preimage-resistance-assumption"],
    policyRules: [
      "Wallet policy may restrict unsupported address/script templates.",
      "Exchange policy can limit withdrawals to selected destination types.",
    ],
    consensusRules: [
      "Consensus validates script execution regardless of user-facing address label.",
      "Witness and script rules enforce spend-path correctness per output type.",
    ],
    policyVsConsensusExplanation:
      "Consensus validates scripts and signatures; policy/UI layers map user-readable addresses to those consensus objects.",
    caseStudies: [
      {
        title: "Bech32m Deployment for Taproot",
        year: 2021,
        summary:
          "Address parsing updates were required to safely support Taproot outputs and avoid accidental send failures.",
      },
    ],
    explorerDeepLinks: [
      { label: "Address format reference", url: "https://en.bitcoin.it/wiki/Bech32" },
      { label: "Raw Block Decoder", url: "https://www.rawblock.net/explorer/decoder" },
    ],
    claimSources: [
      {
        claim: "Bech32 and bech32m define modern address encodings for SegWit and Taproot.",
        sources: [
          { title: "BIP 173", url: "https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki", type: "BIP" },
          { title: "BIP 350", url: "https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki", type: "BIP" },
        ],
      },
      {
        claim: "Addresses encode script destinations and are not always raw public keys.",
        sources: [
          {
            title: "Developer Guide Addresses",
            url: "https://developer.bitcoin.org/devguide/transactions.html#p2pkh-script-validation",
            type: "dev-guide",
          },
          {
            title: "Bitcoin Wiki technical background",
            url: "https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses",
            type: "reference",
          },
        ],
      },
    ],
    furtherReading: [
      { title: "BIP 173", url: "https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki" },
      { title: "BIP 350", url: "https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "lightning-network-maturity",
    title: "Lightning Network Maturity",
    type: "mechanism",
    difficulty: 2,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations", "lightning-primer"],
    summary:
      "Lightning is a production-ready Bitcoin Layer 2 optimized for fast low-fee payments, with operational security trade-offs versus base-layer settlement.",
    story:
      "Early Lightning discussions called the network experimental. Today, the operational picture is different: major exchanges and payment processors route meaningful traffic over Lightning for speed and cost efficiency. Users now expect instant settlement-like UX for small and medium transfers, while still relying on base-layer Bitcoin for final settlement guarantees and very large value movement. The maturity shift is not about removing trade-offs; it is about understanding them. Channel liquidity, routing reliability, and watchtower support matter for safe use. Raw Block presents Lightning as production-ready infrastructure that continues to evolve, not as a hypothetical future experiment.",
    deepDive: [
      {
        heading: "Why Lightning now",
        bullets: [
          "Off-chain channels reduce on-chain footprint for repeated payment flows.",
          "Routing network maturity enables practical merchant and exchange usage.",
          "Operational tooling improved channel monitoring and mobile reliability.",
        ],
      },
      {
        heading: "Security trade-offs",
        bullets: [
          "Users trade immediate base-layer finality for speed and cost.",
          "Watchtowers and healthy channel management reduce penalty-risk exposure.",
          "Large strategic settlements may still prefer direct on-chain confirmation depth.",
        ],
      },
    ],
    keyTakeaways: [
      "Lightning is production-ready, not merely experimental.",
      "Best fit: high-frequency small/medium payments.",
      "Use watchtowers and liquidity management for safer operations.",
    ],
    realData: [
      {
        key: "feeFast",
        label: "On-chain Fast Fee",
        description: "Base-layer fee context helps users compare direct settlement vs channel usage.",
        display: "sat/vB",
      },
      {
        key: "feeHour",
        label: "On-chain Economy Fee",
        description: "Shows cost differential that often motivates Lightning usage.",
        display: "sat/vB",
      },
    ],
    securityNotes: [
      "Channel counterparties and routing paths introduce liquidity and online-availability constraints.",
      "Watchtower services mitigate monitoring requirements for offline users.",
    ],
    linkedVulnerabilities: [],
    linkedAttacks: ["fee-sniping"],
    linkedAssumptions: ["network-topology-assumption"],
    policyRules: [
      "Routing, fee policy, and channel open/close strategy are implementation-level policy choices.",
      "Service providers may enforce inbound liquidity and channel minimums.",
    ],
    consensusRules: [
      "Lightning ultimately settles via valid Bitcoin transactions under layer-1 consensus.",
      "Penalty and timeout transactions depend on base-layer script validity.",
    ],
    policyVsConsensusExplanation:
      "Lightning operations are policy-rich at layer 2 but inherit final validity and dispute resolution from Bitcoin consensus.",
    caseStudies: [
      {
        title: "Exchange Lightning Integrations 2023-2025",
        year: 2025,
        summary:
          "Major exchanges added Lightning support, shifting usage from niche experimentation to mainstream payment rail.",
      },
    ],
    explorerDeepLinks: [
      { label: "Lightning channels map", url: "https://mempool.space/lightning" },
      { label: "BOLTs spec", url: "https://github.com/lightning/bolts" },
    ],
    claimSources: [
      {
        claim: "Lightning is broadly deployed for real-world payments by major exchanges/providers.",
        sources: [
          { title: "Coinbase Lightning launch", url: "https://www.coinbase.com/blog/lightning-payments-now-available-on-coinbase", type: "reference" },
          { title: "Kraken Lightning support", url: "https://support.kraken.com/hc/en-us/articles/5068216131988-Lightning-Network-on-Kraken", type: "reference" },
        ],
      },
      {
        claim: "Lightning security depends on channel monitoring and timelocked dispute mechanisms.",
        sources: [
          { title: "Lightning BOLTs", url: "https://github.com/lightning/bolts", type: "reference" },
          { title: "BIP 65 CHECKLOCKTIMEVERIFY", url: "https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki", type: "BIP" },
        ],
      },
    ],
    furtherReading: [
      { title: "Lightning BOLTs", url: "https://github.com/lightning/bolts" },
      { title: "Mastering Lightning", url: "https://github.com/lnbook/lnbook" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "segwit-and-taproot-upgrades",
    title: "SegWit and Taproot Upgrades",
    type: "upgrade",
    difficulty: 2,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["bitcoin-foundations"],
    summary:
      "SegWit and Taproot are major soft-fork upgrades that improved malleability resistance, efficiency, and script/signature flexibility.",
    story:
      "Protocol evolution in Bitcoin is slow by design. SegWit in 2017 and Taproot in 2021 are examples of cautious upgrades that changed capability without breaking core monetary guarantees. SegWit separated witness data and fixed key malleability issues that blocked robust second-layer designs. Taproot added Schnorr signatures and more efficient spend paths, improving privacy and multisig ergonomics in common cases. For learners, the key insight is that Bitcoin does evolve, but through conservative review, soft-fork deployment, and broad ecosystem coordination. Raw Block frames upgrades as continuity work: strengthen foundations while preserving backward compatibility and rule integrity.",
    deepDive: [
      {
        heading: "SegWit impact",
        bullets: [
          "Reduced malleability surface for txid-dependent protocols.",
          "Weight accounting improved effective block capacity management.",
          "Enabled more robust Lightning transaction design.",
        ],
      },
      {
        heading: "Taproot impact",
        bullets: [
          "Schnorr signatures improved multisig key aggregation options.",
          "Key-path spends make common scripts look simpler on chain.",
          "Tapscript expanded future script-upgrade flexibility.",
        ],
      },
    ],
    keyTakeaways: [
      "Bitcoin upgrades are conservative and compatibility-focused.",
      "SegWit and Taproot each addressed real technical constraints.",
      "Upgrade adoption is observable in live chain data.",
    ],
    realData: [
      {
        key: "blockHeight",
        label: "Upgrade Era Height",
        description: "Provides context for post-SegWit and post-Taproot adoption windows.",
        display: "Height",
      },
      {
        key: "lastUpdated",
        label: "Adoption Snapshot Time",
        description: "Timestamp for currently displayed network context.",
        display: "Date/time",
      },
    ],
    securityNotes: [
      "Soft-fork activation requires careful deployment and ecosystem readiness.",
      "Misinterpreting witness/tapscript semantics can create wallet implementation bugs.",
    ],
    linkedVulnerabilities: ["malleability-pre-segwit"],
    linkedAttacks: [],
    linkedAssumptions: ["sha256-preimage-resistance-assumption"],
    policyRules: [
      "Node policy can influence relay of newer script forms during early adoption phases.",
      "Wallet policy governs whether new output types are used by default.",
    ],
    consensusRules: [
      "SegWit witness rules and Taproot script rules are consensus-validated once activated.",
      "Activation preserved backward compatibility through soft-fork constraints.",
    ],
    policyVsConsensusExplanation:
      "Activation and script validity are consensus matters; rollout defaults and wallet behavior are policy and product decisions.",
    caseStudies: [
      {
        title: "SegWit Activation",
        year: 2017,
        summary:
          "SegWit resolved transaction malleability blockers and introduced weight-based capacity accounting.",
      },
      {
        title: "Taproot Activation",
        year: 2021,
        summary:
          "Taproot introduced Schnorr signatures and script upgrades while preserving compatibility.",
      },
    ],
    explorerDeepLinks: [
      { label: "SegWit adoption chart", url: "https://mempool.space/graphs/bitcoin/segwit" },
      { label: "Taproot chart", url: "https://mempool.space/graphs/bitcoin/taproot" },
    ],
    claimSources: [
      {
        claim: "SegWit introduced witness separation and addressed malleability vectors.",
        sources: [
          { title: "BIP 141", url: "https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki", type: "BIP" },
          { title: "BIP 143", url: "https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki", type: "BIP" },
        ],
      },
      {
        claim: "Taproot introduced Schnorr signatures and tapscript semantics.",
        sources: [
          { title: "BIP 340", url: "https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki", type: "BIP" },
          { title: "BIP 341", url: "https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki", type: "BIP" },
        ],
      },
    ],
    furtherReading: [
      { title: "BIP 141", url: "https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki" },
      { title: "BIP 342", url: "https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "blocks",
    title: "Blocks (Lesson Anchor)",
    type: "primitive",
    difficulty: 1,
    canonicalLesson: "blocks",
    pathMappings: ["canonical-lessons"],
    summary: "Lesson anchor for block structure in the guided 8-step journey.",
    story:
      "This lesson anchor maps the guided home journey to the detailed concept node for blocks and headers. It keeps progression continuity while preserving deep protocol links.",
    deepDive: [
      { heading: "Anchor", bullets: ["Use blocks-and-headers for full detail.", "Maintains lesson identity for progress sync."] },
      { heading: "Navigation", bullets: ["Guided mode uses this lesson id.", "Academy routes to canonical concept content."] },
    ],
    keyTakeaways: ["Anchor node for progress mapping", "Use detailed node for full content", "No protocol divergence"],
    realData: [
      { key: "blockHeight", label: "Height", description: "Current height", display: "int" },
      { key: "lastUpdated", label: "Updated", description: "snapshot time", display: "time" },
    ],
    securityNotes: ["Anchor only", "See blocks-and-headers for substantive security details"],
    linkedVulnerabilities: [],
    linkedAttacks: [],
    linkedAssumptions: [],
    policyRules: ["Anchor uses guided-mode policy mapping for stable progression."],
    consensusRules: ["Anchor references consensus content in blocks-and-headers node."],
    policyVsConsensusExplanation: "This anchor delegates full policy-versus-consensus detail to its mapped concept node.",
    caseStudies: [{ title: "Anchor", year: 2026, summary: "Anchor mapping for lesson continuity." }],
    explorerDeepLinks: [{ label: "Blocks", url: "https://mempool.space/blocks" }],
    claimSources: [
      {
        claim: "Lesson anchors keep progress aligned with concept graph.",
        sources: [
          { title: "Raw Block path engine", url: "https://www.rawblock.net/academy", type: "reference" },
          { title: "Raw Block guided mode", url: "https://www.rawblock.net/", type: "reference" },
        ],
      },
      {
        claim: "Detailed block mechanics live in blocks-and-headers node.",
        sources: [
          { title: "Developer block reference", url: "https://developer.bitcoin.org/reference/block_chain.html", type: "dev-guide" },
          { title: "Bitcoin whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
        ],
      },
    ],
    furtherReading: [
      { title: "Academy", url: "https://www.rawblock.net/academy" },
      { title: "Blocks", url: "https://mempool.space/blocks" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "mining",
    title: "Mining (Lesson Anchor)",
    type: "mechanism",
    difficulty: 1,
    canonicalLesson: "mining",
    pathMappings: ["canonical-lessons"],
    summary: "Lesson anchor for mining in guided mode, mapped to mining-and-subsidy concept content.",
    story:
      "This lesson anchor exists for clean lesson indexing in the home journey while detailed theory and case studies remain in mining-and-subsidy.",
    deepDive: [
      { heading: "Anchor", bullets: ["Use mining-and-subsidy for protocol depth.", "Keeps home progress stable."] },
      { heading: "Navigation", bullets: ["Anchor maps lesson id to concept id.", "Prevents breaking older progress keys."] },
    ],
    keyTakeaways: ["Anchor node", "Full content in concept node", "Progress-safe mapping"],
    realData: [
      { key: "hashrateEh", label: "Hashrate", description: "Current hashrate", display: "EH/s" },
      { key: "blocksUntilHalving", label: "Blocks to halving", description: "Epoch countdown", display: "count" },
    ],
    securityNotes: ["Anchor only", "See mining-and-subsidy for details"],
    linkedVulnerabilities: [],
    linkedAttacks: [],
    linkedAssumptions: [],
    policyRules: ["Anchor preserves mining lesson policy mapping in guided mode."],
    consensusRules: ["Anchor references consensus constraints in mining-and-subsidy content."],
    policyVsConsensusExplanation: "This anchor delegates protocol distinctions to the mapped mining concept node.",
    caseStudies: [{ title: "Anchor", year: 2026, summary: "Lesson mapping support." }],
    explorerDeepLinks: [{ label: "Mining", url: "https://mempool.space/mining" }],
    claimSources: [
      {
        claim: "Lesson anchors maintain progression continuity.",
        sources: [
          { title: "Raw Block home", url: "https://www.rawblock.net/", type: "reference" },
          { title: "Raw Block paths", url: "https://www.rawblock.net/paths/bitcoin-foundations", type: "reference" },
        ],
      },
      {
        claim: "Mining details are available in mapped concept node.",
        sources: [
          { title: "Developer PoW guide", url: "https://developer.bitcoin.org/devguide/block_chain.html", type: "dev-guide" },
          { title: "Bitcoin whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
        ],
      },
    ],
    furtherReading: [
      { title: "Raw Block mining simulator", url: "https://www.rawblock.net/game/mining" },
      { title: "Mempool mining dashboard", url: "https://mempool.space/mining" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "difficulty",
    title: "Difficulty (Lesson Anchor)",
    type: "rule",
    difficulty: 1,
    canonicalLesson: "difficulty",
    pathMappings: ["canonical-lessons"],
    summary: "Lesson anchor for difficulty, mapped to difficulty-adjustment-2016 content.",
    story:
      "The lesson anchor keeps the guided journey simple while the concept node delivers rigorous retarget details and incident context.",
    deepDive: [
      { heading: "Anchor", bullets: ["Detailed content in difficulty-adjustment-2016.", "Guided mode compatibility preserved."] },
      { heading: "Continuity", bullets: ["Stable lesson key for local progress.", "Avoids migration friction for users."] },
    ],
    keyTakeaways: ["Anchor node", "Maps to full concept", "Progress-friendly id"],
    realData: [
      { key: "hashrateEh", label: "Hashrate", description: "retarget context", display: "EH/s" },
      { key: "blockHeight", label: "Height", description: "epoch context", display: "count" },
    ],
    securityNotes: ["Anchor only", "See mapped concept for details"],
    linkedVulnerabilities: [],
    linkedAttacks: [],
    linkedAssumptions: [],
    policyRules: ["Anchor preserves difficulty lesson policy mapping for progression."],
    consensusRules: ["Anchor references consensus retarget logic in mapped concept."],
    policyVsConsensusExplanation: "This anchor delegates full policy-versus-consensus treatment to difficulty-adjustment content.",
    caseStudies: [{ title: "Anchor", year: 2026, summary: "Lesson mapping support." }],
    explorerDeepLinks: [{ label: "Difficulty graph", url: "https://mempool.space/graphs/mining/difficulty-adjustment" }],
    claimSources: [
      {
        claim: "Lesson anchors provide stable progression keys.",
        sources: [
          { title: "Raw Block home", url: "https://www.rawblock.net/", type: "reference" },
          { title: "Raw Block academy", url: "https://www.rawblock.net/academy", type: "reference" },
        ],
      },
      {
        claim: "Difficulty concept details remain in dedicated concept node.",
        sources: [
          { title: "Bitcoin Wiki Difficulty", url: "https://en.bitcoin.it/wiki/Difficulty", type: "reference" },
          { title: "pow.cpp", url: "https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp", type: "core-docs" },
        ],
      },
    ],
    furtherReading: [
      { title: "Difficulty wiki", url: "https://en.bitcoin.it/wiki/Difficulty" },
      { title: "pow.cpp", url: "https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "consensus",
    title: "Consensus (Lesson Anchor)",
    type: "rule",
    difficulty: 1,
    canonicalLesson: "consensus",
    pathMappings: ["canonical-lessons"],
    summary: "Lesson anchor for consensus, mapped to consensus-rules-vs-policy detailed content.",
    story:
      "This anchor keeps guided lesson semantics simple and stable, while deep consensus-policy distinctions live in the dedicated concept node.",
    deepDive: [
      { heading: "Anchor", bullets: ["Map to consensus-rules-vs-policy.", "Retains stable lesson id."] },
      { heading: "Experience", bullets: ["Home journey stays linear.", "Academy retains technical depth."] },
    ],
    keyTakeaways: ["Anchor node", "Detailed content elsewhere", "Progress-stable"],
    realData: [
      { key: "feeFast", label: "Policy pressure", description: "relay context", display: "sat/vB" },
      { key: "lastUpdated", label: "snapshot", description: "timestamp", display: "time" },
    ],
    securityNotes: ["Anchor only", "See mapped concept for details"],
    linkedVulnerabilities: [],
    linkedAttacks: [],
    linkedAssumptions: [],
    policyRules: ["Anchor keeps consensus lesson policy linkage stable."],
    consensusRules: ["Anchor references consensus-rule detail in mapped concept content."],
    policyVsConsensusExplanation: "This anchor delegates operational distinction detail to consensus-rules-vs-policy node.",
    caseStudies: [{ title: "Anchor", year: 2026, summary: "Lesson mapping support." }],
    explorerDeepLinks: [{ label: "Policy docs", url: "https://github.com/bitcoin/bitcoin/tree/master/doc/policy" }],
    claimSources: [
      {
        claim: "Anchors keep lesson ids stable in guided progression.",
        sources: [
          { title: "Raw Block home", url: "https://www.rawblock.net/", type: "reference" },
          { title: "Raw Block paths", url: "https://www.rawblock.net/paths/bitcoin-foundations", type: "reference" },
        ],
      },
      {
        claim: "Consensus-policy separation is handled in concept node.",
        sources: [
          { title: "consensus.h", url: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h", type: "core-docs" },
          { title: "policy.h", url: "https://github.com/bitcoin/bitcoin/blob/master/src/policy/policy.h", type: "core-docs" },
        ],
      },
    ],
    furtherReading: [
      { title: "consensus.h", url: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/consensus.h" },
      { title: "policy.h", url: "https://github.com/bitcoin/bitcoin/blob/master/src/policy/policy.h" },
    ],
    verifiedAt: "2026-02-12",
  },
  {
    id: "security-and-attacks",
    title: "Security and Attacks (Lesson Anchor)",
    type: "attack",
    difficulty: 2,
    canonicalLesson: "security-and-attacks",
    pathMappings: ["canonical-lessons"],
    summary: "Lesson anchor collecting the security module and linking to vulnerabilities, attacks, and assumptions research.",
    story:
      "The guided journey ends with security and attacks because this is where all prior topics converge. This anchor ties the lesson card to the deeper research stack so users can move from fundamentals to adversarial thinking without losing progress continuity.",
    deepDive: [
      {
        heading: "Coverage",
        bullets: [
          "Links to vulnerabilities registry, attack models, and assumption layers.",
          "Connects policy-vs-consensus framing to real incidents.",
        ],
      },
      {
        heading: "Goal",
        bullets: [
          "Help learners evaluate risk with protocol-native terminology.",
          "Bridge Academy concepts to research pages and historical case studies.",
        ],
      },
    ],
    keyTakeaways: [
      "Security learning is cumulative across all lessons.",
      "Research pages provide incident-level detail.",
      "Assumptions define what must remain true for security guarantees.",
    ],
    realData: [
      { key: "hashrateEh", label: "Hashrate", description: "attack-cost context", display: "EH/s" },
      { key: "feeFast", label: "Fee pressure", description: "mempool stress context", display: "sat/vB" },
    ],
    securityNotes: [
      "Threat analysis should separate capability, cost, and detectability.",
      "Defense posture depends on confirmation depth and operational controls.",
    ],
    linkedVulnerabilities: ["value-overflow-2010", "cve-2018-17144"],
    linkedAttacks: ["double-spend", "attack-51-percent", "selfish-mining"],
    linkedAssumptions: ["hashpower-majority-assumption", "independent-validation-assumption"],
    policyRules: [
      "Policy hardens mempool and relay behavior against abuse patterns.",
      "Policy misconfiguration can create local exposure without global fork risk.",
    ],
    consensusRules: [
      "Consensus bugs can threaten inflation safety or chain agreement.",
      "Consensus validation is the final security boundary for every full node.",
    ],
    policyVsConsensusExplanation:
      "Security incidents often start in policy or implementation layers but become systemic only when consensus integrity is affected.",
    caseStudies: [
      {
        title: "CVE-2018-17144",
        year: 2018,
        summary:
          "Critical inflation/consensus risk that reinforced the importance of rigorous release and review discipline.",
      },
    ],
    explorerDeepLinks: [
      { label: "Research vulnerabilities", url: "https://www.rawblock.net/research/vulnerabilities" },
      { label: "Research attacks", url: "https://www.rawblock.net/research/attacks" },
    ],
    claimSources: [
      {
        claim: "Bitcoin security relies on consensus integrity and economic attack cost.",
        sources: [
          { title: "Bitcoin Whitepaper", url: "https://bitcoin.org/bitcoin.pdf", type: "whitepaper" },
          { title: "Developer block chain guide", url: "https://developer.bitcoin.org/devguide/block_chain.html", type: "dev-guide" },
        ],
      },
      {
        claim: "Historical bugs and attacks inform modern hardening strategy.",
        sources: [
          { title: "CVE-2018-17144 notice", url: "https://bitcoincore.org/en/2018/09/20/notice/", type: "core-docs" },
          { title: "Bitcoin Optech topics", url: "https://bitcoinops.org/en/topics/", type: "reference" },
        ],
      },
    ],
    furtherReading: [
      { title: "Raw Block Research", url: "https://www.rawblock.net/research" },
      { title: "Bitcoin Ops Security Topics", url: "https://bitcoinops.org/en/topics/" },
    ],
    verifiedAt: "2026-02-12",
  },
];
