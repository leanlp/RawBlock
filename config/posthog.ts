import type { NextConfig } from 'next';

export const posthogRewrites: NonNullable<NextConfig['rewrites']> = async () => [
  {
    source: '/ingest/static/:path*',
    destination: 'https://us-assets.i.posthog.com/static/:path*',
  },
  {
    source: '/ingest/:path*',
    destination: 'https://us.i.posthog.com/:path*',
  },
];
