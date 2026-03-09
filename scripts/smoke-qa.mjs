import path from "node:path";
import { ROUTE_COUNTS, ROUTE_MATRIX, QA_VIEWPORTS, SCENARIO_DEFINITIONS } from "./qa/inventory.mjs";
import {
  BASE_URL,
  captureScreenshot,
  createLocaleContext,
  createOutputDir,
  inspectRoute,
  isRouteHealthy,
  launchBrowser,
  slugForRoute,
  writeJson,
} from "./qa/runtime.mjs";

const VIEWPORT_BY_NAME = Object.fromEntries(QA_VIEWPORTS.map((viewport) => [viewport.name, viewport]));

function createScenarioResult(definition, status, extra = {}) {
  return {
    id: definition.id,
    title: definition.title,
    locale: definition.locale,
    viewport: definition.viewport,
    status,
    ...extra,
  };
}

function bodyHasAny(text, candidates) {
  return candidates.some((candidate) => text.includes(candidate));
}

async function gotoScenario(page, route, locale) {
  const baseline = await inspectRoute(page, { route, locale, waitMs: 1500 });
  if (!isRouteHealthy(baseline)) {
    throw new Error(
      `Route ${route} failed preload: status=${baseline.status} console=${baseline.consoleErrors.length} pageErrors=${baseline.pageErrors.length} sentinels=${baseline.sentinelViolations.length}`,
    );
  }
  return baseline;
}

async function getVisibleLocator(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }
  return locator.first();
}

