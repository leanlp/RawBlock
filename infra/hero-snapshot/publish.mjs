import { getSnapshotStore } from "./r2.mjs";

const NODE_TIMEOUT_MS = 2_500;
const STORE_TIMEOUT_MS = 4_000;
const REFRESH_MS = 15_000;
const ORIGIN = new URL(process.env.RAWBLOCK_HERO_PUBLISHER_ORIGIN ?? "http://127.0.0.1:8080");
const store = getSnapshotStore();
if (!store) throw new Error("Configure the RawBlock hero snapshot R2 URL and writer credentials.");
if (ORIGIN.protocol !== "http:" || ORIGIN.hostname !== "127.0.0.1" ||
    ORIGIN.pathname !== "/" || ORIGIN.search || ORIGIN.hash || ORIGIN.username || ORIGIN.password) {
  throw new Error("Use a loopback HTTP origin for the RawBlock Go API.");
}

async function readObservation(path, maxAgeMs, select) {
  const response = await fetch(new URL(path, ORIGIN), {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(NODE_TIMEOUT_MS),
  });
  if (!response.ok || response.headers.get("x-rawblock-data-source") !== "local_node") {
    throw new Error(`${path} returned no verified node data (HTTP ${response.status})`);
  }
  const observedAt = Date.parse(response.headers.get("x-rawblock-updated-at") ?? "");
  const age = Date.now() - observedAt;
  if (!Number.isFinite(age) || age < -5_000 || age > maxAgeMs) {
    throw new Error(`${path} has an invalid or old observation time`);
  }
  const payload = select(await response.json());
  if (!payload) throw new Error(`${path} returned incomplete metrics`);
  return { observedAt, payload };
}

function nonnegative(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function selectNetwork(data) {
  const { height, hashrate, fees } = data ?? {};
  if (!Number.isSafeInteger(height) || height < 0 || !nonnegative(hashrate) ||
      ![fees?.fast, fees?.medium, fees?.slow].every(nonnegative)) return null;
  return { height, hashrate, fees: { fast: fees.fast, medium: fees.medium, slow: fees.slow } };
}

function selectVitals(data) {
  const { size, bytes } = data?.mempool ?? {};
  if (!Number.isSafeInteger(size) || size < 0 || !Number.isSafeInteger(bytes) || bytes < 0) return null;
  return { mempool: { size, bytes } };
}

async function readPublished() {
  const request = await store.client.sign(store.url);
  const response = await fetch(request, { redirect: "error", signal: AbortSignal.timeout(STORE_TIMEOUT_MS) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`R2 read returned HTTP ${response.status}`);
  const etag = response.headers.get("etag");
  if (!etag) throw new Error("R2 did not return an ETag");
  const snapshot = await response.json().catch(() => null);
  return { etag, snapshot };
}

let lastPublished;
async function publish() {
  const [network, vitals] = await Promise.all([
    readObservation("/api/network-stats", 75_000, selectNetwork),
    readObservation("/api/vitals", 45_000, selectVitals),
  ]);
  if (lastPublished === undefined) lastPublished = await readPublished();
  const previous = lastPublished?.snapshot;
  if (previous?.version === 1) {
    const networkAt = previous.network?.observedAt;
    const vitalsAt = previous.vitals?.observedAt;
    if ((Number.isSafeInteger(networkAt) && network.observedAt < networkAt) ||
        (Number.isSafeInteger(vitalsAt) && vitals.observedAt < vitalsAt) ||
        (network.observedAt === networkAt && vitals.observedAt === vitalsAt)) return;
  }

  const snapshot = { version: 1, network, vitals };
  const request = await store.client.sign(store.url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(lastPublished ? { "If-Match": lastPublished.etag } : { "If-None-Match": "*" }),
    },
    body: JSON.stringify(snapshot),
  });
  const response = await fetch(request, { redirect: "error", signal: AbortSignal.timeout(STORE_TIMEOUT_MS) });
  if (response.status === 409 || response.status === 412) lastPublished = undefined;
  if (!response.ok) throw new Error(`R2 write returned HTTP ${response.status}`);
  const etag = response.headers.get("etag");
  lastPublished = etag ? { etag, snapshot } : undefined;
  console.log(`Hero snapshot published at height ${network.payload.height}`);
}

if (process.argv.includes("--once")) {
  await publish();
} else {
  let running = false;
  let pending = false;
  async function refresh() {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    do {
      pending = false;
      try {
        await publish();
      } catch (error) {
        console.warn("Hero snapshot publish failed:", error.message);
      }
    } while (pending);
    running = false;
  }

  const wsUrl = new URL("/ws", ORIGIN);
  wsUrl.protocol = "ws:";
  function subscribe() {
    const socket = new WebSocket(wsUrl);
    const timeout = setTimeout(() => socket.close(), 5_000);
    socket.addEventListener("open", () => clearTimeout(timeout), { once: true });
    socket.addEventListener("close", () => {
      clearTimeout(timeout);
      setTimeout(subscribe, 5_000);
    }, { once: true });
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      let type;
      try {
        type = JSON.parse(event.data)?.type;
      } catch {
        return;
      }
      if (type === "block:new") void refresh();
    });
  }

  void refresh();
  setInterval(refresh, REFRESH_MS);
  subscribe();
}
