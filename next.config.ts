import type { NextConfig } from "next";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
const configuredConnectSrc = (() => {
  if (!configuredApiUrl) return [];
  try {
    const parsed = new URL(configuredApiUrl);
    const wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return [`${parsed.protocol}//${parsed.host}`, `${wsProtocol}//${parsed.host}`];
  } catch {
    return [];
  }
})();
const connectSrc = ["'self'", "https:", "wss:", ...configuredConnectSrc]
  .filter((value, index, values) => values.indexOf(value) === index)
  .join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  `connect-src ${connectSrc}`,
  "frame-src 'self' https:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/vitals",
        destination: "/explorer/vitals",
        permanent: true,
      },
      {
        source: "/utxo",
        destination: "/analysis/utxo",
        permanent: true,
      },
      {
        source: "/utxo-set",
        destination: "/analysis/utxo",
        permanent: true,
      },
      {
        source: "/lab/hash",
        destination: "/lab/hashing",
        permanent: true,
      },
      {
        source: "/game/lightning",
        destination: "/lab/lightning",
        permanent: true,
      },
      {
        source: "/labs",
        destination: "/lab/script",
        permanent: true,
      },
      {
        source: "/labs/script-lab",
        destination: "/lab/script",
        permanent: true,
      },
      {
        source: "/labs/script-lab/:path*",
        destination: "/lab/script",
        permanent: true,
      },
      {
        source: "/labs/consensus-debugger",
        destination: "/lab/consensus",
        permanent: true,
      },
      {
        source: "/labs/consensus-debugger/:path*",
        destination: "/lab/consensus",
        permanent: true,
      },
      {
        source: "/labs/:path*",
        destination: "/lab/:path*",
        permanent: true,
      },
      {
        source: "/knowledge",
        destination: "/research",
        permanent: true,
      },
      {
        source: "/knowledge/academy",
        destination: "/academy",
        permanent: true,
      },
      {
        source: "/knowledge/academy/:path*",
        destination: "/academy/:path*",
        permanent: true,
      },
      {
        source: "/knowledge/vulnerabilities",
        destination: "/research/vulnerabilities",
        permanent: true,
      },
      {
        source: "/knowledge/attacks",
        destination: "/research/attacks",
        permanent: true,
      },
      {
        source: "/knowledge/assumptions",
        destination: "/research/assumptions",
        permanent: true,
      },
      {
        source: "/knowledge/policy",
        destination: "/research/policy-vs-consensus",
        permanent: true,
      },
      {
        source: "/knowledge/policy-vs-consensus",
        destination: "/research/policy-vs-consensus",
        permanent: true,
      },
      {
        source: "/knowledge/:path*",
        destination: "/research",
        permanent: true,
      },
      {
        source: "/sitemap",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/explorer/block",
        destination: "/explorer/blocks",
        permanent: true,
      },
      {
        source: "/learn",
        destination: "/paths/bitcoin-foundations",
        permanent: true,
      },
      {
        source: "/learn/lesson:lesson",
        destination: "/paths/bitcoin-foundations",
        permanent: true,
      },
      {
        source: "/learn/script-lab",
        destination: "/lab/script",
        permanent: true,
      },
      {
        source: "/learn/script-lab/:path*",
        destination: "/lab/script",
        permanent: true,
      },
      {
        source: "/learn/consensus-debugger",
        destination: "/lab/consensus",
        permanent: true,
      },
      {
        source: "/learn/consensus-debugger/:path*",
        destination: "/lab/consensus",
        permanent: true,
      },
      {
        source: "/learn/:path*",
        destination: "/paths/bitcoin-foundations",
        permanent: true,
      },
      {
        source: "/play/mempool-tetris",
        destination: "/game/tetris",
        permanent: true,
      },
      {
        source: "/play/mempool-tetris/:path*",
        destination: "/game/tetris",
        permanent: true,
      },
      {
        source: "/play/mining-simulator",
        destination: "/game/mining",
        permanent: true,
      },
      {
        source: "/play/mining-simulator/:path*",
        destination: "/game/mining",
        permanent: true,
      },
      {
        source: "/play/lightning-simulator",
        destination: "/lab/lightning",
        permanent: true,
      },
      {
        source: "/play/lightning-simulator/:path*",
        destination: "/lab/lightning",
        permanent: true,
      },
      {
        source: "/simulations/mempool-tetris",
        destination: "/game/tetris",
        permanent: true,
      },
      {
        source: "/simulations/mining",
        destination: "/game/mining",
        permanent: true,
      },
      {
        source: "/simulations/lightning",
        destination: "/lab/lightning",
        permanent: true,
      },
      {
        source: "/academy/bitcoin-foundations",
        destination: "/paths/bitcoin-foundations",
        permanent: true,
      },
      {
        source: "/learn/what-is-bitcoin",
        destination: "/paths/bitcoin-foundations",
        permanent: true,
      },
      {
        source: "/learn/lesson1",
        destination: "/paths/bitcoin-foundations",
        permanent: true,
      },
      {
        source: "/learn/script-lab",
        destination: "/lab/script",
        permanent: true,
      },
      {
        source: "/academy/1",
        destination: "/paths/bitcoin-foundations",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
