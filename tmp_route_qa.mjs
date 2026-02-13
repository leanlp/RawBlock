import { chromium } from 'playwright';
import fs from 'fs';

const base = 'https://bitcoin-nexus-fe-git-fix-visual-bugsv2-leanlps-projects.vercel.app';
const routes = [
  '/',
  '/explorer/mempool',
  '/explorer/network',
  '/explorer/blocks',
  '/explorer/decoder',
  '/explorer/rich-list',
  '/explorer/fees',
  '/explorer/miners',
  '/explorer/vitals',
  '/explorer/rpc',
  '/analysis/utxo',
  '/analysis/forensics',
  '/analysis/evolution',
  '/analysis/d-index',
  '/analysis/graffiti',
  '/lab/script',
  '/lab/taproot',
  '/lab/keys',
  '/lab/lightning',
  '/lab/hashing',
  '/lab/consensus',
  '/game/tetris',
  '/game/mining'
];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'desktop', width: 1440, height: 1200 }
];

const outDir = '/Users/0xlean/Desktop/rawblock/tmp_qa/route_qa_fixbugsv2';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
});

const results = [];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  for (const route of routes) {
    const url = `${base}${route}`;
    const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '__').replace(/[^a-zA-Z0-9_\-]/g, '_');

    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      const status = resp?.status() ?? null;
      await page.waitForTimeout(1200);

      const metrics = await page.evaluate(() => {
        const d = document;
        const root = d.documentElement;
        const body = d.body;
        const horizontalOverflow = root.scrollWidth - window.innerWidth > 1;

        const allCandidates = [...d.querySelectorAll('button, a, input, select, textarea, [role="button"]')];
        const visible = allCandidates.filter((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
        });

        const tapViolations = visible
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || '').trim().slice(0, 48),
              w: Math.round(r.width),
              h: Math.round(r.height),
            };
          })
          .filter((x) => x.w < 44 || x.h < 44);

        const grids = [...d.querySelectorAll('*')].filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.display !== 'grid') return false;
          const r = el.getBoundingClientRect();
          return r.width > 280 && el.children.length > 1;
        });

        const multiColGridOnMobile = window.innerWidth < 768
          ? grids.some((el) => {
              const gtc = getComputedStyle(el).gridTemplateColumns;
              if (!gtc || gtc === 'none') return false;
              const cols = gtc.split(' ').filter(Boolean).length;
              return cols > 1;
            })
          : false;

        const paragraphs = [...d.querySelectorAll('p')].slice(0, 140);
        const ratios = paragraphs.map((p) => {
          const cs = getComputedStyle(p);
          const fs = parseFloat(cs.fontSize || '0');
          if (!fs) return 0;
          const lh = cs.lineHeight;
          if (lh === 'normal') return 1.2;
          if (lh.endsWith('px')) return parseFloat(lh) / fs;
          const n = parseFloat(lh);
          return Number.isFinite(n) ? n : 1.2;
        }).filter((v) => v > 0);
        const minLineHeightRatio = ratios.length ? Math.min(...ratios) : null;

        const main = d.querySelector('main') || body;
        const rect = main.getBoundingClientRect();
        const centeredDesktop = window.innerWidth >= 1024
          ? Math.abs(((rect.left + rect.right) / 2) - (window.innerWidth / 2)) < 28
          : null;

        return {
          horizontalOverflow,
          tapViolationsCount: tapViolations.length,
          tapViolationsTop: tapViolations.slice(0, 10),
          multiColGridOnMobile,
          minLineHeightRatio,
          centeredDesktop,
        };
      });

      const screenshot = `${outDir}/${vp.name}__${slug}.png`;
      await page.screenshot({ path: screenshot, fullPage: true });

      results.push({ route, viewport: vp.name, status, screenshot, error: null, ...metrics });
    } catch (e) {
      results.push({ route, viewport: vp.name, status: null, error: e?.message || String(e) });
    }
  }

  await context.close();
}

await browser.close();

fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 2));

const summary = {
  generatedAt: new Date().toISOString(),
  base,
  routeCount: routes.length,
  viewportCount: viewports.length,
  totalChecks: results.length,
  errors: results.filter(r => r.error).length,
  non200: results.filter(r => !r.error && typeof r.status === 'number' && r.status >= 400).length,
  overflow: results.filter(r => r.horizontalOverflow).length,
  mobileMultiCol: results.filter(r => r.viewport === 'mobile' && r.multiColGridOnMobile).length,
  tapViolations: results.filter(r => (r.tapViolationsCount || 0) > 0).length,
  lowLineHeight: results.filter(r => r.minLineHeightRatio !== null && r.minLineHeightRatio < 1.5).length,
  uncenteredDesktop: results.filter(r => r.viewport === 'desktop' && r.centeredDesktop === false).length,
};

fs.writeFileSync(`${outDir}/summary.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
