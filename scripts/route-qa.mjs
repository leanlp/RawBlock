import http from "node:http";
import path from "node:path";
import { QA_VIEWPORTS, ROUTE_MATRIX, ROUTE_COUNTS } from "./qa/inventory.mjs";
import {
  BASE_URL,
  captureScreenshot,
  createLocaleContext,
  createOutputDir,
  hasBlockingResponsiveIssue,
  inspectResponsiveRoute,
  launchBrowser,
  slugForRoute,
  writeJson,
} from "./qa/runtime.mjs";

const MAX_CONSECUTIVE_DEAD = 3;

async function isServerAlive() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, { timeout: 5000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
}

function shouldCaptureBaseline(route) {
  return route === "/";
}

async function run() {
  const outDir = createOutputDir("route_qa");
  const browser = await launchBrowser();
  const results = [];

  try {
    for (const viewport of QA_VIEWPORTS) {
      const alive = await isServerAlive();
      if (!alive) {
        console.error(`[route-qa] Server is not reachable before ${viewport.name} viewport round. Aborting.`);
        break;
      }
      for (const matrixEntry of ROUTE_MATRIX) {
        const context = await createLocaleContext(browser, {
          viewport,
          locale: matrixEntry.locale,
        });
        const page = await context.newPage();

        try {
          let consecutiveDead = 0;
          for (const route of matrixEntry.routes) {
            const result = await inspectResponsiveRoute(page, {
              route,
              locale: matrixEntry.locale,
              waitMs: route === "/graph" ? 1800 : 1400,
            });
            result.viewport = viewport.name;
            result.matrixKey = matrixEntry.key;
            result.routeKind = matrixEntry.routeKind;

            if (result.status === 0) {
              consecutiveDead++;
              if (consecutiveDead >= MAX_CONSECUTIVE_DEAD) {
                console.error(
                  `[route-qa] Server appears dead after ${MAX_CONSECUTIVE_DEAD} consecutive connection failures. Aborting.`,
                );
                results.push(result);
                writeJson(path.join(outDir, "results.json"), results);
                process.exit(1);
              }
            } else {
              consecutiveDead = 0;
            }

            const hasAnyIssue = result.issues.length > 0;
            if (shouldCaptureBaseline(route) || hasAnyIssue) {
              result.screenshot = await captureScreenshot(
                page,
                path.join(
                  outDir,
                  hasAnyIssue ? "anomalies" : "baselines",
                  `${viewport.name}__${matrixEntry.key}__${slugForRoute(route)}.png`,
                ),
              ).catch(() => null);
            } else {
              result.screenshot = null;
            }

            results.push(result);
          }
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  writeJson(path.join(outDir, "results.json"), results);

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    outDir,
    routeCounts: ROUTE_COUNTS,
    viewportCount: QA_VIEWPORTS.length,
    matrixCount: ROUTE_MATRIX.length,
    totalChecks: results.length,
    blockingIssues: results.filter((result) => hasBlockingResponsiveIssue(result)).length,
    warnings: results.filter((result) => result.issues.some((issue) => issue.severity === "warning")).length,
    overflow: results.filter((result) => result.horizontalOverflow).length,
    mobileMultiCol: results.filter((result) => result.viewport === "mobile" && result.multiColGridOnMobile)
      .length,
    lowLineHeight: results.filter(
      (result) => result.minLineHeightRatio !== null && result.minLineHeightRatio < 1.5,
    ).length,
    tapWarnings: results.filter((result) => result.tapViolationsCount > 0).length,
    localeSentinelFailures: results.filter((result) => result.sentinelViolations.length > 0).length,
  };

  writeJson(path.join(outDir, "summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));

  const blocking = results.filter((result) => hasBlockingResponsiveIssue(result));
  if (blocking.length > 0) {
    console.error("Responsive QA failures:");
    for (const failure of blocking) {
      console.error(
        JSON.stringify(
          {
            route: failure.route,
            locale: failure.locale,
            viewport: failure.viewport,
            matrixKey: failure.matrixKey,
            status: failure.status,
            finalUrl: failure.finalUrl,
            issues: failure.issues.filter((issue) => issue.severity === "error"),
            consoleErrors: failure.consoleErrors.slice(0, 3),
            pageErrors: failure.pageErrors.slice(0, 3),
            sentinelViolations: failure.sentinelViolations,
          },
          null,
          2,
        ),
      );
    }
    process.exit(1);
  }
}

run();
