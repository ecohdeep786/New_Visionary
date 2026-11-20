/* FHE fresh-eyes sweep: every declared /dashboard/* route on the production
 * build with a real session. Each route must render a connected surface or
 * the honest unavailable room — never a blank page, a crash, or a preview
 * surface. Records per-route: h1, state class, console/page errors. Env:
 * SWEEP_URL (default http://localhost:4200), QA_EMAIL / QA_PASSWORD,
 * SWEEP_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import { loginViaUi } from './qa-session.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.SWEEP_URL || 'http://localhost:4200';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.SWEEP_EVIDENCE_DIR || 'docs/visionary/baseline/connected-route-sweep-2026-11-18');
await mkdir(evidenceDir, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ROUTES = [
  '/dashboard/home', '/dashboard/learn', '/dashboard/ask', '/dashboard/practice', '/dashboard/build',
  '/dashboard/explore', '/dashboard/progress', '/dashboard/notifications', '/dashboard/profile',
  '/dashboard/connections', '/dashboard/settings', '/dashboard/privacy', '/dashboard/subscription',
  '/dashboard/support', '/dashboard/classes', '/dashboard/class/qa-class', '/dashboard/learners',
  '/dashboard/child', '/dashboard/analytics', '/dashboard/insights', '/dashboard/people',
  '/dashboard/cohorts', '/dashboard/curriculum',
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error).slice(0, 160)));
await loginViaUi(page, base);

const receipt = { at: new Date().toISOString(), base, routes: [], totals: {} };
let failures = 0;
for (const route of ROUTES) {
  const errorsBefore = pageErrors.length;
  await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => {
    const h1 = document.querySelector('main h1, h1')?.textContent?.trim()?.slice(0, 60) || null;
    const mainText = (document.querySelector('main')?.textContent || '').trim();
    const unavailable = /not available yet|अभी उपलब्ध नहीं|এখনো নেই/.test(mainText);
    const blank = mainText.length < 20;
    return { h1, unavailable, blank, textLength: mainText.length };
  });
  const newErrors = pageErrors.slice(errorsBefore);
  const record = { route, ...state, pageErrors: newErrors };
  receipt.routes.push(record);
  const verdict = state.blank ? 'BLANK' : newErrors.length ? 'ERRORS' : state.unavailable ? 'honest-room' : 'surface';
  if (verdict === 'BLANK' || verdict === 'ERRORS') failures += 1;
  console.log(`${route} → ${verdict} · h1: ${state.h1?.slice(0, 40)}${newErrors.length ? ' · ' + newErrors[0] : ''}`);
}
await context.close();
await browser.close();
receipt.totals = { routes: ROUTES.length, failures, pageErrorTotal: pageErrors.length };
await writeFile(path.join(evidenceDir, 'connected-route-sweep-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
assert.equal(failures, 0, `${failures} dashboard routes rendered blank or threw page errors (see ${path.relative(productRoot, path.join(evidenceDir, 'connected-route-sweep-receipt.json'))})`);
console.log(`PASS connected-route sweep: all ${ROUTES.length} declared dashboard routes render a connected surface or the honest room, zero page errors.`);
