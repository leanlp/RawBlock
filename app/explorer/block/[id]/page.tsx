import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import JsonLd from "@/components/seo/JsonLd";
import { getBlockById, getLatestHeight, getLatestHeightFresh } from "@/lib/block.server";
import { getHeroGateway } from "@/lib/heroMetrics.server";
import { isBlockId, isHeightId, summarizeBlock } from "@/lib/block";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/seo";
import BlockExplorerClient from "./BlockExplorerClient";

interface BlockPageProps {
  params: Promise<{ id: string }>;
}

// Block facts are immutable once mined. The data read inside getBlockById is
// cached 7 days (unstable_cache); the page itself revalidates hourly so a
// render that fell back to the empty client shell (gateway blip) is never
// stuck serving that shell for a week.
export const revalidate = 3600;

function formatDate(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return "";
  return new Date(unixSeconds * 1000).toUTCString().replace(":00 GMT", " UTC");
}

export default async function BlockPage({ params }: BlockPageProps) {
  const { id } = await params;

  // Malformed ids (neither a canonical decimal height nor a 64-char hash)
  // 404 immediately — before anything streams and without touching the
  // gateway.
  if (!isBlockId(id)) notFound();

  // The streamed shell commits the HTTP status on its first byte, so the
  // "this block cannot exist" decision must be made before streaming.
  // Heights are the enumerable identifier space (and the only kind we ever
  // generate links for), so they get a pre-check against the chain tip:
  // mainnet heights are contiguous, so a height above the tip cannot exist.
  if (isHeightId(id)) {
    const gateway = getHeroGateway();
    if (gateway) {
      const height = Number.parseInt(id, 10);
      let latest = await getLatestHeight(gateway).catch(() => null);
      if (latest !== null && height > latest) {
        // The five-minute cache may lag the tip (a block mined since the
        // cache filled): one fresh read settles it before we 404.
        latest = await getLatestHeightFresh(gateway).catch(() => null);
      }
      if (latest !== null && height > latest) notFound();
    }

    // Stream: TTFB is the static shell below (tens of ms), not the gateway
    // round-trip; the block content chunks in when the node answers.
    return (
      <Suspense fallback={<BlockPageShell />}>
        <BlockPageBody id={id} streaming />
      </Suspense>
    );
  }

  // Hash ids: buffered (no Suspense) so an absent hash is a *real* HTTP 404
  // instead of a 200 whose status is committed before the node answers.
  // Absent ids make the gateway answer fast; a real hash costs one gateway
  // round-trip on the first render only (immutable block data, 7-day cache).
  return <BlockPageBody id={id} />;
}

/**
 * Streamed while the gateway read is pending. Mirrors the client shell's
 * loading state so the swap is seamless.
 */
function BlockPageShell() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <Header />
        <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse space-y-4">
          <div className="text-4xl">⏳</div>
          <div className="text-slate-500">Retrieving Block Data from Time Machine…</div>
        </div>
      </div>
    </div>
  );
}

async function BlockPageBody({ id, streaming = false }: { id: string; streaming?: boolean }) {
  const result = await getBlockById(id);

  if (result.status === "not-found") {
    if (!streaming) {
      // Nothing has streamed yet: a real HTTP 404 (route not-found.tsx).
      notFound();
    }
    // Streamed paths (heights that passed the tip pre-check but the node
    // still reports absent — a gap/fuzzy edge the pre-check cannot model):
    // the status is already committed 200, and notFound() inside Suspense
    // would stream an empty boundary, so render the 404 body in-band.
    // Search engines treat a 200 with "not found" content as a soft 404
    // and deindex it; we never generate such URLs, so exposure is limited.
    return <BlockAbsentBody id={id} />;
  }

  // "unavailable" (gateway blip) renders the interactive client, which
  // re-fetches on the client side — the page never 500s over a bad read.
  const block = result.status === "ok" ? summarizeBlock(result.block) : null;

  // WebPage JSON-LD carrying the real block facts for crawlers.
  let webPageJsonLd: Record<string, unknown> | null = null;
  if (block) {
    const minedWhen = formatDate(block.time);
    webPageJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": absoluteUrl(`/explorer/block/${id}`),
      url: absoluteUrl(`/explorer/block/${id}`),
      name: block.height === 1 ? "The Genesis Block" : `Bitcoin block #${block.height}`,
      description: `Block #${block.height} ${block.hash} mined by ${block.miner}${minedWhen ? ` on ${minedWhen}` : ""}: ${block.txCount} transactions, ${(block.size / 1000000).toFixed(2)} MB, reward ${(block.reward ?? 0).toFixed(8)} BTC.`,
      isPartOf: { "@id": SITE_URL, "@type": "WebSite", name: SITE_NAME },
    };
  }

  return (
    <>
      {webPageJsonLd ? <JsonLd data={webPageJsonLd} /> : null}
      <BlockExplorerClient id={id} initialBlock={block} />
    </>
  );
}

/**
 * In-band "absent" body for streamed renders (see `BlockPageBody`). Mirrors
 * the client shell's failure view so the swap is visually seamless.
 */
function BlockAbsentBody({ id }: { id: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <Header />
        <div className="text-center py-20 text-red-400">
          <h1 className="text-2xl font-bold">Block Not Found</h1>
          <p className="mt-2 text-slate-500 max-w-xl mx-auto">
            The node has no block for this identifier — the hash may be mistyped, or it may
            belong to a different chain.
          </p>
          <Link
            href="/explorer/blocks"
            className="mt-4 inline-block px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
          >
            Browse Blocks
          </Link>
          <Link
            href="/"
            className="mt-4 ml-2 inline-block px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
