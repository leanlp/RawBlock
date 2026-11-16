import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { test } from "node:test";

const startHeight = 976_118;
const snapshotPath = "/fixtures/hero/v1/latest.json";
const signature = /^AWS4-HMAC-SHA256 Credential=(test-reader|test-writer)\//;

async function listen(t, handler) {
  const server = createServer(handler);
  const connections = new Set();
  server.on("connection", socket => {
    connections.add(socket);
    socket.on("close", () => connections.delete(socket));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    for (const socket of connections) socket.destroy();
    await new Promise(done => server.close(done));
  });
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

function fixtureData(observedAt = Date.now() - 1_000) {
  return {
    version: 1,
    network: { observedAt, payload: { height: startHeight, hashrate: 950e18, fees: { fast: 5, medium: 3, slow: 1 } } },
    vitals: { observedAt, payload: { mempool: { size: 0, bytes: 0 } } },
  };
}

async function fixtures(t, { initial = null, mode = "healthy", source = fixtureData(), readDelay = 0 } = {}) {
  let snapshot = initial;
  let reads = 0;
  let writes = 0;
  let etag = '"fixture-0"';
  const sockets = new Set();
  const gateway = await listen(t, (request, response) => {
    const isNetwork = request.url === "/api/network-stats";
    const value = isNetwork ? source.network : source.vitals;
    if (mode === "offline" || (mode === "partial" && !isNetwork)) {
      response.writeHead(503).end();
      return;
    }
    const send = () => response.writeHead(200, {
      "content-type": "application/json",
      "x-rawblock-data-source": "local_node",
      "x-rawblock-updated-at": new Date(value.observedAt).toISOString(),
    }).end(JSON.stringify(value.payload));
    if (mode === "slow") setTimeout(send, 1_900);
    else send();
  });
  gateway.server.on("upgrade", (request, socket) => {
    const accept = createHash("sha1")
      .update(request.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
      .digest("base64");
    socket.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`);
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  const storage = await listen(t, async (request, response) => {
    const role = request.headers.authorization?.match(signature)?.[1];
    if (request.url !== snapshotPath || !role) return response.writeHead(403).end();
    if (request.method === "PUT") {
      if (role !== "test-writer") return response.writeHead(403).end();
      if (snapshot ? request.headers["if-match"] !== etag : request.headers["if-none-match"] !== "*") {
        return response.writeHead(412).end();
      }
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      snapshot = JSON.parse(Buffer.concat(chunks).toString());
      etag = `"fixture-${++writes}"`;
      return response.writeHead(200, { etag }).end();
    }
    if (role === "test-reader") reads++;
    const send = () => snapshot
      ? response.writeHead(200, { etag, "content-type": "application/json" }).end(JSON.stringify(snapshot))
      : response.writeHead(404).end();
    if (readDelay) setTimeout(send, readDelay);
    else send();
  });

  return {
    get snapshot() { return snapshot; },
    get reads() { return reads; },
    get writes() { return writes; },
    get connected() { return sockets.size > 0; },
    changeSource(next) { source = next; },
    changeMode(next) { mode = next; },
    notifyBlock() {
      const message = Buffer.from(JSON.stringify({ type: "block:new", payload: { height: startHeight + 1 } }));
      const frame = Buffer.concat([Buffer.from([0x81, message.length]), message]);
      for (const socket of sockets) socket.write(frame);
    },
    env(role) {
      return {
        ...process.env,
        VERCEL: "",
        RAWBLOCK_API_URL: gateway.base,
        RAWBLOCK_HERO_API_URL: "",
        RAWBLOCK_HERO_API_TOKEN: "",
        RAWBLOCK_HERO_PUBLISHER_ORIGIN: gateway.base,
        RAWBLOCK_HERO_SNAPSHOT_URL: storage.base + snapshotPath,
        RAWBLOCK_HERO_SNAPSHOT_ACCESS_KEY_ID: "test-" + role,
        RAWBLOCK_HERO_SNAPSHOT_SECRET_ACCESS_KEY: "test-secret",
      };
    },
  };
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  child.kill();
  await exited;
}

async function app(t, fixture) {
  const child = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"),
    "start", "--hostname", "127.0.0.1", "--port", "0"], { env: fixture.env("reader") });
  t.after(() => stop(child));
  return new Promise((done, fail) => {
    let output = "";
    const timer = setTimeout(() => fail(new Error(output)), 10_000);
    const onOutput = chunk => {
      output += chunk;
      const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url && output.includes("Ready in")) {
        clearTimeout(timer);
        done(url);
      }
    };
    child.stdout.on("data", onOutput);
    child.stderr.on("data", onOutput);
    child.once("exit", code => {
      clearTimeout(timer);
      fail(new Error(`Next.js stopped (${code})\n${output}`));
    });
  });
}

async function readHero(base) {
  const response = await fetch(base + "/api/bitcoin/metrics?view=hero", { signal: AbortSignal.timeout(6_000) });
  return { response, body: await response.json() };
}

async function until(condition) {
  const deadline = Date.now() + 5_000;
  while (!condition()) {
    if (Date.now() >= deadline) throw new Error("Timed out waiting for publisher");
    await new Promise(done => setTimeout(done, 25));
  }
}

test("healthy metrics get a short CDN TTL without reading R2", async t => {
  const fixture = await fixtures(t);
  const base = await app(t, fixture);
  const html = await (await fetch(base)).text();
  assert.match(html, /976,118/);
  const { response, body } = await readHero(base);
  assert.equal(body.metrics.mempool.value.count, 0);
  assert.equal(response.headers.get("vercel-cdn-cache-control"), "public, s-maxage=5");
  assert.equal(fixture.reads, 0);
});

test("node publisher writes on startup and block events, and SSR uses the snapshot during outage", async t => {
  const fixture = await fixtures(t);
  const child = spawn(process.execPath, ["infra/hero-snapshot/publish.mjs"], { env: fixture.env("writer") });
  t.after(() => stop(child));
  await until(() => fixture.writes === 1 && fixture.connected);
  const next = fixtureData(Date.now());
  next.network.payload.height++;
  fixture.changeSource(next);
  fixture.notifyBlock();
  await until(() => fixture.writes === 2);
  await stop(child);

  fixture.changeSource(fixtureData(Date.now() - 25_000));
  const older = spawn(process.execPath, ["infra/hero-snapshot/publish.mjs", "--once"], { env: fixture.env("writer") });
  assert.deepEqual(await once(older, "exit"), [0, null]);
  assert.equal(fixture.writes, 2);
  assert.equal(fixture.snapshot.network.observedAt, next.network.observedAt);

  fixture.changeMode("offline");
  const base = await app(t, fixture);
  const html = await (await fetch(base)).text();
  assert.match(html, /976,119/);
  assert.match(html, /Cached Snapshot/i);
  const { response, body } = await readHero(base);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("vercel-cdn-cache-control"), null);
  assert.equal(body.metrics.height.value, startHeight + 1);
  assert.equal(body.metrics.height.observedAt, next.network.observedAt);
  assert.equal(body.metrics.height.lastKnown, true);
});

test("a partial gateway response retains the live height and fills the missing mempool", async t => {
  const backup = fixtureData();
  backup.network.payload.height--;
  const base = await app(t, await fixtures(t, { initial: backup, mode: "partial" }));
  const { response, body } = await readHero(base);
  assert.equal(body.metrics.height.value, startHeight);
  assert.equal(body.metrics.height.lastKnown, undefined);
  assert.equal(body.metrics.mempool.value.count, 0);
  assert.equal(body.metrics.mempool.lastKnown, true);
  assert.equal(response.headers.get("vercel-cdn-cache-control"), null);
});

test("missing, invalid, or unreachable snapshots leave the unavailable response uncached", async t => {
  for (const storage of [
    { initial: null },
    { initial: fixtureData(Date.now() - 360_000) },
    { initial: fixtureData(Date.now() + 60_000) },
    { initial: fixtureData(), readDelay: 1_800 },
  ]) {
    const base = await app(t, await fixtures(t, { ...storage, mode: "offline" }));
    const { response, body } = await readHero(base);
    assert.equal(response.status, 503);
    assert.equal(body.metrics.height, null);
    assert.equal(response.headers.get("vercel-cdn-cache-control"), null);
  }
});

test("a valid stored snapshot returns before a slow gateway finishes", async t => {
  const base = await app(t, await fixtures(t, { initial: fixtureData(), mode: "slow" }));
  const start = performance.now();
  const { body } = await readHero(base);
  const elapsed = Math.round(performance.now() - start);
  assert.equal(body.metrics.height.lastKnown, true);
  assert.ok(elapsed < 1_900, `snapshot took ${elapsed} ms`);
});
