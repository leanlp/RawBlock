# RawBlock SEO Optimization Plan — 2026-11-14

Branch: `seo/optimization-20261114` (from `fix/production-live-data-20261111` @ `3640cf3`)
Status: **Draft — pending review**
Scope: www.rawblock.net, Next.js (App Router) frontend + Go node gateway (`apigoland.rawblock.net`)

---

## 1. Executive summary

RawBlock's technical foundation is already solid and verified in production: SSR home with real node data, ~200 ms TTFB, clean 301s, per-route canonicals, robots + 4 sitemaps live, JSON-LD (Org + WebSite/SearchAction + FAQ), `llms.txt`/`llms-full.txt`, and a healthy local-node gateway. The gap is not infrastructure — it is **crawlable depth and shareable identity**:

1. Social cards are broken: `og:image` points at an SVG (`/og/home.svg`); X/FB render nothing.
2. The flagship data page (`/explorer/block/[id]`) is a client-rendered shell — Google sees "Retrieving Block Data from Time Machine…".
3. The home H1 is the brand logo, not a keyword sentence.
4. No GSC/Bing property exists, so nothing is being measured.

**Strategy (where we win, and where we don't fight):**

- **Don't fight** head terms ("bitcoin block explorer", "mempool") against mempool.space / blockchain.com on brand volume.
- **Do win** (a) long-tail education ("what is a merkle proof", "how to decode a coinbase"), (b) programmatic data pages (blocks, txs, addresses — 800k+ indexable URLs, each SSR'd with real data), and (c) a research registry (assumptions / attacks / vulnerabilities / policy) as a link magnet.
- **E-E-A-T differentiator:** every page ships a "Data source: our own full node" provenance badge. No competitor can copy this. It is our authority story and it must be in the HTML, the FAQ copy, and the structured data.

Deliverables are sequenced P0 → P1 → P2 with file-level targets, acceptance criteria, and a measurement foundation that must exist **before** any optimization ships (otherwise we optimize blind).

---

## 2. Current state (verified against production, 2026-11-13/14)

| Area | State | Evidence |
|---|---|---|
| Home SSR | ✅ Real data in HTML, TTFB ~200 ms | post-fix live test, 5-page battery, 0 console errors |
| Canonicals | ✅ 6 routes, self-referencing | production HTML |
| 301s / TLS | ✅ apex→www, http→https | curl battery |
| robots.txt | ⚠️ Works, but contains deprecated `Host:` directive | `public/robots.txt` |
| Sitemaps | ✅ 4 live (main 136, blocks=100 rolling, en, es=26) + `llms.txt`/`llms-full.txt` | live fetch |
| JSON-LD | ✅ Org + WebSite/SearchAction + FAQ (home) | production HTML |
| OG image | ❌ SVG referenced; X/FB ignore SVG; `/og/home.png` 404 | live fetch of 7 referencing files |
| Block page | ❌ Client-only shell; no block data in HTML | `curl /explorer/block/975801` |
| Home H1 | ❌ = brand logo (`DashboardHome.tsx:387`) | production HTML |
| `/es` | ⚠️ Root 404 (no `app/es/page.tsx`) but 26 es URLs in sitemap + ES nav button + `inLanguage:["en","es"]` | live fetch |
| Glossary | ⚠️ 16 terms, ~20 words each | code + live |
| Blog | ⚠️ 2 posts total | `app/data/blogPosts` |
| Initial JS | ⚠️ ~1.2 MB (311/225/195 KB chunks) | production JS |
| Footer status | ⚠️ Static "Mainnet Connected" regardless of gateway state | `components/layout/Footer.tsx` |
| lastmod | ⚠️ Most routes stamped `2026-02-22`; only explorer/analysis/home use `now` | `app/sitemap.ts` |

---

## 3. P0 — ship this week (crawlability + measurement)

P0 is the floor. Nothing in P1/P2 lands until P0 is merged, deployed, and verified in production.

### P0-1 · Rasterize OG images (SVG → PNG)

**Why:** 7 files reference `/og/*.svg`. X, Facebook, LinkedIn, and WhatsApp do **not** render SVG `og:image`. Every share of any RawBlock page currently produces a dead social card. This is the single highest-leverage 2-hour fix.

**Files**
- `public/og/` — 5 SVGs: `home`, `blog`, `decoder`, `glossary`, `script-lab`
- All referencing files (grep `/og/` in `app/`): `app/page.tsx`, `app/lab/script/layout.tsx`, `app/explorer/decoder/layout.tsx`, `app/blog/layout.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/glossary/layout.tsx`, `app/glossary/[term]/page.tsx`
- `lib/seo.ts` (`buildPageMetadata` image default)

**Approach**
1. Keep SVGs as the design source of truth.
2. Add `scripts/og-build.mjs`: rasterize each `public/og/*.svg` → `public/og/*.png` at **1200×630** using `@resvg/resvg-js` (no browser needed, runs in build). Wire into `package.json` `prebuild`.
3. Flip every `image: "/og/x.svg"` reference to `"/og/x.png"`.
4. Add a second 1.91:1 variant (`home-wide.png`, 1600×837) for the home route only, via a `wide` option in `buildPageMetadata` (cheap, and the home page is the one that gets shared).

**Acceptance**
- `curl -s /` HTML contains `og:image` ending `.png`; the URL returns HTTP 200 with `Content-Type: image/png`.
- All 7 referencing routes resolve to an existing PNG (no 404s).
- Passes [opengraph.xyz](https://www.opengraph.xyz) or the X Card Validator + FB Sharing Debugger with a visible card (title, description, image all rendered).
- `twitter:card` = `summary_large_image` on all routes.

**Effort:** S (0.5 d) · **Depends on:** nothing · **Gate for:** everything

### P0-2 · SSR the block page

**Why:** `/explorer/block/[id]` is the core product page. Google currently sees a loading shell — zero indexable block content. This is the foundation for the programmatic-SEO engine (P1-4).

**Files**
- `app/explorer/block/[id]/page.tsx` — currently `"use client"`, fetches `${baseUrl}/api/block/{id}` (or `/api/block/height/{id}`) + `/api/network-stats` **client-side**
- `lib/heroMetrics.server.ts` — **reuse** the existing server-side gateway pattern (`resolveNodeGatewayApiUrl()` + credential handling, timeout discipline)
- New `lib/block.server.ts` — `getBlockByHeightOrHash(id)` hitting the node gateway at request time
- `app/explorer/block/[id]/layout.tsx` — keep existing `buildPageMetadata`/`breadcrumbJsonLd`

**Approach**
1. Split the route: a **server** `page.tsx` that (a) fetches the block from the node gateway at request time (same 1.7 s deadline discipline as hero metrics), (b) renders the block header facts (height, hash, miner, size, weight, tx count, reward, time) + first-N txs **server-side**, and (c) hands `initialBlock` to a new **client** child component.
2. The client child keeps today's UX: treemap (Recharts), Merkle proof panel, coinbase decoder, and live re-fetch — it just hydrates from server data instead of an empty state.
3. **Graceful degradation:** if the gateway fails or the id is invalid, render the existing client shell (fetch-on-mount) — the page must never 500 because of a gateway blip. Invalid ids → proper 404 with a helpful "nearest blocks" list.
4. Data is immutable per block: `revalidate = 3600` is safe (or `force-static` for hash lookups). This is a cache-forever page, not a live page.

**Acceptance**
- `curl https://www.rawblock.net/explorer/block/975801` returns HTML **containing** the block's miner name, tx count, and reward values (grep-able strings).
- HTML contains `BreadcrumbList` + a `WebPage` JSON-LD with block height and hash.
- TTFB for a block page < 600 ms (gateway serves in 70–250 ms today).
- Client hydration shows the same page, interactive treemap/Merkle/coinbase panels still work; 0 console errors (re-run the battery with a fresh tab).
- Lighthouse SEO score ≥ 95 on a block URL.

**Effort:** M (1.5–2 d) · **Depends on:** gateway availability (healthy today) · **Unlocks:** P1-4

### P0-3 · Home H1 to a real keyword sentence

**Why:** The home H1 is the gradient "RAW BLOCK" logo (`components/DashboardHome.tsx:387`). The H1 should carry the money phrase; the logo should be decorative.

**Files**
- `components/DashboardHome.tsx` (H1 block, lines ~385–400)
- Audit heading ladders on all 6 other routes while here (`components/PageHeader.tsx` consumers: block, glossary, etc.)

**Approach**
1. Logo row → `aria-hidden="true"` div (visual unchanged).
2. New visible H1: **"Bitcoin Explorer, Run on Our Own Full Node"** (or the phrase already in `lib/seo/pageContent.ts` for `home` — keep title tag, H1, and `pageContent.ts` in sync).
3. Heading-ladder sweep: each route must have exactly one H1, no skipped levels (h1 → h2 → h3), verified by `grep '<h[1-6]'` over production HTML of all 6 routes.

**Acceptance**
- Home HTML: exactly one `<h1>` containing "Bitcoin Explorer"; logo not in the H1.
- All 6 routes: one H1, clean ladder (no h2→h4 jumps).
- Visual regression: home looks identical (layout unchanged, same sizes/gradient).

**Effort:** S (0.5 d incl. ladder sweep) · **Depends on:** nothing

### P0-4 · Measurement foundation (GSC + Bing + keyword baselines)

**Why:** We have zero tracking. Every later step is judged against baselines captured **now**, before changes land — otherwise we can't attribute.

**Actions**
1. Verify `www.rawblock.net` in **Google Search Console** (domain property preferred; HTML file or DNS TXT fallback). Add `apigoland` **not** — product site only.
2. Verify in **Bing Webmaster Tools**; import GSC.
3. Submit all 4 sitemaps (both tools).
4. Create `docs/seo-keywords-baseline.csv` — 20 seed keywords, tracked in GSC Performance (query filter) from day one:

   | # | Keyword | Intent |
   |---|---|---|
   | 1 | bitcoin explorer | head (watch, don't chase) |
   | 2 | bitcoin block explorer | head |
   | 3 | bitcoin mempool | head |
   | 4 | bitcoin network map | data |
   | 5 | bitcoin hashrate | data |
   | 6 | bitcoin difficulty adjustment | data/edu |
   | 7 | bitcoin fee market | data |
   | 8 | bitcoin mempool visualizer | data |
   | 9 | what is a bitcoin block | edu |
   | 10 | what is the bitcoin mempool | edu |
   | 11 | how does bitcoin mining work | edu |
   | 12 | what is a merkle proof | edu (glossary) |
   | 13 | what is a coinbase transaction | edu (glossary) |
   | 14 | bitcoin script playground | lab |
   | 15 | taproot playground | lab |
   | 16 | bitcoin consensus laboratory | lab |
   | 17 | what is utxo | edu (glossary) |
   | 18 | what is segwit | edu (glossary) |
   | 19 | bitcoin block reward halving | edu |
   | 20 | how to verify a merkle proof | edu (glossary/academy) |

5. Weekly capture (10 min, recurring): GSC Pages report (indexed count, coverage errors), GSC queries (clicks/impressions/pos for the 20 seeds), CrUX mobile field LCP/INP/CLS for `/`, `/explorer/`, `/glossary/`. Store in `docs/seo-weekly/` (CSV per week).

**Acceptance**
- GSC + Bing properties verified, 4 sitemaps submitted, baseline CSV + first weekly snapshot committed.

**Effort:** S (0.5 d, mostly waiting on GSC verification email) · **Depends on:** nothing

### P0-5 · Production verification battery (post-deploy)

Re-run after the P0 deploy: hero 3-× fetch, contract headers (`x-rawblock-metrics-status`), 5-page console battery, new block-page `curl` check (P0-2), OG PNG 200 check (P0-1), H1 grep (P0-3). One tab per page; full-page screenshots only where needed (< 16 MP rule).

**Effort:** S (0.25 d)

**P0 total: ~2.5–3 engineer-days. Target: merged + deployed + verified within 5 working days.**

---

## 4. P1 — weeks 2–4 (indexable depth: the growth engine)

### P1-1 · Decide `/es`: commit or strip (decision gate)

**Facts:** `/es` root is 404 (no `app/es/page.tsx`), yet `sitemaps/es.xml` lists 26 URLs (academy 18, research 5, paths 3), the nav has an ES button, and metadata declares `inLanguage:["en","es"]`. Currently we are *telling search engines a site exists that half 404s*.

**Options**
- **A — Commit (recommended if Spanish is a real goal):** add `app/es/page.tsx` (mirrored home), fix `/es/paths` index 404, add `hreflang` en↔es pairs on every content route, verify es academy `[nodeId]` pages all return 200 (18 in sitemap).
- **B — Strip (if Spanish is not a real goal):** delete ES nav button, remove `es.xml` from robots, drop `"es"` from `inLanguage`, empty `sitemaps/es.xml`, then re-verify no residual 404s.

**Decision needed from owner before work starts.** Default = A.
**Files:** `app/es/page.tsx` (new), `app/es/paths/` (index page), `lib/seo.ts` (`inLanguage`, `alternateLanguage` builder), `components/Header.tsx` (ES button), `public/robots.txt`, `app/sitemaps/es.xml`.
**Acceptance (A):** `curl /es` = 200 with real content; all 26 es URLs return 200; every bilingual route has reciprocal `hreflang`; no 404s in the es sitemap.
**Effort:** M (1 d for A, 0.5 d for B)

### P1-2 · Glossary/academy content expansion (thin → rankable)

**Why:** 16 glossary terms at ~20 words each can't rank. Long-tail edu terms (seeds #9–#13, #17–#20) are low-competition and directly feed the labs.

**Files**
- `app/glossary/[term]/page.tsx` — expand the template: 250–450 words/term (definition → how it works → where you see it on RawBlock → related terms)
- New `app/data/glossary.ts` (or extend existing data source) — author the entries
- `components/seo/SeoContentSection` / `lib/seo/pageContent.ts` — per-term FAQ (2–3 Qs) + `ItemList` JSON-LD
- Internal links: each term links to the relevant explorer/lab/academy page (e.g., "Merkle proof" → `/explorer/decoder` + block page "verify a tx" link) — the cross-link web is what compounds

**Targets**
- 16 existing terms → full 250–450 word entries + FAQ.
- +14 new terms mapped to seed keywords: halving, UTXO, Segwit, RBF, mempool eviction, coinbase, script, witness, taproot, OP_RETURN, locktime, difficulty, hash rate, block template. (30 total)
- Follow the terminology style guide in `docs/i18n-bitcoin-terminology-style-guide.md` (esp. if P1-1 = A).

**Acceptance**
- Every glossary term page ≥ 250 words of **unique** (non-templated) prose; `curl` shows the full body in HTML; FAQ + ItemList JSON-LD valid (Rich Results Test).
- At least 8 seed-#9–#20 keywords have a dedicated on-page target with matching H1/first-paragraph.

**Effort:** L (3 d, mostly writing; template work 1 d)

### P1-3 · Research registry → link magnet

**Why:** `app/research/` (assumptions / attacks / vulnerabilities / policy, each with a layout + index) is unique, citable, and link-earning. Bitcoin security research links well (papers, blogs, exchanges cite it).

**Files**
- `app/research/*/page.tsx` index pages — expand: purpose paragraph, entry count, `ItemList` JSON-LD, "cite this registry" block (canonical URL + DOI-style human citation string).
- Entry detail pages — check current depth; ensure each entry has ≥ 300 words, references, and `Article` JSON-LD with `author` = RawBlock research team (an `about` section with a real team/identity = E-E-A-T).
- New: `/research/about` page (who publishes this, methodology, how entries are sourced) — the page that earns trust and links.

**Acceptance**
- All research index + entry URLs in `sitemap.xml` with valid `Article`/`ItemList` markup.
- `/research/about` live, ≥ 500 words, linked from footer + home `SeoContentSection`.
- `curl` every entry URL = 200 with full body in HTML.

**Effort:** M (2 d)

### P1-4 · Programmatic tx + address pages (SSR)

**Why:** 800k+ blocks × N txs + millions of addresses = the only durable volume play, and P0-2 proved the SSR pattern. Blocks page first (small, 100-URL rolling sitemap exists), then txs, then addresses.

**Files**
- `app/explorer/tx/[id]/page.tsx` (new) — SSR via node gateway: inputs/outputs, amounts, fee, size, weight, vsize, confirmations, fee rate; client child for the flow diagram.
- `app/explorer/address/[id]/page.tsx` (new) — SSR: balance, tx count, first/last seen, recent txs table; client child for live balance.
- `lib/tx.server.ts`, `lib/address.server.ts` (new, same pattern as `lib/block.server.ts`)
- `lib/seo/recentBlocks.ts` → generalize to `recentHeights/recentTxIds/recentAddressIds`; extend `app/sitemap-blocks.xml/route.ts` + new `sitemap-txs.xml` (rolling 1k) and `sitemap-addresses.xml` (rolling 1k); register in `public/robots.txt`.
- Unknown ids → 404 page with suggestions (P0-2's 404 pattern).

**Ordering gate:** txs ship after block page has been in production ≥ 1 week and GSC shows the block URLs indexing + fetching cleanly. Addresses ship after txs. If block indexing underperforms, debug before scaling.

**Acceptance**
- `curl /explorer/tx/{id}` and `/explorer/address/{id}` contain the real amounts/addresses in HTML; TTFB < 600 ms; 0 console errors.
- Both sitemaps registered in robots; rolling windows capped (1k) so crawl budget isn't burned on stale URLs.

**Effort:** L (3 d txs, 2 d addresses)

### P1-5 · lastmod hygiene

**Why:** Most routes carry a frozen `2026-02-22`; Google discounts uniform fake lastmod and it muddies recrawl signals.

**Files:** `app/sitemap.ts`, `app/sitemaps/en.xml`, `app/sitemaps/es.xml`, `app/sitemap-blocks.xml/route.ts`

**Approach**
- Static content (glossary, research, blog, academy, labs): stamp **content file mtime** (build-time) so lastmod reflects real edits.
- Live data (explorer, analysis, home): `now()` at generation.
- No route may share the identical lastmod as > 50% of its siblings without a real content date.

**Acceptance:** after a glossary edit, only that URL's lastmod changes; GSC sitemap report shows no "lastmod" warnings.
**Effort:** S (0.5 d)

**P1 total: ~9–11 engineer-days across weeks 2–4 (glossary + registry overlap; programmatic tx/addresses can parallelize).**

---

## 5. P2 — weeks 5–8 (performance + cadence)

### P2-1 · Initial JS 1.2 MB → < 500 KB

**Why:** mobile LCP/INP on data-heavy pages; CrUX baseline captured in P0-4 tells us which route matters most.

**Files:** `next.config.ts` (check `output`/chunk settings), `components/charts/` (Recharts is the ~311 KB chunk — **dynamic import** every chart on a lazy route, `next/dynamic` `ssr:false`), `components/block/*` (Merkle/coinbase panels behind the block page's client child — already naturally deferred by P0-2), heavy icon/animation bundles.

**Approach:** run `@next/bundle-analyzer` on the 6 routes; split by route; target home ≤ 500 KB initial, explorer routes ≤ 400 KB (charts lazy-load after LCP). Verify with CrUX weekly.

**Acceptance:** PSI mobile LCP < 2.5 s and INP < 200 ms on home + a block page (lab conditions); CrUX p75 mobile LCP < 2.5 s within one field-data cycle after deploy.
**Effort:** M (2 d)

### P2-2 · Blog cadence: 2 posts → 2/month

**Files:** `app/data/blogPosts` (extend), `app/blog/[slug]/page.tsx` (confirm Article JSON-LD + datePublished/Modified correct), `app/sitemap.ts` blog entry.
**Editorial:** data-driven posts only — "What the fee market did this week", "Coinbase subsidy decode: block NNN", "What a RBF race looks like in our mempool" — each embeds live widgets (differentiator; no competitor links a *live* chart into a post). One draft per cycle after P1 lands.
**Acceptance:** 4 new posts by week 8, each with Article markup, 2+ internal links, and a real data widget.
**Effort:** ongoing (writing cost, not code)

### P2-3 · robots.txt `Host:` directive removal

**File:** `public/robots.txt` — `Host:` is deprecated (Yandex-only, pre-2010s). Delete the line; keep the 4 sitemap lines (add the P1 tx/address sitemaps when they land).
**Acceptance:** live robots.txt has no `Host:`; GSC has no robots warnings.
**Effort:** trivial (0.1 d)

### P2-4 · Footer: static "Mainnet Connected" → truthful status

**File:** `components/layout/Footer.tsx` — read the same gateway health contract the hero uses (`x-rawblock-metrics-status`); render "Live from our node" / "Reconnecting…" / "Degraded" truthfully. A footer that lies about liveness quietly erodes the E-E-A-T story P0/P1 build.
**Acceptance:** kill the gateway in staging → footer shows degraded within one poll; no console errors.
**Effort:** S (0.5 d)

### P2-5 · `llms.txt` refresh + AI-citation pass

`public/llms.txt` / `llms-full.txt` should track the P1 surface (glossary 30 terms, research registry, tx/address pages). Cheap, and it's how the model crawlers (the fast-growing "referrers" cohort for edu content) find us.
**Effort:** S (0.5 d)

**P2 total: ~3–4 engineer-days + ongoing editorial.**

---

## 6. Measurement & KPIs

| KPI | Baseline (capture in P0-4) | Week 8 target | Week 12 target |
|---|---|---|---|
| Indexed URLs (GSC Pages) | current count | +150% | +300% |
| Organic sessions (GSC) | n/a (new property) | +2× vs first full week | +3× |
| Seeds in top-20 (of 20) | n/a | ≥ 5 | ≥ 8 |
| Seeds in top-10 | n/a | ≥ 2 | ≥ 5 |
| Block/tx/address URLs indexed | 0 (shell) | ≥ 50 blocks | ≥ 500 blocks, ≥ 100 txs |
| Mobile LCP p75 (CrUX, `/`) | capture | < 2.5 s | < 2.0 s |
| CWV passing rate (mobile, all routes) | capture | ≥ 75% | ≥ 90% |
| Social share clicks (PostHog, already instrumented) | capture | +50% vs baseline (post-OG-fix) | n/a |
| Referrals from research pages | ~0 | first external links | ≥ 5 distinct domains |

**Cadence:** 10-min weekly snapshot into `docs/seo-weekly/` (CSV). 30/60/90-day reviews against the table; any KPI missing target for 2 consecutive weeks triggers a re-audit of that workstream before new work starts.

---

## 7. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Node gateway flaky at request time → SSR pages intermittently thin | Medium | P0-2's graceful degradation (shell fallback, never 500); 1.7 s gateway deadline + client re-fetch |
| Vercel build-time fetch of gateway (sitemap rolling windows) | Low | All live-data SSR is request-time; only heights list touches gateway at build, with a committed-heights fallback |
| Programmatic scale exhausts crawl budget before edu content ranks | Medium | Rolling capped sitemaps (1k); gate tx/addresses on observed block-indexing performance (P1-4 ordering gate) |
| `/es` half-site confuses indexing | High (present today) | P1-1 decision gate in week 2, before further es expansion |
| Glossary/registry content reads templated → duplicate-content discount | Medium | Unique prose requirement (250+ words, term-specific examples); no shared boilerance paragraphs beyond the first sentence |
| OG/JS work regresses the live hero (post-fix stability) | Low | P0-5 post-deploy battery is mandatory; hero contract headers checked every deploy |

---

## 8. Execution calendar

| Week | Work | Exit gate |
|---|---|---|
| **W1** | P0-1, P0-2, P0-3, P0-4, P0-5 | All 5 verified in production; GSC/Bing live; baselines captured |
| **W2** | P1-1 (decision + ship), P1-5, P1-3 start | `/es` resolved; lastmod clean; registry expanded |
| **W3** | P1-2 (glossary 30), P1-3 done | 30 glossary entries rank-able; registry complete |
| **W4** | P1-4 txs (gated on W1 block indexing) | tx pages SSR'd + indexing |
| **W5–6** | P2-1 (JS split), P2-3, P2-4 | CWV targets improving in CrUX |
| **W7–8** | P1-4 addresses (if txs healthy), P2-2 cadence, P2-5 | 30/60-day review vs §6 table |

Commits land on `seo/optimization-20261114` per workstream (one PR each: `P0-1 og-png`, `P0-2 block-ssr`, …), deployed to production as a set only after the P0 gate. `main` stays untouched until W1 verification passes.

---

## 9. Open questions (need owner input)

1. **P1-1:** Is Spanish a committed market? (A = build `/es` home + hreflang; B = strip.)
2. **P1-2:** Is a weekly writing cadence realistic, or should glossary expansion be commissioned?
3. **P1-3:** Is there a named research author/team for the `author` JSON-LD and `/research/about` (E-E-A-T needs a real identity, not "RawBlock Team")?
4. **GSC:** who receives the verification email, and do we prefer a domain property (DNS) over URL prefix?
