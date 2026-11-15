// TEMPORARY diagnostic route (removed before merge).
//
// The preview + production deployments render "Data temporarily unavailable"
// for every server-side gateway read, while the same reads succeed from a
// residential connection. This route executes the exact same in-function
// fetches against each candidate gateway base and reports what the Vercel
// function actually observes (status, Cloudflare mitigation, latency, body),
// plus which environment configuration is present — without exposing any
// secret value.
import { NextResponse } from "next/server";
import { getHeroGateway } from "@/lib/heroMetrics.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PUBLIC_BASE = "https://apigoland.rawblock.net";

// The profile the public-gateway code path used in 7efa672 (before 9c12020
// switched hero reads to the authenticated worker).
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface ProbeResult {
  base: string;
  path: string;
  profile: "code" | "browser-ua";
  ok?: boolean;
  status?: number;
  cfMitigated?: string | null;
  cfRay?: string | null;
  server?: string | null;
  xCache?: string | null;
  ms: number;
  bodyHead?: string;
  error?: string;
}

async function probe(
  base: string,
  path: string,
  profile: "code" | "browser-ua",
  authenticated: boolean,
): Promise<ProbeResult> {
  const headers = new Headers({ Accept: "application/json" });
  if (profile === "browser-ua") headers.set("User-Agent", BROWSER_UA);
  if (authenticated) {
    headers.set("Authorization", `Bearer ${process.env.RAWBLOCK_HERO_API_TOKEN?.trim()}`);
  }
  const started = Date.now();
  try {
    const response = await fetch(`${base}/api/${path}`, {
      cache: "no-store",
      headers,
      redirect: authenticated ? "error" : "follow",
      signal: AbortSignal.timeout(5_000),
    });
    const text = await response.text();
    return {
      base,
      path,
      profile,
      ok: response.ok,
      status: response.status,
      cfMitigated: response.headers.get("cf-mitigated"),
      cfRay: response.headers.get("cf-ray"),
      server: response.headers.get("server"),
      xCache: response.headers.get("x-rawblock-cache"),
      ms: Date.now() - started,
      bodyHead: text.slice(0, 160),
    };
  } catch (error) {
    return {
      base,
      path,
      profile,
      ms: Date.now() - started,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }
}

export async function GET() {
  const heroUrl = process.env.RAWBLOCK_HERO_API_URL?.trim() ?? "";
  const token = process.env.RAWBLOCK_HERO_API_TOKEN?.trim() ?? "";

  // Which branch does getHeroGateway() take, and does it validate?
  const privateConfig = {
    heroUrlSet: Boolean(heroUrl),
    heroUrl: heroUrl || null,
    tokenSet: Boolean(token),
    tokenLooksLike64Hex: /^[a-f0-9]{64}$/.test(token),
  };

  const resolved = getHeroGateway();

  const bases = [
    ...new Set(
      [resolved?.base ?? null, PUBLIC_BASE, heroUrl || null].filter(
        (base): base is string => Boolean(base),
      ),
    ),
  ];

  const probes: ProbeResult[] = [];
  const jobs: Promise<ProbeResult>[] = [];

  // The same two reads the deployed app performs, against every candidate
  // base, using the profile the current code sends.
  for (const base of bases) {
    const authenticated = resolved?.base === base && resolved?.authenticated;
    jobs.push(probe(base, "network-stats", "code", Boolean(authenticated)));
    jobs.push(probe(base, "block/height/975801", "code", Boolean(authenticated)));
  }
  // The browser-UA profile against each base: tests whether the gateway zone
  // challenges non-browser request profiles (the 7efa672 hypothesis).
  for (const base of bases) {
    jobs.push(probe(base, "network-stats", "browser-ua", false));
  }

  // All probes run in parallel so the whole route stays under the function
  // execution limit.
  for (const settled of await Promise.allSettled(jobs)) {
    if (settled.status === "fulfilled") probes.push(settled.value);
  }

  return NextResponse.json(
    {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      env: {
        RAWBLOCK_API_URL: process.env.RAWBLOCK_API_URL ?? null,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? null,
        ...privateConfig,
      },
      resolvedGateway: resolved
        ? { base: resolved.base, authenticated: resolved.authenticated }
        : null,
      probes,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
