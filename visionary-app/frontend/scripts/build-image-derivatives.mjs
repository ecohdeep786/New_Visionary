#!/usr/bin/env node
/**
 * build-image-derivatives.mjs — one-shot image-derivative generator for the
 * D3 image law. For every source WebP under src/assets it emits a sibling
 * .avif at the SAME pixel size (no resize — the sizesets were already
 * measured in the 07-perf wave), skipping files whose AVIF is newer than
 * their WebP source. Quality defaults are tuned for photographic art
 * (quality 58, effort 5); pass --quality to override.
 *
 * Receipt: prints before/after KB per family and writes a machine-readable
 * receipt next to the other D3 artifacts when --receipt is given.
 *
 * Usage:
 *   node scripts/build-image-derivatives.mjs [--quality 58] [--receipt <path>]
 */
import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(here, "..", "src", "assets");

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const QUALITY = Number(arg("--quality", "58"));
const EFFORT = Number(arg("--effort", "5"));
const RECEIPT_PATH = arg("--receipt", null);

const kb = (n) => Math.round((n / 1024) * 10) / 10;

async function collect(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collect(p, out);
    } else if (extname(entry.name) === ".webp") {
      out.push(p);
    }
  }
  return out;
}

const sources = await collect(ASSETS_DIR);
const rows = [];
let converted = 0;
let skipped = 0;

for (const src of sources) {
  const out = src.slice(0, -5) + ".avif";
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
    skipped += 1;
    rows.push({ src: basename(src), webpKB: kb(statSync(src).size), avifKB: kb(statSync(out).size), status: "fresh" });
    continue;
  }
  try {
    await sharp(src).avif({ quality: QUALITY, effort: EFFORT }).toBuffer().then((buf) => writeFileSync(out, buf));
    converted += 1;
    rows.push({
      src: basename(src),
      webpKB: kb(statSync(src).size),
      avifKB: kb(statSync(out).size),
      status: "generated",
    });
  } catch (err) {
    rows.push({ src: basename(src), status: "FAILED: " + err.message });
  }
}

const fresh = rows.filter((r) => r.status === "fresh");
const gen = rows.filter((r) => r.status === "generated");
const failed = rows.filter((r) => r.status.startsWith("FAILED"));
const webpTotal = rows.reduce((a, r) => a + (r.webpKB ? r.webpKB * 1024 : 0), 0);
const avifTotal = rows.reduce((a, r) => a + (r.avifKB ? r.avifKB * 1024 : 0), 0);

console.log(`sources=${sources.length} generated=${converted} fresh=${skipped} failed=${failed.length}`);
for (const r of rows.filter((r) => r.status !== "fresh")) console.log(`  ${r.src}: ${r.webpKB}KB -> ${r.avifKB}KB avif (${r.status})`);
console.log(`total webp=${kb(webpTotal)}KB avif=${kb(avifTotal)}KB savings=${Math.round((1 - avifTotal / webpTotal) * 100)}%`);

if (RECEIPT_PATH) {
  mkdirSync(dirname(RECEIPT_PATH), { recursive: true });
  writeFileSync(
    RECEIPT_PATH,
    JSON.stringify(
      {
        task: "FAP-D3 image law — AVIF derivative generation",
        at: new Date().toISOString(),
        params: { quality: QUALITY, effort: EFFORT, pixelSizes: "unchanged (07-perf sizesets preserved)" },
        sources: sources.length,
        generated: converted,
        fresh: skipped,
        failed: failed.length,
        totals: { webpKB: kb(webpTotal), avifKB: kb(avifTotal), savingsPercent: Math.round((1 - avifTotal / webpTotal) * 100) },
        rows: gen.concat(failed),
      },
      null,
      2
    ) + "\n"
  );
  console.log(`receipt -> ${RECEIPT_PATH}`);
}
