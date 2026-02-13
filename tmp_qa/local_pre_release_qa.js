const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:4100';
const ROUTES = [
  '/',
  '/research', '/research/vulnerabilities', '/research/attacks', '/research/assumptions', '/research/policy', '/research/policy-vs-consensus',
  '/academy', '/paths/bitcoin-foundations',
  '/explorer/mempool', '/explorer/network', '/explorer/blocks', '/explorer/decoder', '/explorer/rich-list', '/explorer/fees', '/explorer/miners', '/explorer/vitals', '/explorer/rpc',
  '/analysis/utxo', '/analysis/forensics', '/analysis/evolution', '/analysis/d-index', '/analysis/graffiti',
  '/lab/script', '/lab/taproot', '/lab/keys', '/lab/hashing', '/lab/consensus', '/lab/lightning',
  '/game/tetris', '/game/mining',
  '/graph'
];

const LEGACY_ROUTES = [
  '/simulations/mempool-tetris',
  '/simulations/mining',
  '/simulations/lightning',
  '/academy/bitcoin-foundations',
  '/academy/1',
  '/learn/what-is-bitcoin'
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 1366 },
  { name: 'mobile', width: 390, height: 844 }
];

(async () => {
  const ts = Date.now();
  const outDir = path.join(process.cwd(), 'tmp_qa', `local_pre_release_${ts}`);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const results = [];
  const aggregate = {
    totalChecks: 0,
    non200: 0,
    visible404: 0,
    overflowX: 0,
    duplicateCopyright: 0,
    homeLoadingWithStats: 0,
    mobileTitleClipped: 0,
    mobileTitleOverlapsMenu: 0,
    researchFilterOverflowRisk: 0,
    consoleErrors: 0,
    requestFailures: 0,
  };

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    for (const route of ROUTES) {
      const entry = {
        viewport: vp.name,
        route,
        status: null,
        finalUrl: null,
        title: null,
        h1: null,
        visible404: false,
        overflowX: false,
        duplicateCopyright: false,
        homeLoadingWithStats: false,
        mobileTitleClipped: false,
        mobileTitleOverlapsMenu: false,
        researchFilterOverflowRisk: false,
        consoleErrors: [],
        requestFailures: [],
      };

      const reqFails = [];
      const consErrs = [];
      const onReqFail = (req) => reqFails.push({ url: req.url(), error: req.failure()?.errorText || 'unknown' });
      const onConsole = (msg) => {
        if (msg.type() === 'error') consErrs.push(msg.text());
      };
      page.on('requestfailed', onReqFail);
      page.on('console', onConsole);

      try {
        const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(1200);
        entry.status = response?.status() ?? null;
        entry.finalUrl = page.url();

        const checks = await page.evaluate(() => {
          const getVisibleElemsWithText = (regex) =>
            Array.from(document.querySelectorAll('body *')).filter((el) => {
              const t = (el.textContent || '').trim();
              if (!t || !regex.test(t)) return false;
              const cs = window.getComputedStyle(el);
              if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || '1') === 0) return false;
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            });

          const title = document.title;
          const h1 = document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || null;
          const visible404 = getVisibleElemsWithText(/404: This page could not be found\.|This page could not be found\./i).length > 0;
          const overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

          const copyrightEls = getVisibleElemsWithText(/©\s*\d{4}\s*Raw Block/i);
          const duplicateCopyright = copyrightEls.length > 1;

          const bodyText = document.body?.innerText || '';
          const hasLoadingNetworkData = /Loading network data/i.test(bodyText);
          const hasStats = /Block Height|Hashrate|Pending TXs|Days to Halving/i.test(bodyText);
          const homeLoadingWithStats = hasLoadingNetworkData && hasStats;

          const menuButton = document.querySelector('button[aria-label="Toggle menu"]');
          const h1El = document.querySelector('h1');
          let mobileTitleClipped = false;
          let mobileTitleOverlapsMenu = false;

          if (h1El) {
            const r = h1El.getBoundingClientRect();
            mobileTitleClipped = r.left < -1 || r.right > window.innerWidth + 1;

            if (menuButton) {
              const m = menuButton.getBoundingClientRect();
              const overlap = !(m.right < r.left || m.left > r.right || m.bottom < r.top || m.top > r.bottom);
              mobileTitleOverlapsMenu = overlap;
            }
          }

          const isResearch = /^\/research(\/|$)/.test(location.pathname);
          let researchFilterOverflowRisk = false;
          if (isResearch) {
            const filterRoot = Array.from(document.querySelectorAll('main section, main div')).find((el) =>
              /Filters/i.test((el.textContent || '').slice(0, 200))
            );
            if (filterRoot) {
              const anyWide = Array.from(filterRoot.querySelectorAll('*')).some((el) => {
                const rect = el.getBoundingClientRect();
                return rect.width > window.innerWidth - 16;
              });
              researchFilterOverflowRisk = anyWide && window.innerWidth <= 430;
            }
          }

          return {
            title,
            h1,
            visible404,
            overflowX,
            duplicateCopyright,
            homeLoadingWithStats,
            mobileTitleClipped,
            mobileTitleOverlapsMenu,
            researchFilterOverflowRisk,
          };
        });

        Object.assign(entry, checks);
      } catch (err) {
        entry.error = String(err);
      }

      page.off('requestfailed', onReqFail);
      page.off('console', onConsole);

      entry.consoleErrors = consErrs;
      entry.requestFailures = reqFails;

      aggregate.totalChecks += 1;
      if ((entry.status ?? 0) >= 400) aggregate.non200 += 1;
      if (entry.visible404) aggregate.visible404 += 1;
      if (entry.overflowX) aggregate.overflowX += 1;
      if (entry.duplicateCopyright) aggregate.duplicateCopyright += 1;
      if (entry.homeLoadingWithStats) aggregate.homeLoadingWithStats += 1;
      if (vp.name === 'mobile' && entry.mobileTitleClipped) aggregate.mobileTitleClipped += 1;
      if (vp.name === 'mobile' && entry.mobileTitleOverlapsMenu) aggregate.mobileTitleOverlapsMenu += 1;
      if (entry.researchFilterOverflowRisk) aggregate.researchFilterOverflowRisk += 1;
      if (entry.consoleErrors.length) aggregate.consoleErrors += entry.consoleErrors.length;
      if (entry.requestFailures.length) aggregate.requestFailures += entry.requestFailures.length;

      results.push(entry);
    }

    await page.close();
  }

  // Legacy route redirect checks
  const legacyChecks = [];
  for (const route of LEGACY_ROUTES) {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' });
    legacyChecks.push({ route, status: res.status, location: res.headers.get('location') || null });
  }

  // robots/sitemap checks
  const robots = await fetch(`${BASE_URL}/robots.txt`);
  const robotsText = await robots.text();
  const sitemap = await fetch(`${BASE_URL}/sitemap.xml`);

  // Link crawl from home/sidebar and status checks
  const crawlBrowser = await chromium.launch({ headless: true });
  const crawlPage = await crawlBrowser.newPage({ viewport: { width: 1440, height: 900 } });
  await crawlPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await crawlPage.waitForTimeout(1200);
  const links = await crawlPage.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && h.startsWith('/') && !h.startsWith('/_next'))
      .map((h) => h.split('#')[0])
  );
  await crawlPage.close();
  await crawlBrowser.close();

  const uniqueLinks = Array.from(new Set(links)).sort();
  const deadLinks = [];
  for (const route of uniqueLinks) {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: 'follow' });
    if (res.status >= 400) deadLinks.push({ route, status: res.status });
  }

  const summary = {
    aggregate,
    legacyChecks,
    robots: {
      status: robots.status,
      hasAllowAll: /User-agent:\s*\*/i.test(robotsText) && /Allow:\s*\//i.test(robotsText),
    },
    sitemap: { status: sitemap.status },
    internalLinksChecked: uniqueLinks.length,
    deadLinks,
  };

  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log(JSON.stringify({ outDir, summary }, null, 2));
  await browser.close();
})();
