import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const HEADLESS = process.env.HEADLESS ? process.env.HEADLESS !== "false" : true;
const CHROME_PATH =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const routes = [
  "/",
  "/about",
  "/explorer/mempool",
  "/explorer/network",
  "/explorer/blocks",
  "/explorer/decoder",
  "/explorer/rich-list",
  "/explorer/fees",
  "/explorer/miners",
  "/explorer/vitals",
  "/explorer/rpc",
  "/analysis/utxo",
  "/analysis/forensics",
  "/analysis/evolution",
  "/analysis/incidents",
  "/analysis/bridges",
  "/analysis/d-index",
  "/analysis/graffiti",
  "/lab/script",
  "/lab/taproot",
  "/lab/keys",
  "/lab/lightning",
  "/lab/hashing",
  "/lab/consensus",
  "/game/tetris",
  "/game/mining",
  "/academy",
  "/research",
  "/research/vulnerabilities",
];

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "desktop", width: 1440, height: 1200 },
];

function slugForRoute(route) {
  return route === "/"
    ? "home"
    : route
      .replace(/^\//, "")
      .replace(/\//g, "__")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
}

function nowSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}${pad(d.getSeconds())}`;
}

const outDir = path.join(process.cwd(), "tmp_qa", `route_qa_${nowSlug()}`);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: HEADLESS,
  executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
});

const results = [];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  for (const route of routes) {
    const url = new URL(route, BASE_URL).toString();
    const slug = slugForRoute(route);

    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const status = resp?.status() ?? null;

      // Let React settle and any charts/modules paint before we evaluate metrics.
      await page.waitForTimeout(1400);

      const metrics = await page.evaluate(() => {
        const d = document;
        const root = d.documentElement;
        const horizontalOverflow = root.scrollWidth - window.innerWidth > 1;

        const allCandidates = [
          ...d.querySelectorAll("button, a, input, select, textarea, [role='button']"),
        ];
        const visible = allCandidates.filter((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const className = typeof el.className === "string" ? el.className : "";
          const isSrOnly = className.includes("sr-only");
          const clipped =
            cs.clip === "rect(0px, 0px, 0px, 0px)" ||
            cs.clipPath.includes("inset(50%)") ||
            cs.clipPath.includes("inset(100%)");
          const fullyTransparent = Number.parseFloat(cs.opacity || "1") === 0;
          const ariaHidden = el.getAttribute("aria-hidden") === "true";

          return (
            r.width > 0 &&
            r.height > 0 &&
            cs.visibility !== "hidden" &&
            cs.display !== "none" &&
            !isSrOnly &&
            !clipped &&
            !fullyTransparent &&
            !ariaHidden
          );
        });

        const tapViolations = visible
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || "").trim().slice(0, 48),
              w: Math.round(r.width),
              h: Math.round(r.height),
            };
          })
          .filter((x) => x.w < 44 || x.h < 44);

        const grids = [...d.querySelectorAll("*")].filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.display !== "grid") return false;
          const r = el.getBoundingClientRect();
          return r.width > 280 && el.children.length > 1;
        });

        const multiColGridOnMobile =
          window.innerWidth < 768
            ? grids.some((el) => {
              const gtc = getComputedStyle(el).gridTemplateColumns;
              if (!gtc || gtc === "none") return false;
              const cols = gtc.split(" ").filter(Boolean).length;
              return cols > 1;
            })
            : false;

        const paragraphs = [...d.querySelectorAll("p")].slice(0, 160);
        const ratios = paragraphs
          .map((p) => {
            const cs = getComputedStyle(p);
            const fs = parseFloat(cs.fontSize || "0");
            if (!fs) return 0;
            const lh = cs.lineHeight;
            if (lh === "normal") return 1.2;
            if (lh.endsWith("px")) return parseFloat(lh) / fs;
            const n = parseFloat(lh);
            return Number.isFinite(n) ? n : 1.2;
          })
          .filter((v) => v > 0);
        const minLineHeightRatio = ratios.length ? Math.min(...ratios) : null;

        const text = d.body?.innerText || "";
        const hasConnectingConnecting = text.includes("ConnectingConnecting");
        const hasBadHashrateFallback = text.includes("986,972 EH/s") || text.includes("986972 EH/s");

        return {
          horizontalOverflow,
          tapViolationsCount: tapViolations.length,
          tapViolationsTop: tapViolations.slice(0, 10),
          multiColGridOnMobile,
          minLineHeightRatio,
          hasConnectingConnecting,
          hasBadHashrateFallback,
        };
      });

      const screenshot = path.join(outDir, `${vp.name}__${slug}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });

      results.push({ route, viewport: vp.name, url, status, screenshot, error: null, ...metrics });
    } catch (e) {
      results.push({
        route,
        viewport: vp.name,
        url,
        status: null,
        screenshot: null,
        error: e?.message || String(e),
      });
    }
  }

  await context.close();
}

await browser.close();

fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));

const summary = {
  generatedAt: new Date().toISOString(),
  base: BASE_URL,
  outDir,
  routeCount: routes.length,
  viewportCount: viewports.length,
  totalChecks: results.length,
  errors: results.filter((r) => r.error).length,
  non200: results.filter((r) => !r.error && typeof r.status === "number" && r.status >= 400).length,
  overflow: results.filter((r) => r.horizontalOverflow).length,
  mobileMultiCol: results.filter((r) => r.viewport === "mobile" && r.multiColGridOnMobile).length,
  tapViolations: results.filter((r) => (r.tapViolationsCount || 0) > 0).length,
  lowLineHeight: results.filter((r) => r.minLineHeightRatio !== null && r.minLineHeightRatio < 1.5)
    .length,
  connectingDupes: results.filter((r) => r.hasConnectingConnecting).length,
  badHashrateFallback: results.filter((r) => r.hasBadHashrateFallback).length,
};

fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
