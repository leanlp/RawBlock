import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { expect } from "@playwright/test";
import { createLocaleContext, launchBrowser } from "./qa/runtime.mjs";

const height = 981_234;
const added = "a1".repeat(32);
const removed = "b2".repeat(32);
const retained = "c3".repeat(32);
const candidate = { height: height + 1, totalFees: 0, totalWeight: 0, transactions: [] };

function snapshotHeaders(now = Date.now()) {
  return {
    "access-control-allow-origin": "*",
    "access-control-expose-headers": "X-RawBlock-Data-Source, X-RawBlock-Updated-At",
    "x-rawblock-data-source": "local_node",
    "x-rawblock-updated-at": new Date(now).toISOString(),
  };
}

function row(txid) {
  return { txid, fee: 0.00001, size: 100, time: Math.floor(Date.now() / 1000) - 5 };
}

function startGateway(mode = "healthy") {
  const server = createServer((request, response) => {
    if (request.headers.accept !== "application/json" || request.headers.authorization) {
      response.writeHead(403);
      response.end();
      return;
    }
    if (mode === "stalled-body" && request.url === "/api/vitals") {
      response.writeHead(200, { ...snapshotHeaders(), "content-type": "application/json" });
      response.write('{"mempool":');
      return;
    }
    const payloads = {
      "/api/network-stats": {
        height,
        hashrate: 950e18,
        fees: { fast: 3, medium: 2, slow: 1 },
      },
      "/api/vitals": { mempool: { size: 0, bytes: 0 }, peers: 8 },
      "/api/mempool-recent": [],
    };
    const body = payloads[request.url];
    const status = request.url === "/api/fee-history" ? 503 : body ? 200 : 404;
    response.writeHead(status, {
      ...snapshotHeaders(mode === "old-observation" ? Date.now() - 600_000 : Date.now()),
      "content-type": "application/json",
    });
    response.end(JSON.stringify(body ?? { error: "Fixture endpoint unavailable" }));
  });
  server.listen(0, "127.0.0.1");
  return server;
}

function startApp(gatewayUrl) {
  const child = spawn(
    process.execPath,
    [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "0"],
    { env: { ...process.env, RAWBLOCK_API_URL: gatewayUrl }, stdio: ["ignore", "pipe", "pipe"] },
  );
  const ready = new Promise((resolveUrl, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      reject(new Error("Next.js fixture app did not start:\n" + output));
    }, 20_000);
    const read = (chunk) => {
      output = (output + chunk).slice(-8000);
      const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url && /Ready in/.test(output)) {
        clearTimeout(timer);
        resolveUrl(url);
      }
    };
    child.stdout.on("data", read);
    child.stderr.on("data", read);
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("Next.js fixture app exited with code " + code + ":\n" + output));
    });
  });
  return { child, ready };
}

let gateway;
let app;
let browser;
let base;

before(async () => {
  gateway = startGateway();
  await once(gateway, "listening");
  app = startApp("http://127.0.0.1:" + gateway.address().port + "/api/");
  base = await app.ready;
  browser = await launchBrowser();
});

async function isolatedApp(t, mode) {
  const isolatedGateway = startGateway(mode);
  await once(isolatedGateway, "listening");
  const isolated = startApp("http://127.0.0.1:" + isolatedGateway.address().port);
  t.after(async () => {
    if (isolated.child.exitCode === null && isolated.child.signalCode === null) {
      const exited = once(isolated.child, "exit");
      isolated.child.kill();
      await exited;
    }
    isolatedGateway.closeAllConnections();
    await new Promise((done) => isolatedGateway.close(done));
  });
  return isolated.ready;
}

after(async () => {
  try {
    await browser?.close();
  } finally {
    if (app?.child.exitCode === null && app.child.signalCode === null) {
      const exited = once(app.child, "exit");
      app.child.kill();
      await exited;
    }
    gateway?.closeAllConnections();
    if (gateway?.listening) {
      await new Promise((done) => gateway.close(done));
    }
  }
});

function homeCard(page, href, label) {
  return page.locator('a[href="' + href + '"]').filter({ hasText: label }).first();
}

async function expectVisibleValue(locator, value) {
  const metric = locator.getByText(value, { exact: true });
  await expect(metric).toBeVisible();
  const visible = await metric.evaluate((element) => {
    for (let parent = element; parent; parent = parent.parentElement) {
      if (getComputedStyle(parent).opacity === "0") return false;
    }
    return true;
  });
  assert.equal(visible, true, "the metric must be visible without entrance animations");
}

