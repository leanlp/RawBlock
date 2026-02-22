import { type GlossaryEntry } from "./glossary";

export const GLOSSARY_ES: Record<string, GlossaryEntry> = {
  utxo: {
    key: "utxo",
    term: "UTXO",
    aliases: ["utxo", "utxos", "salida de transacción no gastada"],
    definition: "Salida de Transacción No Gastada (Unspent Transaction Output). Una salida de bitcoin gastable creada por una transacción anterior.",
  },
  "proof-of-work": {
    key: "proof-of-work",
    term: "Prueba de Trabajo (PoW)",
    aliases: ["proof-of-work", "prueba de trabajo", "pow", "proof of work"],
    definition: "Mecanismo de consenso donde los mineros gastan poder de cómputo (hashpower) para encontrar bloques válidos por debajo del umbral objetivo.",
  },
  "coinbase-transaction": {
    key: "coinbase-transaction",
    term: "Transacción Coinbase",
    aliases: ["transacción coinbase", "coinbase", "transaccion coinbase"],
    definition: "La primera transacción en un bloque que paga el subsidio del bloque y las comisiones recaudadas al minero.",
  },
  "block-subsidy": {
    key: "block-subsidy",
    term: "Subsidio de Bloque",
    aliases: ["subsidio de bloque", "subsidio", "emisión"],
    definition: "Nueva emisión de bitcoin definida por el protocolo en cada bloque, la cual se reduce a la mitad (halving) cada 210,000 bloques.",
  },
  mempool: {
    key: "mempool",
    term: "Mempool",
    aliases: ["mempool", "memoria", "piscina de memoria"],
    definition: "Conjunto local del nodo de transacciones válidas y sin confirmar que esperan ser incluidas en un bloque.",
  },
  reorg: {
    key: "reorg",
    term: "Reorganización (Reorg)",
    aliases: ["reorg", "reorganización", "reorganizacion"],
    definition: "Reemplazo de la punta de la cadena cuando una rama competidora con más trabajo acumulado se convierte en la mejor cadena.",
  },
  segwit: {
    key: "segwit",
    term: "SegWit",
    aliases: ["segwit", "testigo segregado", "segregated witness"],
    definition: "Actualización de Bitcoin en 2017 que separa los datos de los testigos, corrigiendo vectores de maleabilidad de transacciones y mejorando la eficiencia de capacidad.",
  },
  taproot: {
    key: "taproot",
    term: "Taproot",
    aliases: ["taproot"],
    definition: "Bifurcación suave (soft fork) de Bitcoin en 2021 que añade firmas Schnorr y mejora la privacidad y eficiencia de las rutas de scripts.",
  },
  pseudonymity: {
    key: "pseudonymity",
    term: "Seudonimato",
    aliases: ["seudonimato", "seudónimo", "pseudonymity"],
    definition: "Las direcciones son identificadores públicos sin identidad legal incorporada, pero los flujos de transacciones siguen siendo rastreables públicamente.",
  },
  "consensus-rules": {
    key: "consensus-rules",
    term: "Reglas de Consenso",
    aliases: ["reglas de consenso", "consenso", "consensus"],
    definition: "Reglas de validación a nivel de red que cada nodo completo impone para determinar bloques y transacciones válidas.",
  },
  "block-header": {
    key: "block-header",
    term: "Cabecera de Bloque",
    aliases: ["cabecera de bloque", "cabecera", "block header"],
    definition: "Metadatos compactos del bloque que contienen el hash previo, la raíz merkle, la marca de tiempo, los nBits, el nonce y la versión.",
  },
  "lightning-network": {
    key: "lightning-network",
    term: "Lightning Network",
    aliases: ["lightning network", "lightning", "red lightning"],
    definition: "Red de pagos de Capa 2 de Bitcoin para pagos rápidos, enrutados y de baja comisión que se liquidan periódicamente en la cadena principal.",
  },
  "base-layer": {
    key: "base-layer",
    term: "Capa Base (L1)",
    aliases: ["capa base", "capa 1", "l1", "base layer"],
    definition: "La propia cadena de bloques (blockchain) de Bitcoin, optimizada para consenso global y liquidación final.",
  },
  "full-node": {
    key: "full-node",
    term: "Nodo Completo",
    aliases: ["nodo completo", "nodos completos", "nodo", "nodos", "full node"],
    definition: "Software que valida independientemente bloques y transacciones contra las reglas de consenso.",
  },
  miner: {
    key: "miner",
    term: "Minero",
    aliases: ["minero", "mineros", "minería", "miner"],
    definition: "Participante que ensambla bloques candidatos y realiza la prueba de trabajo para extender la cadena.",
  },
  "coinbase-payout": {
    key: "coinbase-payout",
    term: "Pago Coinbase",
    aliases: ["pago coinbase", "salida coinbase", "coinbase payout"],
    definition: "El primer conjunto de salidas de transacción en un bloque, que paga el subsidio del bloque más las comisiones de transacciones recaudadas.",
  },
};
