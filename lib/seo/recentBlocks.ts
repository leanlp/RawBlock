const MEMPOOL_API = "https://mempool.space/api";
const BLOCKSTREAM_API = "https://blockstream.info/api";

/** Max block height URLs included in the blocks sitemap (bounded for crawl budget). */
export const BLOCK_SITEMAP_MAX = 100;

/**
 * Resolves chain tip at build/request time and returns descending heights.
 * Falls back to an empty list when public tip APIs are unreachable (e.g. offline CI).
 */
export async function getRecentBlockHeights(max = BLOCK_SITEMAP_MAX): Promise<number[]> {
  let tip: number | null = null;

  try {
    const res = await fetch(`${MEMPOOL_API}/blocks/tip/height`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const parsed = Number.parseInt(await res.text(), 10);
      if (Number.isFinite(parsed)) tip = parsed;
    }
  } catch {
    // try blockstream
  }

  if (tip === null) {
    try {
      const res = await fetch(`${BLOCKSTREAM_API}/blocks/tip/height`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const parsed = Number.parseInt(await res.text(), 10);
        if (Number.isFinite(parsed)) tip = parsed;
      }
    } catch {
      return [];
    }
  }

  if (tip === null || tip < 0) return [];

  const count = Math.min(max, tip + 1);
  return Array.from({ length: count }, (_, i) => tip! - i);
}