test("homepage renders verified height and a valid zero before hydration", async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: "en-US" });
  try {
    const page = await context.newPage();
    const response = await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200);
    await expectVisibleValue(homeCard(page, "/explorer/blocks", /Block Height/i), "981,234");
    await expectVisibleValue(homeCard(page, "/explorer/mempool", /Pending TXs/i), "0");
  } finally {
    await context.close();
  }
});

test("a stalled upstream JSON body leaves healthy SSR metrics available within the deadline", async (t) => {
  const url = await isolatedApp(t, "stalled-body");
  const started = performance.now();
  const response = await fetch(url + "/api/bitcoin/metrics?view=hero");
  const { ok, metrics } = await response.json();
  assert.equal(ok, true);
  assert.equal(metrics.height?.value, height);
  assert.equal(metrics.mempool, null);
  assert.ok(performance.now() - started < 2500, "core response must obey its one-second upstream budget");
});

test("over-age observations cannot become fresh SSR numbers", async (t) => {
  const url = await isolatedApp(t, "old-observation");
  const response = await fetch(url + "/api/bitcoin/metrics?view=hero");
  const { metrics } = await response.json();
  assert.equal(metrics.height, null);
  assert.equal(metrics.mempool, null);
});

test("mobile Spanish homepage retains the seeded height during hydration and shows no fake rows", async () => {
  const context = await createLocaleContext(browser, {
    viewport: { width: 390, height: 844 },
    locale: "es",
  });
  try {
    await context.route("**/ingest/**", (route) => route.abort());
    let coreRefreshes = 0;
    context.on("request", (request) => {
      if (new URL(request.url()).searchParams.get("view") === "hero") coreRefreshes++;
    });
    await context.addInitScript(() => {
      window.observedHeights = [];
      new MutationObserver(() => {
        for (const link of document.querySelectorAll('a[href="/explorer/blocks"]')) {
          if (!/Block Height|Altura del Bloque/i.test(link.innerText)) continue;
          const value = link.innerText.split("\n").find((line) => /^\d[\d,.]*$/.test(line));
          if (value) window.observedHeights.push(value.replaceAll(/[,.]/g, ""));
        }
      }).observe(document, { childList: true, subtree: true, characterData: true });
    });
    const page = await context.newPage();
    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    const card = homeCard(page, "/explorer/blocks", /Altura del Bloque/i);
    await expect(card).toBeVisible();
    const heightValues = await page.evaluate(() => [...new Set(window.observedHeights)]);
    assert.deepEqual(heightValues, [String(height)]);
    assert.equal(coreRefreshes, 0);
    await expect(page.getByText(/25fa769a|fa8306ca|bb9a969c/)).toHaveCount(0);
  } finally {
    await context.close();
  }
});

function livePayload(type, txid, seq, now) {
  return JSON.stringify({
    type: "mempool:lifecycle",
    payload: { type, txid, seq, timestamp: now, firstSeen: now, feeBTC: 0.00001, vsize: 100 },
  });
}

function heartbeat(timestamp) {
  return JSON.stringify({ type: "fee:regime", payload: { txCount: 0, timestamp } });
}

async function startExplorer(t, recent, candidateBlock, prepare) {
  const context = await browser.newContext({ locale: "en-US" });
  t.after(() => context.close());
  await context.route("**/ingest/**", (route) => route.abort());
  await context.route("**/api/mempool-recent", recent);
  await context.route("**/api/candidate-block", candidateBlock ?? ((route) =>
    route.fulfill({ json: candidate, headers: snapshotHeaders() })));
  await prepare?.(context);
  const page = await context.newPage();
  const sockets = [];
  await page.routeWebSocket(/\/ws(?:\?|$)/, (socket) => sockets.push(socket));
  await page.clock.install();
  await page.goto(base + "/explorer/mempool", { waitUntil: "domcontentloaded" });
  const stream = page.getByTestId("mempool-stream-status");
  const table = page.getByTestId("mempool-recent-transactions");
  return { context, page, sockets, stream, table };
}

