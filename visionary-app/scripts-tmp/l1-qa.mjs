import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

/* Wave L1 — 09-qa-linkcheck: runtime crawl, meta/preload/redirect checks, console sweep, CLS. */
const BASE = "http://localhost:4173";
const ROUTES = [
  "/", "/login", "/register", "/forgot-password", "/forgot-user-id",
  "/student", "/teacher", "/parent", "/professional", "/organization",
  "/help", "/how-it-works", "/about", "/pricing", "/download", "/research",
  "/careers", "/community", "/contact", "/partners", "/updates",
  "/referral", "/safety", "/privacy", "/terms", "/security", "/accessibility",
  "/cookies", "/definitely-not-a-page",
];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/forgot-user-id"];
const META_ROUTES = ROUTES.filter((r) => r !== "/definitely-not-a-page" && !AUTH_ROUTES.includes(r));
const WIDTHS = [
  { name: "360", width: 360, height: 780 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];
const PRELOAD_ROUTES = ["/", "/student", "/teacher", "/parent", "/professional", "/organization"];

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const report = { consoleErrors: [], meta: [], preloads: [], checks: [], cls: [] };
const titles = new Map();
const safeEval = async (page, fn) => {
  for (let i = 0; i < 3; i++) {
    try { return await page.evaluate(fn); } catch (e) { await page.waitForTimeout(600); }
  }
  return null;
};

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: width.width, height: width.height } });
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
    page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 160)));
    page.on("response", (r) => { if (r.status() >= 400) errors.push("HTTP " + r.status() + " " + r.url().slice(-80)); });
    try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
    await page.waitForTimeout(600);

    if (width.name === "1440") {
      const meta = await safeEval(page, () => ({
        finalPath: location.pathname,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || null,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
        ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
        twitterCard: document.querySelector('meta[name="twitter:card"]')?.content || null,
        canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      }));
      if (AUTH_ROUTES.includes(route)) { report.meta.push({ route, authOnly: true, ...meta }); } else { report.meta.push({ route, ...meta }); }
      titles.set(meta.title, (titles.get(meta.title) || 0) + 1);

      const h1 = await safeEval(page, () => document.querySelectorAll("h1").length);
      if (h1 !== 1) report.checks.push(`H1-COUNT ${route}: ${h1} h1 elements`);
    }

    if (width.name === "360") {
      const overflow = await safeEval(page, () => document.documentElement.scrollWidth - window.innerWidth) ?? 0;
      if (overflow > 0) report.checks.push(`OVERFLOW ${route} @360: +${overflow}px`);
      // CLS via buffered layout-shift entries
      const cls = await safeEval(page, () => new Promise((res) => {
        let sum = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) sum += e.value; })
          .observe({ type: "layout-shift", buffered: true });
        setTimeout(() => res(Math.round(sum * 1000) / 1000), 1200);
      }));
      report.cls.push({ route, width: 360, cls });
    }

    if (errors.length) report.consoleErrors.push({ route, width: width.name, errors });
    await page.close();
  }
}

// targeted checks at 1440
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // /signin redirect
  await page.goto(BASE + "/signin", { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
  const landed = await safeEval(page, () => location.pathname) ?? "?";
  report.checks.push(landed === "/login" ? `REDIRECT /signin → ${landed} OK` : `REDIRECT FAIL /signin → ${landed}`);

  // preloads
  for (const route of PRELOAD_ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
    const pl = await safeEval(page, () => {
      const el = document.querySelector('link[rel="preload"][data-page-lcp]');
      return el ? { href: el.getAttribute("href"), fp: el.getAttribute("fetchpriority"), as: el.getAttribute("as") } : null;
    });
    report.preloads.push({ route, preload: pl });
  }

  // footer placeholder links anywhere
  for (const route of ["/", "/pricing", "/privacy"]) {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
    const hashes = await safeEval(page, () => [...document.querySelectorAll('a[href="#"]')].map((a) => a.getAttribute("aria-label") || a.textContent.trim()));
    if (hashes.length) report.checks.push(`HREF-# on ${route}: ${hashes.join(", ")}`);
  }
  await page.close();
}

report.duplicateTitles = [...titles.entries()].filter(([, n]) => n > 1).map(([t]) => t);
report.shortTitles = report.meta.filter((m) => m.title && m.title.length > 60).map((m) => m.route + " (" + m.title.length + ")");
report.missingMeta = report.meta.filter((m) => !m.authOnly && (!m.description || !m.ogTitle || !m.twitterCard || !m.canonical)).map((m) => m.route);
report.authTouched = report.meta.filter((m) => m.authOnly && m.canonical).map((m) => m.route);
// auth surfaces must have NO head-system tags (landing pack does not own them)
report.authHeadCheck = AUTH_ROUTES.map((route) => ({ route, auth: report.meta.find((m) => m.route === route) }));
report.clsFail = report.cls.filter((c) => c.cls >= 0.1);
writeFileSync("scripts-tmp/l1-qa-report.json", JSON.stringify(report, null, 2));

console.log("console/page errors:", report.consoleErrors.length ? JSON.stringify(report.consoleErrors.slice(0, 8), null, 1) : "0");
console.log("missing meta:", report.missingMeta.length ? report.missingMeta : "0");
console.log("titles >60:", report.shortTitles.length ? report.shortTitles : "0");
console.log("duplicate titles:", report.duplicateTitles.length ? report.duplicateTitles : "0");
console.log("checks:", report.checks.length ? report.checks : "all pass");
console.log("CLS fails:", report.clsFail.length ? JSON.stringify(report.clsFail) : "0");
console.log("preloads:", report.preloads.map((p) => p.route + ":" + (p.preload ? "OK" : "MISSING")).join(" "));
await browser.close();
