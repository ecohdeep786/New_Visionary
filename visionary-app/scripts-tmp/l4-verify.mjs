import { chromium } from "playwright-core";
import { mkdirSync } from "fs";

/* Wave L4 — 06-a11y walkthroughs + 07-perf CLS + 10-pixel shots for the 8 trust/legal/company pages. */
const PAGES = [
  { route: "/privacy", section: "#grievance-officer", name: "privacy" },
  { route: "/terms", section: "#who-can-use", name: "terms" },
  { route: "/cookies", section: "#principles", name: "cookies" },
  { route: "/safety", section: "#principles", name: "safety" },
  { route: "/security", section: "#your-information", name: "security" },
  { route: "/accessibility", section: "#why-accessibility", name: "accessibility" },
  { route: "/careers", section: "#careers-notify-email", name: "careers" },
  { route: "/contact", section: "#contact-routes", name: "contact" },
];
const WIDTHS = [
  { w: 360, h: 780, tag: "360" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1440, h: 900, tag: "1440" },
];

mkdirSync("docs/Frontend(Head Of Product Agent)/l4-shots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const log = [];

for (const { route, section, name } of PAGES) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
  await p.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await p.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(700);
  const a11y = await p.evaluate((sel) => ({
    h1: document.querySelectorAll("h1").length,
    main: Boolean(document.querySelector("main")),
    nav: Boolean(document.querySelector("header, nav")),
    footer: Boolean(document.querySelector("footer")),
    section: Boolean(document.querySelector(sel)),
    lastUpdated: document.body.innerText.includes("Last updated"),
    lang: document.documentElement.getAttribute("lang"),
  }), section);
  log.push(`${name}: h1=${a11y.h1} main=${a11y.main} nav=${a11y.nav} footer=${a11y.footer} section=${a11y.section} date=${a11y.lastUpdated} lang=${a11y.lang} errors=${errors.length}`);

  // pixel shots × 3 widths
  for (const v of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
    try { await page.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(700);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `docs/Frontend(Head Of Product Agent)/l4-shots/${name}-${v.tag}.png` });
    log.push(`  ${name} @${v.tag}: overflow=${overflow}`);
    await page.close();
  }
  // CLS @360
  const phone = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await phone.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
  const cls = await phone.evaluate(() => new Promise((res) => {
    let sum = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) sum += e.value; })
      .observe({ type: "layout-shift", buffered: true });
    setTimeout(() => res(Math.round(sum * 1000) / 1000), 1200);
  }));
  log.push(`  ${name} CLS@360=${cls}`);
  await phone.close();
  await p.close();
}
await browser.close();
console.log(log.join("\n"));