test("a late REST snapshot preserves new rows and removals from the stream", async (t) => {
  let resolveSnapshot;
  const pending = new Promise((done) => { resolveSnapshot = done; });
  const headers = snapshotHeaders(Date.now() - 5000);
  const { page, sockets, stream, table } = await startExplorer(t, async (route) => {
    await pending;
    await route.fulfill({ json: [row(removed), row(retained)], headers });
  });
  try {
    await expect.poll(() => sockets.length).toBe(1);
    const now = await page.evaluate(() => Math.floor(Date.now() / 1000));
    sockets[0].send(livePayload("added", added, 1, now));
    sockets[0].send(livePayload("confirmed", removed, 2, now));
    await expect(stream).toContainText(/Live Node/i);
    await expect(table.getByText(added, { exact: true }).first()).toBeAttached();
    resolveSnapshot();
    await expect(table.getByText(retained, { exact: true }).first()).toBeAttached();
    await expect(table.getByText(added, { exact: true }).first()).toBeAttached();
    await expect(table.getByText(removed, { exact: true })).toHaveCount(0);
  } finally {
    resolveSnapshot();
  }
});

test("REST stays usable while the socket is silent and the stream reconnects automatically", async (t) => {
  const { page, sockets, stream, table } = await startExplorer(t, (route) =>
    route.fulfill({ json: [row(retained)], headers: snapshotHeaders() }));
  await expect.poll(() => sockets.length).toBe(1);
  await expect(table.getByText(retained, { exact: true }).first()).toBeAttached();
  await expect(stream).not.toContainText(/Live Node/i);
  sockets[0].send(heartbeat(await page.evaluate(() => Math.floor(Date.now() / 1000))));
  await expect(stream).toContainText(/Live Node/i);
  await page.clock.fastForward(50_000);
  sockets[0].send(heartbeat(await page.evaluate(() => Math.floor(Date.now() / 1000))));
  await page.clock.runFor(100);
  await page.clock.fastForward(60_000);
  await expect(stream).toContainText(/Live Node/i);
  await page.clock.fastForward(55_000);
  await page.clock.fastForward(6_000);
  await expect.poll(() => sockets.length).toBe(2);
  await expect(table.getByText(retained, { exact: true }).first()).toBeAttached();
  await expect(stream).not.toContainText(/Live Node/i);
  sockets[1].send(heartbeat(await page.evaluate(() => Math.floor(Date.now() / 1000))));
  await expect(stream).toContainText(/Live Node/i);
});

test("a public fallback preserves one satoshi without changing healthy socket status", async (t) => {
  const { page, sockets, stream, table } = await startExplorer(t, (route) =>
    route.fulfill({ status: 503, json: { error: "Fixture node outage" }, headers: snapshotHeaders() }),
  undefined, (ctx) => ctx.route("https://mempool.space/api/mempool/recent", (route) =>
    route.fulfill({ json: [{ txid: retained, fee: 1, vsize: 100 }], headers: snapshotHeaders() })));
  await expect.poll(() => sockets.length).toBe(1);
  sockets[0].send(heartbeat(await page.evaluate(() => Math.floor(Date.now() / 1000))));
  await expect(stream).toContainText(/Live Node/i);
  await expect(table.getByText("0.00000001", { exact: true }).first()).toBeAttached();
  await expect(page.getByTestId("mempool-snapshot-status")).toContainText(/Public API Fallback/i);
  await expect(stream).toContainText(/Live Node/i);
  await page.setViewportSize({ width: 390, height: 844 });
  const columns = await table.getByText(retained, { exact: true }).evaluate((element) =>
    getComputedStyle(element.parentElement).gridTemplateColumns.trim().split(/\s+/).length);
  assert.equal(columns, 1, "transaction details should stack on mobile");
});

test("malformed candidate-block transactions produce a recoverable unavailable state", async (t) => {
  const { page } = await startExplorer(t,
    (route) => route.fulfill({ json: [], headers: snapshotHeaders() }),
    (route) => route.fulfill({ json: { ...candidate, transactions: [null] }, headers: snapshotHeaders() }));
  await expect(page.getByTestId("candidate-block-panel")).toContainText(/Candidate block.*unavailable/i);
});

test("a hung candidate-block request times out and Retry recovers", async (t) => {
  let requests = 0;
  const { page } = await startExplorer(t, (route) =>
    route.fulfill({ json: [], headers: snapshotHeaders() }), async (route) => {
      requests++;
      if (requests > 1) await route.fulfill({ json: candidate, headers: snapshotHeaders() });
    });
  await expect.poll(() => requests).toBe(1);
  await page.clock.fastForward(6_000);
  const panel = page.getByTestId("candidate-block-panel");
  await expect(panel).toContainText(/Candidate block.*unavailable/i);
  await panel.getByRole("button", { name: /Retry/i }).click();
  await expect(panel.getByText("981,235", { exact: true })).toBeVisible();
});
