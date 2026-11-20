// Request profile for every RawBlock *server-side* reader that talks to the
// node gateway (homepage hero metrics, block SSR, the proxy-rpc bridge).
//
// Cloudflare challenges datacenter-IP traffic (Vercel functions) against the
// rawblock.net zone by IP reputation: a browser User-Agent is indistinguishable
// from a spoofed bot and is challenged just the same (measured from the
// preview function: 403 + `cf-mitigated: challenge` with every profile, while
// the same reads succeed from residential connections). A distinctive, stable
// UA lets the zone exempt exactly our own server traffic with a WAF skip rule
// while continuing to challenge everything else.
export const RAWBLOCK_SERVER_UA = "RawBlock-Server/1.0 (+https://www.rawblock.net)";

/** Headers for server-side gateway reads; merge `Authorization` when authenticated. */
export function rawblockServerHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "User-Agent": RAWBLOCK_SERVER_UA,
  };
}

/** True when the gateway's edge answered with a Cloudflare bot challenge. */
export function isGatewayChallenge(response: Response): boolean {
  return response.headers.get("cf-mitigated") === "challenge";
}

/** Suffix appended to server-read errors when Cloudflare is the cause. */
export function gatewayChallengeSuffix(response: Response): string {
  return isGatewayChallenge(response)
    ? " — Cloudflare challenged this server request (cf-mitigated: challenge); in the rawblock.net zone exempt the RawBlock-Server UA with a WAF skip rule or disable Super Bot Fight Mode"
    : "";
}
