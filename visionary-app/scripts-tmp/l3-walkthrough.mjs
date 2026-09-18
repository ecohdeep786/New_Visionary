import { chromium } from "playwright-core";

/* Wave L3 — 06-a11y (9 walkthroughs) + 07-perf (CLS on 9 pages). */
const PAGES = [
  { route: "/how-it-works", section: '[aria-label="Learning loop stages"]', name: "loop" },
  { route: "/pricing", section: 'th[scope="row"]', name: "comparison-table" },
  { route: "/download", section: "#notify-email", name: "notify-form" },
  { route: "/about", section: "#mission", name: "mission" },
  { route: "/research", section: "main h2", name: "research-head" },
  { route: "/community", section: "main", name: "community" },
  { route: "/updates", section: "main", name: "updates" },
  { route: "/partners", section: "#directory", name: "directory" },
  { route: "/referral", section: "#start", name: "referral-form" },
];

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const phone = await browser.newPage({ viewport: { width: 360, height: 780 } });
const results = [];

for (const { route, section, name } of PAGES) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await p.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(800);
  const a11y = await p.evaluate((sel) => ({
    h1: document.querySelectorAll("h1").length,
    h1Text: document.querySelector("h1")?.textContent?.trim().slice(0, 50) || null,
    main: Boolean(document.querySelector("main")),
    nav: Boolean(document.querySelector("header, nav")),
    footer: Boolean(document.querySelector("footer")),
    sectionPresent: Boolean(document.querySelector(sel)),
    langAttr: document.documentElement.getAttribute("lang"),
  }), section);
  await p.close();

  const cls = await phone.evaluate(() => new Promise((res) => {
    let sum = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) sum += e.value; })
      .observe({ type: "layout-shift", buffered: true });
    setTimeout(() => res(Math.round(sum * 1000) / 1000), 1000);
  })).catch(() => null);
  // reload page on the phone viewport for its own CLS
  await phone.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  const cls360 = await phone.evaluate(() => new Promise((res) => {
    let sum = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) sum += e.value; })
      .observe({ type: "layout-shift", buffered: true });
    setTimeout(() => res(Math.round(sum * 1000) / 1000), 1200);
  })).catch(() => null);

  results.push({ route, name, a11y, cls360 });
  console.log(route, "h1:" + a11y.h1, "main:" + a11y.main, "section:" + a11y.sectionPresent, "CLS@360:" + cls360);
}
await browser.close();
