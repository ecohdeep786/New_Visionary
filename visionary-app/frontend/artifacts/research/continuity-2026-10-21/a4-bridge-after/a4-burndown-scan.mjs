/**
 * A4 burn-down scan (FAP-44) — for every retag selector-cluster in public-bridge.css,
 * count elements actually MATCHED on the rendered public pages, at 3 widths.
 * Zero-match clusters are removable; matched clusters name the pages that still need them.
 * !important lines are irrelevant to matching — selectors query same targets.
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5184';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROUTES = ['/', '/signin', '/login', '/register', '/student', '/teacher', '/parent', '/help', '/professional', '/how-it-works', '/organization', '/download', '/about', '/pricing', '/careers', '/research', '/community', '/contact', '/partners', '/updates', '/referral', '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies'];
const WIDTHS = [1440, 1024, 390];

/* each cluster = the selector as written in public-bridge.css */
const CLUSTERS = {
  'type-scale: story-card clamps (.text-[clamp(36,5vw,72)]…)': '[class*="clamp(36px,5vw,72px)"], [class*="clamp(34px,5vw,72px)"], [class*="clamp(40px,4.5vw,72px)"], [class*="clamp(30px,3.8vw,56px)"], [class*="clamp(26px,3.4vw,48px)"]',
  'type-scale: h2 story-card variants': 'h2[class*="clamp(36px,5vw,72px)"], h2[class*="clamp(34px,5vw,72px)"], h2[class*="clamp(40px,4.5vw,72px)"], h2[class*="clamp(30px,3.8vw,56px)"], h2[class*="clamp(26px,3.4vw,48px)"], h2[class*="clamp(40px,5.55vw,80px)"]',
  'type-scale: card-title clamps': '[class*="clamp(28px,2.78vw,40px)"], [class*="clamp(28px,2.9vw,40px)"], [class*="clamp(28px,2.9vw,42px)"], [class*="clamp(28px,3.6vw,42px)"], [class*="clamp(28px,3.6vw,46px)"], [class*="clamp(30px,4vw,46px)"], [class*="clamp(26px,3.4vw,38px)"], [class*="clamp(32px,3.3vw,44px)"], [class*="clamp(24px,3vw,34px)"], [class*="clamp(24px,2.78vw,40px)"]',
  'type-scale: h2 card-title variants': 'h2[class*="clamp(28px,2.78vw,40px)"], h2[class*="clamp(28px,2.9vw,40px)"], h2[class*="clamp(28px,2.9vw,42px)"], h2[class*="clamp(28px,3.6vw,42px)"], h2[class*="clamp(28px,3.6vw,46px)"], h2[class*="clamp(30px,4vw,46px)"], h2[class*="clamp(26px,3.4vw,38px)"], h2[class*="clamp(32px,3.3vw,44px)"], h2[class*="clamp(24px,3vw,34px)"], h2[class*="clamp(24px,2.78vw,40px)"]',
  'type-scale: p step-down (28/24 card→lead)': 'p[class*="clamp(28px,2.78vw,40px)"], p[class*="clamp(24px,2.78vw,40px)"]',
  'type-scale: compact card h2 (20px clamps)': 'h2[class*="clamp(20px,2vw,26px)"], h2[class*="clamp(20px,2vw,28px)"]',
  'type-scale: compact card label (20px clamps)': '[class*="clamp(20px,2vw,26px)"], [class*="clamp(20px,2vw,28px)"]',
  'body-size: text-[15px]/[16.5px]/[14.5px]/[17px]/[17.5px]': '[class*="text-[15px]"], [class*="text-[16.5px]"], [class*="text-[14.5px]"], [class*="text-[17px]"], [class*="text-[17.5px]"]',
  'h2-step-law: h2.text-[30..56px]': 'h2[class*="text-[30px]"], h2[class*="text-[32px]"], h2[class*="text-[34px]"], h2[class*="text-[36px]"], h2[class*="text-[38px]"], h2[class*="text-[40px]"], h2[class*="text-[42px]"], h2[class*="text-[44px]"], h2[class*="text-[46px]"], h2[class*="text-[52px]"], h2[class*="text-[56px]"]',
  'radius: rounded-[14px]': '[class*="rounded-[14px]"]',
  'radius: rounded-[24px]': '[class*="rounded-[24px]"]',
  'radius: rounded-[28px]': '[class*="rounded-[28px]"]',
  'radius: rounded-[32px]': '[class*="rounded-[32px]"]',
  'radius: rounded-[48px]': '[class*="rounded-[48px]"]',
  'radius: rounded-[50px]': '[class*="rounded-[50px]"]',
  'radius: rounded-[60px]': '[class*="rounded-[60px]"]',
  'display: text-[clamp(48px,5.55vw,80px)]': '[class*="clamp(48px,5.55vw,80px)"]',
  'uppercase-kickerMain: p.uppercase (public)': 'main p.uppercase',
  'h1-ladder: h1.text-[48px]': 'h1[class*="text-[48px]"]',
  'grey-lead-ink: p 17/17.5px grey-styled (old rgbmarkers)': 'main p[class*="text-[17.5px]"][style*="95, 99, 104"], main p[class*="text-[17px]"][style*="95, 99, 104"], main p[class*="text-[17.5px]"][style*="6e6e73"], main p[class*="text-[17px]"][style*="6e6e73"]',
  'grey-lead-ink: SAME intent, new serialization (110, 110, 115)': 'main p[class*="text-[17.5px]"][style*="110, 110, 115"], main p[class*="text-[17px]"][style*="110, 110, 115"]',
  'meta-floor: .text-[13px]': '[class*="text-[13px]"]',
  'display-tracking: story-card clamps (tracking rule)': '[class*="clamp(36px,5vw,72px)"]',
};

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const counts = {}; // cluster -> route -> [width,count]
for (const key of Object.keys(CLUSTERS)) counts[key] = {};
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const slug = route === '/' ? 'home' : route.slice(1);
    try {
      await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(500);
      for (const [key, sel] of Object.entries(CLUSTERS)) {
        const n = await page.evaluate((s) => document.querySelectorAll(s).length, sel).catch(() => -1);
        counts[key][slug] = counts[key][slug] || {};
        counts[key][slug][width] = n;
      }
    } catch (e) {
      for (const key of Object.keys(CLUSTERS)) { counts[key][slug] = counts[key][slug] || {}; counts[key][slug]['ERR' + width] = 1; }
    }
  }
  await ctx.close();
}
await browser.close();

/* report: per cluster — pages with any match (any width) + max seen.
   Keys are width strings (1440/1024/390) or ERR1440/... per-width error flags. */
const report = {};
for (const [key, routes] of Object.entries(counts)) {
  const pages = [];
  let max = 0;
  let errs = 0;
  for (const [slug, w] of Object.entries(routes)) {
    for (const [k, v] of Object.entries(w)) {
      if (typeof v !== 'number') continue;
      if (String(k).startsWith('ERR')) { errs += v; continue; }
      if (v > 0) pages.push(`${slug}@${k}=${v}`);
      max = Math.max(max, v);
    }
  }
  report[key] = max === 0 ? (errs > 0 ? `NO MATCHES but ${errs} eval errors — check` : 'DELETE — 0 matches anywhere') : pages.join(', ');
}
writeFileSync(path.join(OUT, 'a4-burndown-receipt.json'), JSON.stringify({ scannedAt: new Date().toISOString(), counts, report }, null, 2));
for (const [key, verdict] of Object.entries(report)) console.log(`${key}\n   → ${verdict}`);
