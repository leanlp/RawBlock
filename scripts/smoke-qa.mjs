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
];

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
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    const status = response?.status() ?? 0;
    await page.waitForTimeout(600);

    const routeResult = {
      route,
      status,
      consoleErrors: [...new Set(consoleErrors)],
      pageErrors: [...new Set(pageErrors)],
    };
    details.push(routeResult);

    if (status >= 400 || routeResult.consoleErrors.length > 0 || routeResult.pageErrors.length > 0) {
      failures.push(routeResult);
    }
  } catch (error) {
    const routeResult = {
      route,
      status: 0,
      consoleErrors: [...new Set(consoleErrors)],
      pageErrors: [...new Set(pageErrors), String(error)],
    };
    details.push(routeResult);
    failures.push(routeResult);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
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

