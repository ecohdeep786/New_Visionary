/* F-27 (Web Performance Engineer): Core Web Vitals measurement on the
 * production build. Lighthouse 13's trace processor fails in this
 * environment (NO_NAVSTART on the Edge channel — pre-existing; the FAP-31
 * receipts carry the same null-perf shape), so this measures the same
 * lab conditions directly: CDP network+CPU throttling (Lighthouse's mobile
 * profile: 1.6 Mbps down, 150 ms RTT, 4x CPU) with PerformanceObserver
 * collection of FCP/LCP/CLS and long-task TBT. Findings only: nothing gates.
 * Env: CWV_URL (default http://127.0.0.1:4199), CWV_ROUTES, CWV_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.CWV_URL || 'http://127.0.0.1:4199';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.CWV_EVIDENCE_DIR || 'docs/visionary/baseline/f27-performance-2026-11-06');
const routes = (process.env.CWV_ROUTES || '/, /pricing, /student, /login').split(',').map(r => r.trim()).filter(Boolean);
await mkdir(evidenceDir, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const THROTTLE = { download: (1638.4 * 1024) / 8, upload: (675 * 1024) / 8, latency: 150 }; // Lighthouse mobile profile, bytes/s
const CPU_SLOWDOWN = 4;

const receipt = { at: new Date().toISOString(), base, throttling: `CDP: ${Math.round(THROTTLE.download * 8 / 1024)}kbps down / ${THROTTLE.latency}ms RTT / ${CPU_SLOWDOWN}x CPU (Lighthouse mobile profile)`, routes: [] };

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
for (const route of routes) {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__f27 = { lcp: 0, lcpEl: '', cls: 0, fcp: 0, longTaskMs: 0, tbtStart: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (e.entryType === 'largest-contentful-paint') { window.__f27.lcp = e.startTime; window.__f27.lcpEl = `${e.element?.tagName || '?'}${e.element?.className ? '.' + String(e.element.className).split(' ')[0] : ''} ${Math.round(e.size)}B`; }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!window.__f27.fcp && e.name === 'first-contentful-paint') window.__f27.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.entryType === 'layout-shift' && !e.hadRecentInput) window.__f27.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.startTime >= window.__f27.tbtStart) window.__f27.longTaskMs += Math.max(0, e.duration - 50);
      }
    }).observe({ type: 'longtask', buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: THROTTLE.download, uploadThroughput: THROTTLE.upload, latency: THROTTLE.latency });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  const t0 = Date.now();
  await page.goto(base + route, { waitUntil: 'load', timeout: 120000 });
  /* TBT window: from FCP to 5s of network+CPU quiet (lighthouse's quiet window) */
  await page.evaluate(() => { window.__f27.tbtStart = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0; });
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { /* still counting */ }
  await page.waitForTimeout(5000);
  const m = await page.evaluate(() => window.__f27);
  const wallMs = Date.now() - t0;
  const row = {
    route,
    fcpMs: Math.round(m.fcp),
    lcpMs: Math.round(m.lcp),
    cls: Number(m.cls.toFixed(4)),
    tbtMs: Math.round(m.longTaskMs),
    lcpElement: m.lcpEl,
    wallClockMs: wallMs,
  };
  receipt.routes.push(row);
  console.log(`${route.padEnd(10)} FCP ${String(row.fcpMs).padStart(6)}ms  LCP ${String(row.lcpMs).padStart(6)}ms  CLS ${String(row.cls).padStart(7)}  TBT ${String(row.tbtMs).padStart(6)}ms  wall ${String(row.wallClockMs).padStart(7)}ms  LCP=<${row.lcpElement}>`);
  await context.close();
}
await browser.close();
await writeFile(path.join(evidenceDir, 'cwv-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`CWV receipt: ${path.relative(productRoot, path.join(evidenceDir, 'cwv-receipt.json'))}`);