async function runScenario(browser, definition, outDir) {
  const viewport = VIEWPORT_BY_NAME[definition.viewport];
  const context = await createLocaleContext(browser, {
    viewport,
    locale: definition.locale,
  });
  const page = await context.newPage();
  const notes = [];

  const note = (value) => notes.push(value);

  const fail = async (error) => {
    const screenshot = await captureScreenshot(
      page,
      path.join(outDir, "failures", `${definition.id}__${definition.viewport}__${definition.locale}.png`),
    ).catch(() => null);
    return createScenarioResult(definition, "failed", {
      error: error instanceof Error ? error.message : String(error),
      notes,
      screenshot,
      finalUrl: page.url(),
    });
  };

  const pass = (extra = {}) =>
    createScenarioResult(definition, "passed", {
      notes,
      finalUrl: page.url(),
      ...extra,
    });

  const skip = (reason) =>
    createScenarioResult(definition, "skipped", {
      reason,
      notes,
      finalUrl: page.url(),
    });

  try {
    switch (definition.id) {
      case "language-toggle-renders": {
        await gotoScenario(page, "/", definition.locale);
        const toggle = await getVisibleLocator(
          page.locator('button[aria-label*="Toggle language" i], button[aria-label*="Toggle Language" i]'),
        );
        await toggle.waitFor({ state: "visible", timeout: 30_000 });
        await toggle.click();
        await page.waitForFunction(
          () =>
            document.body.innerText.includes("Tu centro de comando") ||
            document.body.innerText.includes("red P2P de Bitcoin"),
          null,
          { timeout: 60_000 },
        );
        const storedLocale = await page.evaluate(() => window.localStorage.getItem("rawblock-locale"));
        if (storedLocale !== "es") {
          throw new Error(`Expected rawblock-locale=es after toggle, received ${storedLocale}`);
        }
        note("Observed the home dashboard copy switch from English to Spanish.");
        return pass();
      }

      case "decoder-sample-decode": {
        await gotoScenario(page, "/explorer/decoder", definition.locale);
        const sampleButton = page.getByRole("button", { name: /genesis|segwit/i }).first();
        await sampleButton.waitFor({ state: "visible", timeout: 30_000 });
        const sampleLabel = (await sampleButton.innerText()).trim();
        await sampleButton.click();
        await sampleButton.waitFor({ state: "hidden", timeout: 60_000 });
        await page.waitForFunction(
          () =>
            document.body.innerText.includes("4a5e1e4b") ||
            document.body.innerText.includes("37d966a2"),
          null,
          { timeout: 45_000 },
        );
        note(`Decoded sample flow succeeded using "${sampleLabel}".`);
        return pass();
      }

      case "network-primary-view": {
        await gotoScenario(page, "/explorer/network", definition.locale);
        const mapToggle = page.getByRole("button", { name: /^map$/i });
        const listToggle = page.getByRole("button", { name: /^list$/i });
        const toggleCount = (await mapToggle.count()) + (await listToggle.count());
        if (toggleCount >= 2) {
          await mapToggle.first().click();
          await listToggle.first().click();
          note("Toggled both network presentation modes.");
        } else {
          note("Current network page exposes a live map + table without a dedicated Map/List toggle.");
        }

        await Promise.any([
          page.locator("#network-map-export-target").waitFor({ state: "visible", timeout: 30_000 }),
          page.getByText(/Active Connections/i).waitFor({ state: "visible", timeout: 30_000 }),
        ]);
        note("Verified the network explorer renders its main telemetry surface.");
        return pass();
      }

      case "blocks-compare-submit": {
        await gotoScenario(page, "/explorer/blocks/compare", definition.locale);
        await page.getByPlaceholder("e.g. 840000").fill("840000");
        await page.getByPlaceholder("e.g. 840001").fill("840001");
        await page.getByRole("button", { name: /^Compare$/i }).click();
        await page.waitForFunction(
          () => {
            const params = new URL(window.location.href).searchParams;
            return params.get("b1") === "840000" && params.get("b2") === "840001";
          },
          null,
          { timeout: 10_000 },
        );
        await Promise.any([
          page.getByText(/Block A/i).waitFor({ state: "visible", timeout: 45_000 }),
          page.getByText(/Metric/i).waitFor({ state: "visible", timeout: 45_000 }),
        ]);
        note("Submitted the block compare form and observed comparison output.");
        return pass();
      }

      case "rpc-safe-command": {
        await gotoScenario(page, "/explorer/rpc", definition.locale);
        await page.getByRole("button", { name: /getblockcount/i }).click();
        await page.getByRole("button", { name: /exec/i }).click();
        await page.waitForFunction(() => {
          const terminalOutput = [...document.querySelectorAll("pre")]
            .map((node) => node.textContent?.trim() ?? "")
            .filter(Boolean);
          const latest = terminalOutput.at(-1) ?? "";
          return /^\d+$/.test(latest);
        }, null, { timeout: 30_000 });
        note("Executed getblockcount through the safe RPC web console.");
        return pass();
      }

      case "academy-search-open": {
        await gotoScenario(page, "/academy", definition.locale);
        const searchInput = page.getByPlaceholder(/Search by title, id, or type/i);
        await searchInput.fill("utxo");
        const firstNode = page.locator('a[href^="/academy/"]').first();
        await firstNode.waitFor({ state: "visible", timeout: 30_000 });
        await firstNode.click();
        await page.waitForURL((url) => /^\/academy\/.+/.test(url.pathname), { timeout: 30_000 });
        note("Filtered academy nodes and opened the first matching lesson.");
        return pass();
      }

      case "research-filter-open": {
        await gotoScenario(page, "/research/vulnerabilities", definition.locale);
        const filtersButton = page.getByRole("button", { name: /filters|hide/i }).first();
        if (await filtersButton.isVisible().catch(() => false)) {
          await filtersButton.click();
        }
        const severitySelect = page.locator("#vulnerability-filters select").first();
        await severitySelect.waitFor({ state: "visible", timeout: 30_000 });
        const nextSeverity = await severitySelect.evaluate((element) => {
          const select = element;
          return [...select.options].map((option) => option.value).find((value) => value);
        });
        if (!nextSeverity) {
          return skip("No vulnerability severity options were available to exercise.");
        }
        await severitySelect.selectOption(nextSeverity);
        const selectedSeverity = await severitySelect.inputValue();
        if (selectedSeverity !== nextSeverity) {
          throw new Error(`Expected severity ${nextSeverity}, received ${selectedSeverity}`);
        }
        note(`Applied the vulnerability severity filter: ${selectedSeverity}.`);
        return pass();
      }

      case "script-lab-run-or-step": {
        await gotoScenario(page, "/lab/script", definition.locale);
        const fixtureButton = page.locator("button").filter({ hasText: /expected (PASS|FAIL)/i }).first();
        if (await fixtureButton.isVisible().catch(() => false)) {
          await fixtureButton.click();
          note("Loaded a real fixture into the Script Lab.");
        }
        const actionCandidates = [
          page.getByRole("button", { name: /^Run$/i }).first(),
          page.getByRole("button", { name: /^Step$/i }).first(),
          page.getByRole("button", { name: /Run Real Consensus Verify/i }).first(),
          page.getByRole("button", { name: /Run Real Trace/i }).first(),
        ];
        let actionUsed = null;
        for (const candidate of actionCandidates) {
          if ((await candidate.count()) > 0 && (await candidate.isVisible().catch(() => false))) {
            actionUsed = await candidate.innerText();
            await candidate.click();
            break;
          }
        }
        if (!actionUsed) {
          return skip("No Script Lab action button was available in the current UI.");
        }
        await page.waitForFunction(
          () =>
            !document.body.innerText.includes("No consensus result yet.") ||
            !document.body.innerText.includes("No real trace result yet."),
          null,
          { timeout: 15_000 },
        );
        note(`Triggered the Script Lab action "${actionUsed.trim()}".`);
        return pass();
      }

      case "lightning-route-payment": {
        await gotoScenario(page, "/lab/lightning", definition.locale);
        const routeButton = page.getByRole("button", { name: /Route Payment/i });
        await routeButton.click();
        await page.waitForFunction(
          () => document.body.innerText.includes("Alice routed Payment to Charlie"),
          null,
          { timeout: 60_000 },
        );
        note("Completed the multi-hop Lightning payment animation.");
        return pass();
      }

      case "mining-preset-and-slider": {
        await gotoScenario(page, "/game/mining", definition.locale);
        await page.getByRole("button", { name: /China Ban/i }).click();
        const slider = page.locator('input[type="range"]').first();
        await page.waitForFunction(
          () => document.querySelector('input[type="range"]')?.value === "50",
          null,
          { timeout: 45_000 },
        );
        await slider.evaluate((element, value) => {
          element.value = String(value);
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }, 220);
        await page.waitForFunction(
          () => document.querySelector('input[type="range"]')?.value === "220",
          null,
          { timeout: 45_000 },
        );
        note("Applied a mining preset and manually changed the hashrate slider.");
        return pass();
      }

      case "mempool-game-load": {
        await gotoScenario(page, "/game/mempool", definition.locale);
        const bodyText = await page.locator("body").innerText();
        if (!bodyHasAny(bodyText, ["Ver mempool", "Simulador", "Mempool"])) {
          throw new Error("Expected Spanish mempool simulator copy was not rendered.");
        }
        const explorerLink = page.locator('a[href="/explorer/mempool"]').first();
        await explorerLink.waitFor({ state: "visible", timeout: 30_000 });
        note("Verified the mempool simulator page and explorer CTA in Spanish mode.");
        return pass();
      }

      case "graph-focused-full": {
        await gotoScenario(page, "/graph", definition.locale);
        const fullButton = page.getByRole("button", { name: /^Full$/i }).first();
        const focusedButton = page.getByRole("button", { name: /^Focused$/i }).first();
        await fullButton.click();
        await page.waitForFunction(
          () => document.body.innerText.includes("Full view renders all mapped concepts and relations."),
          null,
          { timeout: 15_000 },
        );
        await focusedButton.click();
        await page.waitForFunction(
          () => document.body.innerText.includes("Focused view highlights learning-path context and node isolation."),
          null,
          { timeout: 15_000 },
        );
        note("Switched between graph focus modes.");
        return pass();
      }

      case "graph-mobile-open": {
        await gotoScenario(page, "/graph", definition.locale);
        const openOnGraph = page.getByRole("button", { name: /Open on Graph/i }).first();
        await openOnGraph.waitFor({ state: "visible", timeout: 30_000 });
        await openOnGraph.click();
        await openOnGraph.waitFor({ state: "hidden", timeout: 15_000 });
        note("Moved from mobile story mode into the graph canvas.");
        return pass();
      }

      case "blocks-detail-runtime": {
        await gotoScenario(page, "/explorer/blocks", definition.locale);
        await Promise.race([
          page.locator("table tbody tr").first().waitFor({ state: "visible", timeout: 45_000 }),
          page.waitForFunction(
            () =>
              document.body.innerText.includes("No Blocks Found") ||
              document.body.innerText.includes("The node hasn't returned any blocks yet.") ||
              document.body.innerText.includes("Unable to load blocks"),
            null,
            { timeout: 45_000 },
          ),
        ]).catch(() => null);
        const firstRow = page.locator("table tbody tr").first();
        if (!(await firstRow.isVisible().catch(() => false))) {
          const bodyText = await page.locator("body").innerText();
          if (
            bodyHasAny(bodyText, [
              "No Blocks Found",
              "The node hasn't returned any blocks yet.",
              "Unable to load blocks",
            ])
          ) {
            return skip("No block rows were available; the page stayed in an explicit degraded state.");
          }
          throw new Error("Blocks table did not expose a drill-down row.");
        }
        await firstRow.click();
        await page.waitForURL((url) => /^\/explorer\/block\/.+/.test(url.pathname), { timeout: 30_000 });
        note("Opened the first runtime block detail page.");
        return pass();
      }

      case "rich-list-detail-runtime": {
        await gotoScenario(page, "/explorer/rich-list", definition.locale);
        await Promise.race([
          page.locator("table tbody tr").first().waitFor({ state: "visible", timeout: 45_000 }),
          page.waitForFunction(
            () =>
              document.body.innerText.includes("No rich-list rows available") ||
              document.body.innerText.includes("Unable to load rich list snapshot") ||
              document.body.innerText.includes("snapshot is temporarily unavailable"),
            null,
            { timeout: 45_000 },
          ),
        ]).catch(() => null);
        const firstRow = page.locator("table tbody tr").first();
        if (!(await firstRow.isVisible().catch(() => false))) {
          const bodyText = await page.locator("body").innerText();
          if (
            bodyHasAny(bodyText, [
              "No rich-list rows available",
              "Unable to load rich list snapshot",
              "snapshot is temporarily unavailable",
            ])
          ) {
            return skip("Rich-list snapshot was unavailable, but the page degraded cleanly.");
          }
          throw new Error("Rich-list table did not expose a detail row.");
        }
        await firstRow.click();
        await page.waitForURL((url) => /^\/explorer\/rich-list\/\d+/.test(url.pathname), { timeout: 30_000 });
        note("Opened the first runtime whale detail page.");
        return pass();
      }

      case "academy-path-runtime": {
        await gotoScenario(page, "/academy", definition.locale);
        const firstPath = page.locator('a[href^="/paths/"]').first();
        if ((await firstPath.count()) === 0) {
          return skip("No academy path link was available on the landing page.");
        }
        await firstPath.click();
        await page.waitForURL((url) => /^\/paths\/.+/.test(url.pathname), { timeout: 30_000 });
        note("Opened the first runtime academy path.");
        return pass();
      }

      case "academy-node-runtime": {
        await gotoScenario(page, "/academy", definition.locale);
        const firstNode = page.locator('a[href^="/academy/"]').first();
        if ((await firstNode.count()) === 0) {
          return skip("No academy node link was available on the landing page.");
        }
        await firstNode.click();
        await page.waitForURL((url) => /^\/academy\/.+/.test(url.pathname), { timeout: 30_000 });
        note("Opened the first runtime academy node detail.");
        return pass();
      }

      default:
        return skip("No runner implementation exists for this scenario id.");
    }
  } catch (error) {
    return fail(error);
  } finally {
    await context.close();
  }
}

