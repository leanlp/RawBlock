// The public gateway accepts the same JSON request profile for both server readers.
const defaultUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function rawblockGatewayHeaders(clientUserAgent?: string | null) {
  return {
    Accept: "application/json",
    "User-Agent": clientUserAgent && !clientUserAgent.includes("RawBlock-Proxy")
      ? clientUserAgent
      : defaultUserAgent,
  };
}
