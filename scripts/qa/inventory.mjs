import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, "../..");
export const APP_DIR = path.join(PROJECT_ROOT, "app");
export const QA_ARTIFACT_ROOT = path.join(PROJECT_ROOT, "tmp_qa");
export const LOCALE_STORAGE_KEY = "rawblock-locale";

export const QA_VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "desktop", width: 1440, height: 1200 },
];

export const ROUTE_REDIRECTS = [
  { path: "/explorer/api", destination: "/explorer/rpc" },
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

export const SCENARIO_DEFINITIONS = [
  {
    id: "language-toggle-renders",
    title: "Language toggle changes rendered UI text",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "decoder-sample-decode",
    title: "Decoder sample button populates a decoded result",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "network-primary-view",
    title: "Network explorer exposes its primary map and peer surface",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "blocks-compare-submit",
    title: "Blocks compare accepts two heights and renders comparison output",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "rpc-safe-command",
    title: "RPC explorer runs a safe read-only command",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "academy-search-open",
    title: "Academy search filters and opens a node",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "research-filter-open",
    title: "Research filters open and narrow the current data set",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "script-lab-run-or-step",
    title: "Script Lab accepts a representative run or step action",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "lightning-route-payment",
    title: "Lightning simulator routes a payment",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "mining-preset-and-slider",
    title: "Mining simulator preset and slider both update hashrate",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "mempool-game-load",
    title: "Mempool simulator page renders and exposes its explorer CTA",
    locale: "es",
    viewport: "desktop",
  },
  {
    id: "graph-focused-full",
    title: "Graph page switches between focused and full view",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "graph-mobile-open",
    title: "Graph mobile story opens the selected node on the graph",
    locale: "en",
    viewport: "mobile",
  },
  {
    id: "blocks-detail-runtime",
    title: "Blocks list opens the first available block detail",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "rich-list-detail-runtime",
    title: "Rich list opens the first available whale detail",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "academy-path-runtime",
    title: "Academy landing opens the first available learning path",
    locale: "en",
    viewport: "desktop",
  },
  {
    id: "academy-node-runtime",
    title: "Academy landing opens the first available academy node",
    locale: "en",
    viewport: "desktop",
  },
];

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function compareRoutes(a, b) {
  if (a === "/") return -1;
  if (b === "/") return 1;
  return a.localeCompare(b);
}

function pageFileToRoute(pageFile) {
  const relative = path.relative(APP_DIR, pageFile);
  const withoutPage = relative.replace(/\/page\.tsx$/, "").replace(/page\.tsx$/, "");
  if (!withoutPage) return "/";
  return `/${withoutPage.split(path.sep).join("/")}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRouteInventory() {
  const redirectPaths = new Set(ROUTE_REDIRECTS.map((entry) => entry.path));
  const pageFiles = walkFiles(APP_DIR).filter((file) => file.endsWith(`${path.sep}page.tsx`));
  const discoveredRoutes = [...new Set(pageFiles.map(pageFileToRoute))].sort(compareRoutes);
  const dynamicRoutes = discoveredRoutes.filter((route) => route.includes("["));
  const staticRoutes = discoveredRoutes
    .filter((route) => !route.includes("["))
    .filter((route) => !redirectPaths.has(route))
    .sort(compareRoutes);

  return {
    pageFiles,
    discoveredRoutes,
    dynamicRoutes,
    staticRoutes,
  };
}

const inventory = buildRouteInventory();

export const DISCOVERED_PAGE_ROUTES = inventory.discoveredRoutes;
export const DYNAMIC_PAGE_ROUTES = inventory.dynamicRoutes;
export const STATIC_PAGE_ROUTES = inventory.staticRoutes;
export const SHARED_STATIC_ROUTES = STATIC_PAGE_ROUTES.filter((route) => !route.startsWith("/es/"));
export const SPANISH_STATIC_ROUTES = STATIC_PAGE_ROUTES.filter((route) => route.startsWith("/es/"));

export const ROUTE_ENTRIES = STATIC_PAGE_ROUTES.map((route) => ({
  route,
  kind: "page",
  releaseCritical: true,
  localeScope: route.startsWith("/es/") ? ["es"] : ["en", "es"],
  viewportScope: QA_VIEWPORTS.map((viewport) => viewport.name),
}));

export const ROUTE_MATRIX = [
  {
    key: "shared-en",
    locale: "en",
    routeKind: "shared",
    routes: SHARED_STATIC_ROUTES,
  },
  {
    key: "shared-es",
    locale: "es",
    routeKind: "shared",
    routes: SHARED_STATIC_ROUTES,
  },
  {
    key: "prefixed-es",
    locale: "es",
    routeKind: "prefixed",
    routes: SPANISH_STATIC_ROUTES,
  },
];

const benignConsoleRules = [
  {
    routes: ["/explorer/mempool"],
    patterns: [
      /Failed to fetch candidate block/i,
      /WebSocket connection to 'wss:\/\/apigoland\.rawblock\.net\/ws' failed: Error during WebSocket handshake: Unexpected response code: 400/i,
    ],
  },
  {
    routes: ["/explorer/blocks"],
    patterns: [/Failed to fetch candidate block/i, /Unable to load blocks/i],
  },
  {
    routes: ["/explorer/network"],
    patterns: [/Failed to fetch peers:/i, /Failed to fetch network stats/i],
  },
  {
    routes: ["/explorer/rich-list"],
    patterns: [/Failed to load rich list:/i],
  },
  {
    routes: ["/analysis/evolution"],
    patterns: [/Failed to load evolution payload:/i],
  },
  {
    routes: ["/analysis/graffiti"],
    patterns: [
      /WebSocket connection to 'wss:\/\/apigoland\.rawblock\.net\/ws' failed: Error during WebSocket handshake: Unexpected response code: 400/i,
    ],
  },
  {
    routes: ["/analysis/utxo"],
    patterns: [/UTXO Stats Error:/i],
  },
  {
    routes: ["/game/mempool", "/es/game/mempool"],
    patterns: [
      /Unable to fetch mempool weather\./i,
      /Failed to fetch tx action plan\./i,
      /A tree hydrated but some attributes of the server rendered HTML didn't match the client properties/,
    ],
  },
  {
    routes: ["/explorer/blocks/compare"],
    patterns: [/Error fetching block 1:/i, /Error fetching block 2:/i],
  },
];

const spanishSentinelRules = [
  {
    routes: ["/"],
    description: "dashboard CTA leaked English",
    patterns: [new RegExp(`\\b${escapeRegExp("View")}\\b`)],
  },
  {
    routes: ["/game/mempool"],
    description: "mempool simulator CTA leaked English",
    patterns: [/View Live Mempool Feed/],
  },
  {
    routes: ["/graph"],
    description: "graph page leaked English controls",
    patterns: [
      /Knowledge Graph/,
      /Options & Legend/,
      /Search by title, id, or type\.\.\./,
      /View Mode/,
      /\bFocused\b/,
      /\bFull\b/,
      /Mobile Focus Node/,
      /Switch to Full view to apply security-only filters\./,
      /Open on Graph/,
      /No story steps available for the current mode\./,
      /Clear Search/,
    ],
  },
];

export function isAllowedConsoleError({ route, text }) {
  const value = String(text || "");
  if (!value) return false;

  const globalPatterns = [
    /A tree hydrated but some attributes of the server rendered HTML didn't match the client properties/,
  ];
  if (globalPatterns.some((pattern) => pattern.test(value))) return true;

  return benignConsoleRules.some((rule) => {
    if (!rule.routes.includes(route)) return false;
    return rule.patterns.some((pattern) => pattern.test(value));
  });
}

export function findLocaleSentinelViolations({ route, locale, text }) {
  if (locale !== "es") return [];
  const value = String(text || "");
  if (!value) return [];

  const violations = [];

  for (const rule of spanishSentinelRules) {
    if (!rule.routes.includes(route)) continue;
    for (const pattern of rule.patterns) {
      if (pattern.test(value)) {
        violations.push({
          route,
          locale,
          description: rule.description,
          pattern: pattern.source,
        });
      }
    }
  }

  return violations;
}

export const ROUTE_COUNTS = {
  discoveredPages: DISCOVERED_PAGE_ROUTES.length,
  dynamicPages: DYNAMIC_PAGE_ROUTES.length,
  staticPages: STATIC_PAGE_ROUTES.length,
  sharedStaticPages: SHARED_STATIC_ROUTES.length,
  spanishStaticPages: SPANISH_STATIC_ROUTES.length,
  redirects: ROUTE_REDIRECTS.length,
  smokeMatrixPages: ROUTE_MATRIX.reduce((count, entry) => count + entry.routes.length, 0),
};
