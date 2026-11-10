#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────────
 * FAP-59 phase-4 hero cutout pipeline → optimized brand assets.
 *
 * Founder-supplied studio cutouts (2026-11-02, code -=- "no background"):
 *   research  → "Separated Hair Trio Portrait.png"          → hero-research.{webp,avif}
 *   policy 5  → "Warm Indian Woman Holding Gray Laptop (1).png" → hero-stage.{webp,avif}
 *
 * The sources already ship transparent (hasAlpha, corner alpha 0). This step
 * verifies that, trims empty transparent margins, and emits the D3 image-law
 * pair (WebP raster + AVIF-compact, alpha preserved) into src/assets/brand/.
 *
 * Usage (from frontend/):  node scripts/fap59-hero-cutouts.mjs
 * Exit 1 if a source is missing or is not a transparent cutout.
 * ───────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../src/assets/brand');

const SOURCES = [
  {
    in: 'C:/Users/Administrator/Downloads/Separated Hair Trio Portrait.png',
    name: 'hero-research',
    maxWidth: 1672,
  },
  {
    in: 'C:/Users/Administrator/Downloads/Warm Indian Woman Holding Gray Laptop (1).png',
    name: 'hero-stage',
    maxWidth: 1254,
  },
  {
    in: 'C:/Users/Administrator/Downloads/visionary_bot_exact_uploaded_v_4k_transparent.png',
    name: 'visionary-bot',
    maxWidth: 1400,
  },
];

const fail = (msg) => { console.error(`× ${msg}`); process.exit(1); };

fs.mkdirSync(outDir, { recursive: true });

for (const src of SOURCES) {
  if (!fs.existsSync(src.in)) fail(`missing founder source: ${src.in}`);
  const { data, info } = await sharp(src.in).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  const alphaAt = (x, y) => data[(y * w + x) * ch + 3];
  const corners = [alphaAt(1, 1), alphaAt(w - 2, 1), alphaAt(1, h - 2), alphaAt(w - 2, h - 2)];
  if (corners.some((a) => a > 8)) {
    fail(`${path.basename(src.in)}: opaque corners — a real background was found; strip it upstream (founder said no background).`);
  }
  console.log(`✓ ${path.basename(src.in)}: ${w}x${h}, transparent cutout (corners alpha 0)`);

  const webpTo = path.join(outDir, `${src.name}.webp`);
  const avifTo = path.join(outDir, `${src.name}.avif`);

  await sharp(src.in)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: src.maxWidth, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(webpTo);

  await sharp(src.in)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: src.maxWidth, withoutEnlargement: true })
    .avif({ quality: 56, effort: 6 })
    .toFile(avifTo);

  const webpMeta = await sharp(webpTo).metadata();
  const avifMeta = await sharp(avifTo).metadata();
  console.log(`  → ${path.basename(webpTo)} ${webpMeta.width}x${webpMeta.height} (${Math.round(fs.statSync(webpTo).size / 1024)} KB)`);
  console.log(`  → ${path.basename(avifTo)} ${avifMeta.width}x${avifMeta.height} (${Math.round(fs.statSync(avifTo).size / 1024)} KB)`);
}
console.log('done');
