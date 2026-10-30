/* FAP-E2 (FAP-31): Lighthouse gate on the production build.
 * Gates (per the 2026-10-20 review): accessibility >= 0.95, SEO >= 0.95.
 * Performance and best-practices are measured and recorded, not gated: the
 * D3 ledger records raw Fast3G LCP > 2.5s with the fast-LCP lever named as
 * the next wave, so a perf gate today would fail honestly - it stays a
 * tracked receipt, not a pretend pass.
 * The four named baseline failures (color-contrast, heading-order,
 * target-size, link-name) are asserted individually per route.
 * Env: LIGHTHOUSE_URL (default http://127.0.0.1:4199), LIGHTHOUSE_ROUTES,
 * LIGHTHOUSE_EVIDENCE_DIR, CHROME_PATH (defaults to the pinned Edge). */
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.LIGHTHOUSE_URL || 'http://127.0.0.1:4199';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.LIGHTHOUSE_EVIDENCE_DIR || 'docs/visionary/baseline/lighthouse-2026-10-30');
const routes = (process.env.LIGHTHOUSE_ROUTES || '/, /pricing, /download, /student, /safety').split(',').map(r => r.trim()).filter(Boolean);
const GATES = { accessibility: 0.95, seo: 0.95 };
const BASELINE_AUDITS = ['color-contrast', 'heading-order', 'target-size', 'link-name'];

if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

await mkdir(evidenceDir, { recursive: true });
const receipt = { at: new Date().toISOString(), base, gates: GATES, routes: [], perfNote: 'performance is recorded, not gated - the D3 ledger holds the raw Fast3G LCP receipts and the fast-LCP next-wave lever' };

const runnerResultGroups = [];
for (const route of routes) {
  const chrome = await launch({ chromeFlags: [] });
  try {
    const result = await lighthouse(base + route, { port: chrome.port, output: 'json', logLevel: 'error' }, {
      extends: 'lighthouse:default',
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
    });
    const lhr = result.lhr;
    const categories = Object.fromEntries(Object.entries(lhr.categories).map(([k, c]) => [k, c.score]));
    const baseline = Object.fromEntries(BASELINE_AUDITS.map(id => {
      const a = lhr.audits[id];
      return [id, { score: a ? a.score : null, displayValue: a ? a.displayValue || null : null, titles: a && a.details && Array.isArray(a.details.items) ? a.details.items.slice(0, 3).map(i => i.node?.selector || i.node?.snippet || '').slice(0, 3) : [] }];
    }));
    const metrics = Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map(id => {
      const a = lhr.audits[id];
      return [id, a ? a.numericValue ?? a.score : null];
    }));
    const file = path.join(evidenceDir, `lighthouse${route === '/' ? '-root' : route.replaceAll('/', '-')}.json`);
    await writeFile(file, JSON.stringify(lhr, null, 1));
    receipt.routes.push({ route, categories, baseline, metrics, evidence: path.relative(productRoot, file) });
    runnerResultGroups.push({ route, categories, baseline });
    console.log(`  ${route} — perf ${categories.performance} · a11y ${categories.accessibility} · bp ${categories['best-practices']} · seo ${categories.seo}`);
  } finally {
    await chrome.kill();
  }
}

for (const { route, categories } of runnerResultGroups) {
  for (const [category, gate] of Object.entries(GATES)) {
    const score = categories[category];
    assert.ok(score !== null && score >= gate, `${route} ${category} ${score} below gate ${gate}`);
  }
}
for (const { route, baseline } of runnerResultGroups) {
  for (const [id, item] of Object.entries(baseline)) {
    assert.ok(item.score === null || item.score === 1, `${route} baseline regression ${id} (score ${item.score}): ${JSON.stringify(item.titles)}`);
  }
}
await writeFile(path.join(evidenceDir, 'lighthouse-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log('PASS lighthouse gates on the production build (a11y >= 0.95, SEO >= 0.95, zero regressions on the four 2026-10-20 baseline audits; perf + best-practices recorded, not gated).');
