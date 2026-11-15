// Shared, isomorphic block types and normalizer.
//
// Used by BOTH the server-side reader (lib/block.server.ts) and the client
// explorer UI, so this module must stay dependency-free and pure — no Node
// APIs, no "use client", no env access. It ships in the client bundle.

export interface BlockTransactionData {
  txid: string;
  wtxid?: string;
  weight: number;
  vsize: number;
  size: number;
  fee: number;
  isSegwit: boolean;
}

export interface BlockData {
  hash: string;
  height: number;
  time: number;
  mediantime?: number;
  version?: number;
  bits?: string;
  nonce?: number;
  merkleroot?: string;
  previousblockhash?: string;
  size: number;
  weight: number;
  miner: string;
  txCount: number;
  reward: number;
  /** Coinbase txid (always the first transaction). */
  coinbaseTxid?: string;
  /**
   * Transactions present in this copy. A *partial* copy (e.g. the SSR
   * summary) carries a sample and has `transactions.length < txCount`;
   * every render path that needs the full list (Merkle, treemap) must
   * check that invariant before using the array.
   */
  transactions: BlockTransactionData[];
}

const HASH_RE = /^[0-9a-fA-F]{64}$/;
// 10 digits covers ~19,000 years of 10-minute blocks; anything longer is a
// hash candidate, not a height.
// Canonical decimal heights only: no leading zeros (`0123` is not a block id,
// so it 404s instead of fuzzy-matching block 123). 10 digits keeps validity
// past 100M height.
const HEIGHT_RE = /^(0|[1-9]\d{0,9})$/;

/** Block identifiers are either a decimal height or a 64-char hash. */
export function isHeightId(id: string): boolean {
  return HEIGHT_RE.test(id);
}

export function isBlockId(id: string): boolean {
  return isHeightId(id) || HASH_RE.test(id);
}

/**
 * Human display name for a block. The genesis block gets a proper name
 * instead of a bare height — it is the one block users and search engines
 * actually refer to by name ("bitcoin genesis block").
 */
export function blockDisplayName(height: number): string {
  return height === 1 ? "The Genesis Block" : `Block #${height}`;
}

function str(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function hex32(value: unknown): string | null {
  const s = str(value);
  return s && HASH_RE.test(s) ? s.toLowerCase() : null;
}

function num(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function optionalNum(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

/**
 * Defensively parses a raw node-gateway block payload into BlockData.
 * Returns null when the payload is missing the identity fields (hash + height)
 * that every rendering path relies on.
 */
export function normalizeBlock(raw: unknown): BlockData | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const fields = raw as Record<string, unknown>;

  const hash = hex32(fields.hash);
  const height = optionalNum(fields.height);
  if (!hash || typeof height !== "number" || !Number.isSafeInteger(height) || height < 0) return null;

  const transactions: BlockTransactionData[] = [];
  const rawTxs = Array.isArray(fields.transactions) ? fields.transactions : [];
  for (const row of rawTxs) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) continue;
    const f = row as Record<string, unknown>;
    const txid = hex32(f.txid);
    if (!txid) continue;
    transactions.push({
      txid,
      wtxid: hex32(f.wtxid) ?? undefined,
      weight: num(f.weight),
      vsize: num(f.vsize),
      size: num(f.size),
      fee: num(f.fee),
      isSegwit: f.isSegwit === true,
    });
  }

  const rawTxCount = optionalNum(fields.txCount);
  return {
    hash,
    height,
    time: num(fields.time),
    mediantime: optionalNum(fields.mediantime),
    version: optionalNum(fields.version),
    bits: str(fields.bits),
    nonce: optionalNum(fields.nonce),
    merkleroot: hex32(fields.merkleroot) ?? undefined,
    previousblockhash: hex32(fields.previousblockhash) ?? undefined,
    size: num(fields.size),
    weight: num(fields.weight),
    miner: str(fields.miner) ?? "Unknown",
    txCount: rawTxCount !== undefined && Number.isSafeInteger(rawTxCount)
      ? rawTxCount
      : transactions.length,
    reward: num(fields.reward),
    coinbaseTxid: transactions[0]?.txid,
    transactions,
  };
}

/**
 * Reduce a fully-normalized block to the compact shape the SSR page ships to
 * the client. Header facts are kept verbatim; the transaction list is capped
 * to `sample` entries so the initial HTML stays small. Consumers that need
 * the complete list (Merkle root, full treemap) must detect the partial copy
 * via `transactions.length < txCount` and re-fetch on the client.
 */
export function summarizeBlock(block: BlockData, sample = 10): BlockData {
  return {
    ...block,
    transactions: block.transactions.slice(0, sample),
  };
}
