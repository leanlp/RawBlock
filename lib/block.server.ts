import { unstable_cache } from "next/cache";
import { getHeroGateway } from "@/lib/heroMetrics.server";
import { gatewayChallengeSuffix, rawblockServerHeaders } from "@/lib/rawblockGateway";
import { isBlockId, isHeightId, normalizeBlock, type BlockData } from "@/lib/block";

// Block facts are immutable once mined: a confirmed block's header, size,
// reward, and transaction list never change. Cache the gateway snapshot for
// a week per block instead of the 10-15s hero refresh cycle.
const BLOCK_CACHE_SECONDS = 7 * 24 * 60 * 60;
const BLOCK_FETCH_TIMEOUT_MS = 3_500;

// Latest chain height, used to 404 heights that cannot exist *before* the
// first byte streams (see the page's pre-check). Five-minute staleness is
// safe: mainnet heights are contiguous, so the page re-verifies with a fresh
// read before actually 404ing anything the cache might not know about.
const LATEST_HEIGHT_CACHE_SECONDS = 5 * 60;
const LATEST_HEIGHT_TIMEOUT_MS = 1_500;

export type BlockFetchResult =
  | { status: "ok"; block: BlockData }
  /** The gateway explicitly reported the block does not exist (HTTP 404). */
  | { status: "not-found" }
  /** Gateway unreachable, timed out, or returned an invalid payload. */
  | { status: "unavailable" };

/**
 * Resolves a block identifier (decimal height or 64-char hash) against the
 * node gateway.
 *
 * - `not-found` — malformed id, or the gateway answered 404 (block genuinely
 *   absent from the node). The page maps this to a real HTTP 404.
 * - `unavailable` — no gateway configured, or the read failed (transport
 *   error, 3.5 s timeout, or an invalid payload). The page degrades to the
 *   interactive client shell, which re-fetches; the page never 500s.
 *
 * The underlying gateway read is cached for 7 days: confirmed block facts are
 * immutable once mined.
 */
/**
 * Node-RPC error strings that mean "this block does not exist" (as opposed
 * to "the node is broken"). The gateway surfaces them as HTTP 500 with a
 * message like `Failed to fetch block: -5: Block not found` or
 * `-8: Block height out of range` — both are 404 territory for the page.
 */
const BLOCK_ABSENT_RE = /not found|no such|out of range|invalid (block|hash|height)/i;

/**
 * Reads one block from the node gateway. Returns null when the block is
 * provably absent; throws on transport errors, timeouts, and ambiguous
 * failures so the page degrades to the client shell instead of 404ing a
 * block that may exist.
 */
const readBlockFromGateway = unstable_cache(
  async (gateway: NonNullable<ReturnType<typeof getHeroGateway>>, id: string): Promise<BlockData | null> => {
    const isHeight = isHeightId(id);
    const path = isHeight ? `block/height/${id}` : `block/${id}`;
    const headers = new Headers(rawblockServerHeaders());
    if (gateway.authenticated) {
      headers.set("Authorization", `Bearer ${process.env.RAWBLOCK_HERO_API_TOKEN?.trim()}`);
    }
    const response = await fetch(`${gateway.base}/api/${path}`, {
      cache: "no-store",
      headers,
      redirect: gateway.authenticated ? "error" : "follow",
      signal: AbortSignal.timeout(BLOCK_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Distinguish "absent" from "broken" using the node's error text.
      const text = await response.text().catch(() => "");
      if (response.status === 404 || BLOCK_ABSENT_RE.test(text)) return null;
      throw new Error(`Block gateway HTTP ${response.status}${gatewayChallengeSuffix(response)}`);
    }

    const parsed = normalizeBlock(await response.json());
    if (!parsed) throw new Error("Invalid block payload from gateway");

    // The gateway fuzzy-matches some malformed ids (an all-zero hash returns
    // the genesis block with a 200). Never serve a block for an id it does
    // not literally satisfy: that would put the wrong block under the URL.
    if (isHeight ? String(parsed.height) !== id : parsed.hash !== id.toLowerCase()) {
      return null;
    }
    return parsed;
  },
  ["block-lookup-v1"],
  { revalidate: BLOCK_CACHE_SECONDS },
);

export async function getBlockById(rawId: string | undefined): Promise<BlockFetchResult> {
  const id = (rawId ?? "").trim();
  if (!id || !isBlockId(id)) return { status: "not-found" };

  const gateway = getHeroGateway();
  if (!gateway) return { status: "unavailable" };

  try {
    const block = await readBlockFromGateway(gateway, id);
    return block ? { status: "ok", block } : { status: "not-found" };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.warn("RawBlock block lookup unavailable", { id, detail });
    return { status: "unavailable" };
  }
}

/**
 * Reads the node's latest chain height (the `/api/network-stats` endpoint the
 * client already uses for its Prev/Next navigation).
 *
 * This is the pre-check that lets the block page 404 a future height *before*
 * it streams the page shell. The streamed-shell design means the HTTP status
 * is committed on the first byte, so any "this block cannot exist" decision
 * must be made ahead of it. Throws on any failure — callers must treat a
 * failed read as "cannot tell" (proceed to the block read) rather than as
 * "absent", so a gateway blip can never manufacture a false 404.
 */
async function readLatestHeight(
  gateway: NonNullable<ReturnType<typeof getHeroGateway>>,
): Promise<number> {
  const headers = new Headers(rawblockServerHeaders());
  if (gateway.authenticated) {
    headers.set("Authorization", `Bearer ${process.env.RAWBLOCK_HERO_API_TOKEN?.trim()}`);
  }
  const response = await fetch(`${gateway.base}/api/network-stats`, {
    cache: "no-store",
    headers,
    redirect: gateway.authenticated ? "error" : "follow",
    signal: AbortSignal.timeout(LATEST_HEIGHT_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Network stats HTTP ${response.status}${gatewayChallengeSuffix(response)}`);
  const data = (await response.json()) as { blocks?: unknown };
  const height = Number(data.blocks);
  if (!Number.isFinite(height) || height < 0) throw new Error("Invalid network-stats payload");
  return Math.floor(height);
}

/**
 * Cached latest height for the height pre-check. A block mined within the
 * last five minutes may look "future" against this value; the page re-verify
 * (see `getLatestHeightFresh`) covers that window.
 */
export const getLatestHeight = unstable_cache(
  readLatestHeight,
  ["latest-height-v1"],
  { revalidate: LATEST_HEIGHT_CACHE_SECONDS },
);

/**
 * Uncached re-verify for the pre-check's failure path: when the five-minute
 * cache says "future", one fresh read settles whether the height really is
 * above the tip. A failure here means "cannot tell" (the caller proceeds to
 * the block read) — never "absent".
 */
export const getLatestHeightFresh = (
  gateway: NonNullable<ReturnType<typeof getHeroGateway>>,
): Promise<number> => readLatestHeight(gateway);