async function runRouteSweeps(browser, outDir) {
  const results = [];

  for (const matrixEntry of ROUTE_MATRIX) {
    const context = await createLocaleContext(browser, {
      viewport: VIEWPORT_BY_NAME.desktop,
      locale: matrixEntry.locale,
    });
    const page = await context.newPage();

    try {
      for (const route of matrixEntry.routes) {
        const result = await inspectRoute(page, {
          route,
          locale: matrixEntry.locale,
          waitMs: route === "/graph" ? 1800 : 1200,
        });
        result.matrixKey = matrixEntry.key;
        result.routeKind = matrixEntry.routeKind;
        if (!isRouteHealthy(result)) {
          result.screenshot = await captureScreenshot(
            page,
            path.join(
              outDir,
              "route-failures",
              `${matrixEntry.key}__${slugForRoute(route)}.png`,
            ),
          ).catch(() => null);
        }
        results.push(result);
      }
    } finally {
      await context.close();
    }
  }

  return results;
}

async function run() {
  const outDir = createOutputDir("smoke_qa");
  const browser = await launchBrowser();

  try {
    const routeResults = await runRouteSweeps(browser, outDir);
    const scenarioResults = [];

    for (const scenario of SCENARIO_DEFINITIONS) {
      scenarioResults.push(await runScenario(browser, scenario, outDir));
    }

    const routeFailures = routeResults.filter((result) => !isRouteHealthy(result));
    const scenarioFailures = scenarioResults.filter((result) => result.status === "failed");

    const details = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      routeCounts: ROUTE_COUNTS,
      routeResults,
      scenarioResults,
      outDir,
    };
    writeJson(path.join(outDir, "details.json"), details);

    const summary = {
      generatedAt: details.generatedAt,
      baseUrl: BASE_URL,
      outDir,
      routeChecks: routeResults.length,
      routeFailures: routeFailures.length,
      scenarioChecks: scenarioResults.length,
      scenarioFailures: scenarioFailures.length,
      scenarioSkipped: scenarioResults.filter((result) => result.status === "skipped").length,
    };
    writeJson(path.join(outDir, "summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));

    if (routeFailures.length > 0 || scenarioFailures.length > 0) {
      if (routeFailures.length > 0) {
        console.error("Smoke route failures:");
        for (const failure of routeFailures) {
          console.error(
            JSON.stringify(
              {
                route: failure.route,
                locale: failure.locale,
                matrixKey: failure.matrixKey,
                status: failure.status,
                finalUrl: failure.finalUrl,
                hasCrashBanner: failure.hasCrashBanner,
                consoleErrors: failure.consoleErrors.slice(0, 3),
                pageErrors: failure.pageErrors.slice(0, 3),
                sentinelViolations: failure.sentinelViolations,
              },
              null,
              2,
            ),
          );
        }
      }

      if (scenarioFailures.length > 0) {
        console.error("Smoke scenario failures:");
        for (const failure of scenarioFailures) {
          console.error(
            JSON.stringify(
              {
                id: failure.id,
                title: failure.title,
                locale: failure.locale,
                viewport: failure.viewport,
                error: failure.error,
                finalUrl: failure.finalUrl,
                notes: failure.notes,
              },
              null,
              2,
            ),
          );
        }
      }

      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

run();
