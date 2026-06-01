export type SeoFaqItem = { question: string; answer: string };
export type SeoLink = { href: string; label: string };

export type SeoPageContent = {
  h1: string;
  paragraphs: string[];
  faqs: SeoFaqItem[];
  relatedLinks: SeoLink[];
};

export type SeoPageKey =
  | "home"
  | "decoder"
  | "scriptLab"
  | "mempool"
  | "blocks"
  | "academy"
  | "about";

const EN: Record<SeoPageKey, SeoPageContent> = {
  home: {
    h1: "Bitcoin Explorer, Protocol Labs, and Research",
    paragraphs: [
      "Raw Block combines live mainnet telemetry with hands-on Bitcoin tooling so you can inspect blocks, mempool pressure, fees, and network health without running a local node.",
      "Use the transaction decoder and Script Lab to move from raw hex to consensus-level understanding, then follow Academy paths and research registries for structured learning.",
    ],
    faqs: [
      {
        question: "Do I need my own Bitcoin node to use Raw Block?",
        answer:
          "No. Explorer views use Raw Block infrastructure with transparent fallback labels when public telemetry is used for availability.",
      },
      {
        question: "What can I search from the home dashboard?",
        answer:
          "Enter a transaction ID, address, or block height/hash to route into the decoder or block inspector automatically.",
      },
    ],
    relatedLinks: [
      { href: "/explorer/decoder", label: "Transaction Decoder" },
      { href: "/explorer/mempool", label: "Live Mempool" },
      { href: "/lab/script", label: "Script Lab" },
      { href: "/academy", label: "Bitcoin Academy" },
    ],
  },
  decoder: {
    h1: "Bitcoin Transaction Decoder",
    paragraphs: [
      "Paste a txid, address, or raw transaction hex to inspect inputs, outputs, witness stacks, script disassembly, and fee economics in a readable layout.",
      "Privacy heuristics highlight common clustering patterns; always verify conclusions against your own node or independent analytics.",
    ],
    faqs: [
      {
        question: "Which formats does the decoder accept?",
        answer: "64-character txids, Bitcoin addresses (legacy, nested SegWit, bech32), and signed raw hex transactions.",
      },
      {
        question: "How is witness data shown for SegWit transactions?",
        answer:
          "Witness stacks are listed per input with opcode-level script traces where available, alongside the legacy scriptSig fields.",
      },
    ],
    relatedLinks: [
      { href: "/lab/script", label: "Script Lab" },
      { href: "/explorer/mempool", label: "Mempool Explorer" },
      { href: "/explorer/blocks", label: "Block Ledger" },
      { href: "/glossary/segwit", label: "SegWit glossary" },
    ],
  },
  scriptLab: {
    h1: "Bitcoin Script Lab and Debugger",
    paragraphs: [
      "Step through Bitcoin Script with a visual stack machine, opcode highlighting, and consensus trace presets for common locking patterns.",
      "Load scenarios for P2PKH, multisig, Taproot key-path spends, and custom scripts to see exactly where validation succeeds or fails.",
    ],
    faqs: [
      {
        question: "Does the Script Lab execute real mainnet transactions?",
        answer:
          "No. It interprets script snippets locally for education. Use the transaction decoder to inspect confirmed on-chain scripts.",
      },
      {
        question: "Can I paste my own script hex?",
        answer: "Yes. Enter hex or assembly-style script fragments and advance opcode-by-opcode through the stack trace.",
      },
    ],
    relatedLinks: [
      { href: "/explorer/decoder", label: "Transaction Decoder" },
      { href: "/lab/taproot", label: "Taproot Playground" },
      { href: "/lab/consensus", label: "Consensus Debugger" },
      { href: "/glossary/consensus-rules", label: "Consensus rules glossary" },
    ],
  },
  mempool: {
    h1: "Live Bitcoin Mempool Explorer",
    paragraphs: [
      "Watch unconfirmed transactions stream in with fee-rate bands, virtual size pressure, and timing cues that reflect how miners prioritize the next block.",
      "Pair mempool context with the block ledger and fee dashboards when estimating confirmation times or diagnosing congestion spikes.",
    ],
    faqs: [
      {
        question: "Why does mempool size differ between nodes?",
        answer:
          "Each full node maintains its own mempool subject to relay policy, feerate filters, and eviction rules. Raw Block shows a node-backed view with source labels.",
      },
      {
        question: "How often is mempool data refreshed?",
        answer: "Live views poll on a short interval; exact cadence depends on gateway availability and fallback mode.",
      },
    ],
    relatedLinks: [
      { href: "/explorer/fees", label: "Fee Estimates" },
      { href: "/explorer/blocks", label: "Recent Blocks" },
      { href: "/explorer/decoder", label: "Transaction Decoder" },
      { href: "/glossary/mempool", label: "Mempool glossary" },
    ],
  },
  blocks: {
    h1: "Bitcoin Block Explorer Ledger",
    paragraphs: [
      "Browse recent blocks with miner attribution, inter-block timing, and one-click drill-down into headers, coinbase traces, and transaction lists.",
      "Compare blocks side-by-side or open a specific height/hash to audit merkle structure and subsidy mechanics.",
    ],
    faqs: [
      {
        question: "How are miner labels assigned?",
        answer:
          "Pool tags are inferred from coinbase metadata and known templates in recent blocks, with Unknown shown when attribution is ambiguous.",
      },
      {
        question: "Can I open a block by height?",
        answer: "Yes. Use the block route with a numeric height or the 64-character block hash from the ledger.",
      },
    ],
    relatedLinks: [
      { href: "/explorer/decoder", label: "Transaction Decoder" },
      { href: "/explorer/miners", label: "Miner Forensics" },
      { href: "/explorer/mempool", label: "Mempool Feed" },
      { href: "/glossary/coinbase-transaction", label: "Coinbase glossary" },
    ],
  },
  academy: {
    h1: "Bitcoin Academy Learning Paths",
    paragraphs: [
      "Structured concept nodes connect blocks, transactions, mempool policy, mining incentives, and security models into guided journeys you can resume anytime.",
      "Each node links to live explorer modules and labs so theory maps directly to observable mainnet behavior.",
    ],
    faqs: [
      {
        question: "Is Academy content available in Spanish?",
        answer: "Yes. Toggle to /es/academy for mirrored research and academy nodes where translations exist.",
      },
      {
        question: "How are Academy nodes verified?",
        answer: "Nodes include verification timestamps and cross-links to primary protocol references where applicable.",
      },
    ],
    relatedLinks: [
      { href: "/paths/bitcoin-foundations", label: "Bitcoin Foundations path" },
      { href: "/research", label: "Research hub" },
      { href: "/lab/script", label: "Script Lab" },
      { href: "/glossary", label: "Protocol glossary" },
    ],
  },
  about: {
    h1: "About Raw Block — Data Sourcing and Trust",
    paragraphs: [
      "Raw Block is operated by an independent team publishing open-source frontend code and documenting every data path that feeds explorer and lab modules.",
      "Primary metrics come from self-hosted Bitcoin Core and indexer infrastructure; when fallbacks activate, the UI labels the upstream provider so you can judge freshness and trust.",
    ],
    faqs: [
      {
        question: "Where does block and mempool data originate?",
        answer:
          "From the Raw Block node gateway (Bitcoin Core + electrs rollout). Selected views may temporarily use public telemetry APIs during indexer maintenance.",
      },
      {
        question: "Is wallet or key material ever uploaded?",
        answer:
          "No. Browser labs operate on pasted scripts or public chain data. Never enter seeds or private keys into any web tool.",
      },
    ],
    relatedLinks: [
      { href: "/explorer/network", label: "Network Monitor" },
      { href: "/research", label: "Research Registries" },
      { href: "/blog", label: "Product updates" },
      { href: "https://github.com/leanlp/rawblock", label: "GitHub repository" },
    ],
  },
};

