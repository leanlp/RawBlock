import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/explorer/block",
        destination: "/explorer/blocks",
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
        source: "/academy/1",
        destination: "/paths/bitcoin-foundations",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
