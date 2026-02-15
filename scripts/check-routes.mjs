const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const REQUEST_TIMEOUT_MS = Number(process.env.ROUTE_TIMEOUT_MS || 12000);

const criticalRoutes = [
  "/",
  "/about",
  "/explorer/vitals",
  "/explorer/mempool",
  "/explorer/network",
  "/explorer/blocks",
  "/explorer/decoder",
  "/explorer/miners",
  "/explorer/rpc",
  "/analysis/forensics",
  "/analysis/utxo",
  "/analysis/evolution",
  "/analysis/graffiti",
  "/analysis/d-index",
  "/lab/script",
  "/lab/consensus",
  "/lab/hashing",
  "/lab/keys",
  "/lab/taproot",
  "/lab/lightning",
  "/game/tetris",
  "/game/mining",
  "/academy",
  "/research",
  "/research/vulnerabilities",
  "/research/attacks",
  "/research/assumptions",
  "/research/policy-vs-consensus",
];

const legacyRedirects = [
  { path: "/vitals", destination: "/explorer/vitals" },
  { path: "/labs", destination: "/lab/script" },
  { path: "/labs/script-lab", destination: "/lab/script" },
  { path: "/labs/consensus-debugger", destination: "/lab/consensus" },
  { path: "/knowledge", destination: "/research" },
  { path: "/knowledge/academy", destination: "/academy" },
  { path: "/knowledge/vulnerabilities", destination: "/research/vulnerabilities" },
  { path: "/knowledge/attacks", destination: "/research/attacks" },
  { path: "/knowledge/assumptions", destination: "/research/assumptions" },
  { path: "/knowledge/policy-vs-consensus", destination: "/research/policy-vs-consensus" },
];

function withTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

async function checkCriticalRoute(path) {
  const url = new URL(path, BASE_URL).toString();
  const response = await withTimeout(url, { redirect: "manual" });
  const ok = response.status >= 200 && response.status < 400;
  return {
    kind: "critical",
    path,
    ok,
    status: response.status,
    location: response.headers.get("location"),
  };
}

function isRedirect(status) {
  return status === 301 || status === 302 || status === 307 || status === 308;
}

async function checkLegacyRedirect({ path, destination }) {
  const url = new URL(path, BASE_URL).toString();
  const response = await withTimeout(url, { redirect: "manual" });
  const location = response.headers.get("location");
  const expected = new URL(destination, BASE_URL).pathname;
  const received = location ? new URL(location, BASE_URL).pathname : null;
  const ok = isRedirect(response.status) && received === expected;

  return {
    kind: "redirect",
    path,
    ok,
    status: response.status,
    location,
    expected,
  };
}

async function run() {
  const results = [];

  for (const path of criticalRoutes) {
    try {
      results.push(await checkCriticalRoute(path));
    } catch (error) {
      results.push({
        kind: "critical",
        path,
        ok: false,
        status: null,
        location: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const redirectCase of legacyRedirects) {
    try {
      results.push(await checkLegacyRedirect(redirectCase));
    } catch (error) {
      results.push({
        kind: "redirect",
        path: redirectCase.path,
        ok: false,
        status: null,
        location: null,
        expected: redirectCase.destination,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const failures = results.filter((entry) => !entry.ok);
  console.log(`Route check base: ${BASE_URL}`);
  console.log(`Checked ${results.length} routes (${criticalRoutes.length} critical, ${legacyRedirects.length} redirects).`);

  if (failures.length === 0) {
    console.log("All route checks passed.");
    process.exit(0);
  }

  console.error(`Route check failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) {
    if (failure.kind === "redirect") {
      console.error(
        `- [redirect] ${failure.path} status=${String(failure.status)} location=${String(
          failure.location,
        )} expected=${String(failure.expected)}${failure.error ? ` error=${failure.error}` : ""}`,
      );
    } else {
      console.error(
        `- [critical] ${failure.path} status=${String(failure.status)} location=${String(
          failure.location,
        )}${failure.error ? ` error=${failure.error}` : ""}`,
      );
    }
  }

  process.exit(1);
}

run();
