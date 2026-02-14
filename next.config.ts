import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
