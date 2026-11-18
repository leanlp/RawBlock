// Bind HERO_ORIGIN to the tunnel's HTTP VPC Service for the RawBlock node.
// Set HERO_TOKEN to 32 random bytes encoded as lowercase hex. In Vercel, set
// RAWBLOCK_HERO_API_URL to this Worker's HTTPS origin and RAWBLOCK_HERO_API_TOKEN
// to the matching server secret. Use separate Workers and secrets per environment.
const paths = new Set(["/api/network-stats", "/api/vitals", "/api/mempool-recent", "/api/fee-history"]);
const encoder = new TextEncoder();
const copiedHeaders = ["content-type", "x-rawblock-data-source", "x-rawblock-updated-at", "x-rawblock-cache"];

function response(status) {
  return new Response(null, { status, headers: { "cache-control": "no-store" } });
}

const worker = {
  async fetch(request, env) {
    if (!/^[a-f0-9]{64}$/.test(env.HERO_TOKEN ?? "")) return response(503);
    const expected = encoder.encode("Bearer " + env.HERO_TOKEN);
    const provided = encoder.encode(request.headers.get("authorization") || "");
    if (provided.byteLength !== expected.byteLength || !crypto.subtle.timingSafeEqual(provided, expected)) {
      return response(401);
    }
    const url = new URL(request.url);
    if (request.method !== "GET") return response(405);
    if (url.search || !paths.has(url.pathname)) return response(404);
    try {
      const upstream = await env.HERO_ORIGIN.fetch("http://rawblock-hero.internal" + url.pathname, {
        headers: { accept: "application/json" },
        redirect: "manual",
        signal: AbortSignal.timeout(1700),
      });
      if (!upstream.ok) return response(502);
      const headers = new Headers({ "cache-control": "no-store" });
      for (const name of copiedHeaders) {
        const value = upstream.headers.get(name);
        if (value !== null) headers.set(name, value);
      }
      return new Response(upstream.body, { headers });
    } catch (error) {
      console.warn("RawBlock private hero upstream unavailable", { path: url.pathname, error: error.name });
      return response(503);
    }
  },
};

export default worker;
