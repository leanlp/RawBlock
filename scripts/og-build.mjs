#!/usr/bin/env node
/**
 * Rasterize public/og/*.svg design sources into 1200x630 PNGs.
 *
 * X, Facebook, LinkedIn and WhatsApp do not render SVG og:image — the deployed
 * site must reference the PNGs. The SVGs stay the design source of truth;
 * re-run this after editing any of them. Wired as `prebuild` so builds never
 * ship stale cards, and the committed PNGs make the output identical on
 * hosts that skip npm lifecycle scripts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const ogDir = join(here, "..", "public", "og");

// fitTo width preserves the 1200x630 viewBox aspect (1.91:1), the
// Open Graph standard for summary_large_image cards. Each card names its
// output `file` and, when it is a re-render of another design, its `source`.
const cards = [
  { source: "home", file: "home", width: 1200 },
  // Wide variant for the home route only: same art at 1600px width
  // (aspect preserved -> ~1600x840) for high-DPI share surfaces.
  { source: "home", file: "home-wide", width: 1600 },
  { source: "blog", file: "blog", width: 1200 },
  { source: "decoder", file: "decoder", width: 1200 },
  { source: "glossary", file: "glossary", width: 1200 },
  { source: "script-lab", file: "script-lab", width: 1200 },
];

let failed = false;
for (const { source, file, width } of cards) {
  const svgPath = join(ogDir, `${source}.svg`);
  const pngPath = join(ogDir, `${file}.png`);
  try {
    const svg = readFileSync(svgPath, "utf8");
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: width },
      background: "#0f172a",
      font: { loadSystemFonts: true },
    });
    const png = resvg.render().asPng();
    writeFileSync(pngPath, png);
    console.log(`og: wrote ${file}.png (${png.length} bytes)`);
  } catch (error) {
    failed = true;
    console.error(`og: failed to render ${file}.png:`, error instanceof Error ? error.message : error);
  }
}

if (failed) {
  console.error("og: one or more cards failed to render");
  process.exit(1);
}
console.log(`og: ${cards.length} cards rendered`);
