/* FHE-19 zoom verification (V6 §4 responsive law: "intermediate resize/zoom").
 *
 * Simulates browser zoom by halving the CSS viewport: 640×400 is the 200%
 * equivalent of the 1280×800 desktop layout, and 320×220 is the 400%
 * equivalent. Every audited surface must reflow without horizontal overflow
 * — zoom must change scale, never break the layout.
 *
 * Two contexts: a signed-out visitor (public + auth surfaces) and a signed-in
 * account (the connected workspace shell). Env: ZOOM_URL (default
 * http://localhost:4200), QA_EMAIL / QA_PASSWORD (realm account),
 * ZOOM_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import { loginViaUi } from './qa-session.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.ZOOM_URL || 'http://localhost:4200';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.ZOOM_EVIDENCE_DIR || 'docs/visionary/baseline/zoom-audit-2026-11-18');
await mkdir(evidenceDir, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const PUBLIC_SURFACES = ['/', '/login', '/register', '/pricing', '/student'];
const DASHBOARD_SURFACES = ['/dashboard/home', '/dashboard/profile', '/dashboard/connections', '/dashboard/learn', '/dashboard/privacy', '/dashboard/settings', '/dashboard/subscription'];
const ZOOM_LEVELS = [
  { name: '200%', width: 640, height: 400 },
  { name: '400%', width: 320, height: 220 },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const receipt = { at: new Date().toISOString(), base, levels: ZOOM_LEVELS.map(l => l.name), surfaces: [], totals: {} };
let overflowTotal = 0;

function overflowReport(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const overflow = root.scrollWidth - root.clientWidth;
    // Name the widest offender when the surface overflows, so fixes are aimed.
    let offender = null;
    if (overflow > 1) {
      let widest = 0;
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > root.clientWidth + 1 && r.width > widest) { widest = r.width; offender = el.tagName + '.' + String(el.className).slice(0, 60); }
      }
    }
    return { overflow, h1: document.querySelector('main h1, h1')?.textContent?.trim()?.slice(0, 44) || null, offender };
  });
}

for (const level of ZOOM_LEVELS) {
  // Signed-out visitor: public + auth surfaces.
  const visitor = await browser.newContext({ viewport: { width: level.width, height: level.height }, reducedMotion: 'reduce' });
  const vPage = await visitor.newPage();
  for (const route of PUBLIC_SURFACES) {
    await vPage.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await vPage.waitForTimeout(1200);
    const report = await overflowReport(vPage);
    overflowTotal += report.overflow > 1 ? 1 : 0;
    receipt.surfaces.push({ level: level.name, signedIn: false, route, overflow: report.overflow, h1: report.h1, offender: report.offender });
    console.log(`[${level.name}] visitor ${route} — overflow ${report.overflow}px${report.offender ? '  offender: ' + report.offender : ''}`);
  }
  await visitor.close();

  // Signed-in account: the connected workspace shell.
  const account = await browser.newContext({ viewport: { width: level.width, height: level.height }, reducedMotion: 'reduce' });
  const aPage = await account.newPage();
  await loginViaUi(aPage, base);
  for (const route of DASHBOARD_SURFACES) {
    await aPage.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await aPage.waitForTimeout(1200);
    const report = await overflowReport(aPage);
    overflowTotal += report.overflow > 1 ? 1 : 0;
    receipt.surfaces.push({ level: level.name, signedIn: true, route, overflow: report.overflow, h1: report.h1, offender: report.offender });
    console.log(`[${level.name}] account ${route} — overflow ${report.overflow}px${report.offender ? '  offender: ' + report.offender : ''}`);
  }
  await account.close();
}

await browser.close();
receipt.totals = { surfacesAudited: receipt.surfaces.length, overflowingSurfaces: overflowTotal };
await writeFile(path.join(evidenceDir, 'zoom-audit-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
assert.equal(overflowTotal, 0, `${overflowTotal} surfaces overflow horizontally under zoom (see ${path.relative(productRoot, path.join(evidenceDir, 'zoom-audit-receipt.json'))})`);
console.log('PASS zoom audit: every audited public, auth and connected surface reflows without horizontal overflow at 200% and 400% zoom.');
