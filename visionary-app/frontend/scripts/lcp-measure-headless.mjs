#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * D3/FAP-55 LCP lab — headless measurement (canonical receipt generator).
 *
 * Why: the desktop-pane compositor refused to paint after the sandbox
 * restart (screenshot reports "needs a visible tab" and PerformanceObserver
 * never buffers paint entries), so harness-driven receipts became
 * unavailable. Playwright-core + the local chromium-1243 bundle provide an
 * independent compositor: FCP/LCP fire for real in headless mode, so this
 * script IS the knob for the AC record ("LCP <2.5s on Fast 3G landing").
 *
 * Protocol parity with the desktop lab receipts:
 *   - navigation goes through the Fast3G proxy (:4180 -> :4173), so every
 *     byte crosses the same credit-bucket pacer and per-request RTT gate
 *   - viewport 1724x1172 @ DPR 1.31, matching the desktop harness density
 *     (the srcset law picks the same 2400w hero candidates at this density)
 *   - a fresh browser context per route => cold cache, honest wire
 *   - the LCP/CLS observers install via addInitScript BEFORE navigation, so
 *     not one paint frame is missed (the earlier in-page "attach after the
 *     fact" pattern is obsolete here)
 *
 * Usage: node scripts/lcp-measure-headless.mjs <route> [tag]
 * Writes one receipt JSON into artifacts/research/continuity-2026-10-24/
 * d3-performance/ and prints the summary to stdout.
 * ────────────────────────────────────────────────────────────────────────── */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROUTE = process.argv[2] || "/";
const TAG = process.argv[3] || "headless";
const PROXY_HOST = "http://localhost:4180";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, "..", "artifacts", "research", "continuity-2026-10-24", "d3-performance");

const RECORDER = /* js */ `
  (() => {
    const navList = performance.getEntriesByType("navigation");
    window.__rec = { lcp: [], cls: 0, start: navList.length ? navList[0].startTime : 0, url: location.href };
    const pick = (e) => ({
      t: e.startTime === undefined ? null : Math.round(e.startTime * 10) / 10,
      el: e.element && e.element.tagName ? e.element.tagName : null,
      src: e.element && e.element.currentSrc ? String(e.element.currentSrc).split("/").slice(-1).pop() : (e.url || null),
      attr: e.element && e.element.src ? String(e.element.src).split("/").slice(-1).pop() : null,
      size: e.size,
      id: e.element && e.element.id ? e.element.id : null,
    });
    try {
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__rec.lcp.push(pick(e)); })
        .observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__rec.cls += e.value; })
        .observe({ type: "layout-shift", buffered: true });
    } catch (err) {
      window.__rec.error = String(err);
    }
  })()`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1724, height: 1172 },
  deviceScaleFactor: 1.31,
});
await ctx.addInitScript(RECORDER);
const page = await ctx.newPage();

const target = PROXY_HOST + (ROUTE === "/" ? "/" : ROUTE);
await page.goto(target, { waitUntil: "load", timeout: 90000 });
await page.waitForTimeout(7000); // paint + font + candidate settle

const metrics = await page.evaluate(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const paint = performance.getEntriesByType("paint");
  const resources = performance.getEntriesByType("resource");
  const rec = window.__rec || { lcp: [], cls: 0, error: "recorder missing" };
  const ttf = resources
    .filter((r) => /\.ttf$/i.test(r.name))
    .map((r) => ({ file: r.name.split("/").pop(), initiator: r.initiatorType, bytes: r.transferSize, start: Math.round(r.startTime), end: Math.round(r.startTime + r.duration) }));
  const avif = resources
    .filter((r) => /\.avif$/i.test(r.name))
    .map((r) => ({ file: r.name.split("/").slice(-1).pop(), initiator: r.initiatorType, bytes: r.transferSize, start: Math.round(r.startTime), end: Math.round(r.startTime + r.duration) }));
  const prefetchish = resources
    .filter((r) => /AboutUsPage|PrivacyPage|SafetyPage|StudentPage|TeacherPage|ParentPage|OrganizationPage(-|\.)/.test(r.name))
    .map((r) => ({ file: r.name.split("/").slice(-1).pop(), start: Math.round(r.startTime) }));
  const jsEntries = resources.filter((r) => /\.js/.test(r.name));
  return {
    url: nav ? location.href : null,
    ttfbMs: nav ? Math.round(nav.responseStart - nav.startTime) : null,
    dclMs: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
    loadEndMs: nav && nav.loadEventEnd ? Math.round(nav.loadEventEnd - nav.startTime) : null,
    fcpMs: paint.find((p) => p.name === "first-contentful-paint")?.startTime ?? null,
    finalLcpMs: rec.lcp.length ? Math.round(rec.lcp[rec.lcp.length - 1].t) : null,
    finalLcp: rec.lcp.length ? rec.lcp[rec.lcp.length - 1] : null,
    lcpCount: rec.lcp.length,
    lcpTrail: rec.lcp.slice(0, 6),
    cls: Math.round(rec.cls * 1000) / 1000,
    recorderError: rec.error || null,
    ttf,
    fontsDoubleFetched: ttf.length > 4,
    avifCount: avif.length,
    avifTen: avif.slice(0, 10),
    prefetchStarts: prefetchish,
    staticFontFetched: ttf.some((r) => r.file.startsWith("GoogleSans-")),
    faviconBytes: resources.filter((r) => /favicon/.test(r.name)).reduce((a, r) => a + r.transferSize, 0),
    jsCount: jsEntries.length,
    jsBytes: jsEntries.reduce((a, r) => a + r.transferSize, 0),
  };
});

const slug = ROUTE === "/" ? "root" : ROUTE.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const outPath = path.join(OUT_DIR, `receipt-${TAG}-${slug}.json`);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ route: ROUTE, tag: TAG, via: "headless chromium via fast3g proxy", ...metrics }, null, 2) + "\n");
console.log(JSON.stringify({ route: ROUTE, receipt: outPath, ...metrics }, null, 1));
await browser.close();