/** Spanish mirrors for pages with /es routes (Academy); others stay English on EN URLs. */
const ES_PARTIAL: Partial<Record<SeoPageKey, SeoPageContent>> = {
  academy: {
    h1: "Rutas de aprendizaje de la Academia Bitcoin",
    paragraphs: [
      "Nodos de concepto estructurados conectan bloques, transacciones, política de mempool, incentivos de minería y modelos de seguridad en recorridos guiados.",
      "Cada nodo enlaza módulos del explorador en vivo para relacionar la teoría con el comportamiento observable en mainnet.",
    ],
    faqs: [
      {
        question: "¿Hay contenido en español?",
        answer: "Sí. Visita /es/academy para nodos y rutas espejo donde existan traducciones.",
      },
      {
        question: "¿Cómo se verifican los nodos?",
        answer: "Los nodos incluyen marcas de verificación y referencias cruzadas a fuentes del protocolo.",
      },
    ],
    relatedLinks: [
      { href: "/es/paths/bitcoin-foundations", label: "Ruta Fundamentos de Bitcoin" },
      { href: "/es/research", label: "Investigación" },
      { href: "/lab/script", label: "Laboratorio Script" },
      { href: "/glossary", label: "Glosario" },
    ],
  },
};

export function getSeoPageContent(key: SeoPageKey, locale: "en" | "es" = "en"): SeoPageContent {
  if (locale === "es" && ES_PARTIAL[key]) {
    return ES_PARTIAL[key]!;
  }
  return EN[key];
}
