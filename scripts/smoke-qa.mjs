import { chromium } from "playwright";
import fs from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const HEADLESS = process.env.HEADLESS ? process.env.HEADLESS !== "false" : true;
const CHROME_PATH =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const criticalRoutes = [
  "/",
  "/explorer/mempool",
  "/explorer/network",
  "/explorer/blocks",
  "/explorer/decoder",
  "/explorer/rich-list",
  "/explorer/rpc",
  "/analysis/evolution",
  "/analysis/forensics",
  "/analysis/incidents",
  "/analysis/bridges",
];

function isBenignConsoleError(text) {
  if (!text) return false;
  const value = String(text);
  return (
    value.includes("Failed to load resource: the server responded with a status of 404") ||
    value.includes("Failed to fetch candidate block") ||
    value.includes("Failed to load rich list") ||
    value.includes("Failed to load evolution payload") ||
    value.includes("Failed to fetch")
  );
}

function isCriticalConsoleError(text) {
  if (!text) return false;
  const value = String(text);
  if (isBenignConsoleError(value)) return false;
  return (
    value.includes("Uncaught") ||
    value.includes("Cannot read properties of undefined") ||
    value.includes("TypeError")
  );
}

const browser = await chromium.launch({
  headless: HEADLESS,
  executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const failures = [];
const details = [];

for (const route of criticalRoutes) {
  const url = new URL(route, BASE_URL).toString();
  const consoleErrors = [];
  const pageErrors = [];

  const onConsole = (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  };

  const onPageError = (error) => {
    pageErrors.push(String(error));
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    // networkidle is too strict for pages that keep long-lived polling/websocket traffic.
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const status = response?.status() ?? 0;
    await page.waitForTimeout(1000);

    const hasCrashBanner = await page.evaluate(() => {
      const text = document.body?.innerText || "";
      return text.includes("Application error: a client-side exception has occurred");
    });

    const criticalConsoleErrors = [...new Set(consoleErrors)].filter(isCriticalConsoleError);
    const filteredConsoleErrors = [...new Set(consoleErrors)].filter((entry) => !isBenignConsoleError(entry));

    const routeResult = {
      route,
      status,
      hasCrashBanner,
      consoleErrors: filteredConsoleErrors,
      criticalConsoleErrors,
      pageErrors: [...new Set(pageErrors)],
    };
    details.push(routeResult);

    if (
      status >= 400 ||
      hasCrashBanner ||
      routeResult.criticalConsoleErrors.length > 0 ||
      routeResult.pageErrors.length > 0
    ) {
      failures.push(routeResult);
    }
  } catch (error) {
    const routeResult = {
      route,
      status: 0,
      hasCrashBanner: false,
      consoleErrors: [...new Set(consoleErrors)].filter((entry) => !isBenignConsoleError(entry)),
      criticalConsoleErrors: [...new Set(consoleErrors)].filter(isCriticalConsoleError),
      pageErrors: [...new Set(pageErrors), String(error)],
    };
    details.push(routeResult);
    failures.push(routeResult);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

console.log("Running Language Toggle E2E Test...");
try {
  const langUrl = new URL("/", BASE_URL).toString();
  await page.goto(langUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(2000);

  const toggleBtn = page.locator('button[aria-label="Toggle language"]');
  if (await toggleBtn.count() > 0) {
    await toggleBtn.first().click();
    await page.waitForTimeout(500);

    const locale = await page.evaluate(() => window.localStorage.getItem("rawblock-locale"));
    if (locale !== "es" && locale !== "en") {
      throw new Error(`Language toggle failed. rawblock-locale in localStorage is ${locale}`);
    }
    console.log(`✅ Language toggle E2E passed. LocalStorage rawblock-locale: ${locale}`);
  } else {
    console.warn("⚠️ Warning: Language toggle button not found on page.");
  }
} catch (error) {
  console.error("❌ Language toggle E2E failed:", error);
  failures.push({
    route: "Language Toggle Test",
    status: 0,
    hasCrashBanner: false,
    criticalConsoleErrors: [],
    consoleErrors: [],
    pageErrors: [String(error)]
  });
}

await context.close();
await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  checkedRoutes: criticalRoutes.length,
  failures: failures.length,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  console.error("Smoke QA failures:");
  for (const failure of failures) {
    console.error(
      JSON.stringify(
        {
          route: failure.route,
          status: failure.status,
          hasCrashBanner: failure.hasCrashBanner,
          criticalConsoleErrors: failure.criticalConsoleErrors.slice(0, 3),
          consoleErrors: failure.consoleErrors.slice(0, 3),
          pageErrors: failure.pageErrors.slice(0, 3),
        },
        null,
        2,
      ),
    );
  }
  process.exit(1);
}
