import { BASE_URL } from "./qa/runtime.mjs";
import { ROUTE_COUNTS, ROUTE_REDIRECTS, STATIC_PAGE_ROUTES } from "./qa/inventory.mjs";

const REQUEST_TIMEOUT_MS = Number(process.env.ROUTE_TIMEOUT_MS || 12_000);

function withTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function isRedirect(status) {
  return status === 301 || status === 302 || status === 307 || status === 308;
}

async function checkStaticRoute(route) {
  const url = new URL(route, BASE_URL).toString();
  const response = await withTimeout(url, { redirect: "manual" });
  const ok = response.status >= 200 && response.status < 400;

  return {
    kind: "page",
    route,
    ok,
    status: response.status,
    location: response.headers.get("location"),
  };
}

async function checkRedirectRoute({ path, destination }) {
  const url = new URL(path, BASE_URL).toString();
  const response = await withTimeout(url, { redirect: "manual" });
  const location = response.headers.get("location");
  const expected = new URL(destination, BASE_URL).pathname;
  const received = location ? new URL(location, BASE_URL).pathname : null;
  const ok = isRedirect(response.status) && received === expected;

  return {
    kind: "redirect",
    route: path,
    ok,
    status: response.status,
    location,
    expected,
  };
}

async function run() {
  const results = [];

  for (const route of STATIC_PAGE_ROUTES) {
    try {
      results.push(await checkStaticRoute(route));
    } catch (error) {
      results.push({
        kind: "page",
        route,
        ok: false,
        status: null,
        location: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const redirectRoute of ROUTE_REDIRECTS) {
    try {
      results.push(await checkRedirectRoute(redirectRoute));
    } catch (error) {
      results.push({
        kind: "redirect",
        route: redirectRoute.path,
        ok: false,
        status: null,
        location: null,
        expected: redirectRoute.destination,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const failures = results.filter((entry) => !entry.ok);

  console.log(`Route check base: ${BASE_URL}`);
  console.log(
    `Checked ${results.length} routes (${ROUTE_COUNTS.staticPages} static pages, ${ROUTE_COUNTS.redirects} redirects).`,
  );

  if (failures.length === 0) {
    console.log("All route checks passed.");
    process.exit(0);
  }

  console.error(`Route check failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) {
    if (failure.kind === "redirect") {
      console.error(
        `- [redirect] ${failure.route} status=${String(failure.status)} location=${String(
          failure.location,
        )} expected=${String(failure.expected)}${failure.error ? ` error=${failure.error}` : ""}`,
      );
      continue;
    }

    console.error(
      `- [page] ${failure.route} status=${String(failure.status)} location=${String(
        failure.location,
      )}${failure.error ? ` error=${failure.error}` : ""}`,
    );
  }

  process.exit(1);
}

run();
