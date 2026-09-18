import { chromium } from "playwright-core";
import { mkdirSync } from "fs";

/* Wave L3 — 10-pixel: 9 product-info pages × 3 widths + persona sections re-shoots @1440. */
const BASE = "http://localhost:4173";
const SHOTS = [
  { route: "/how-it-works", name: "how-it-works" },
  { route: "/pricing", name: "pricing" },
  { route: "/download", name: "download" },
  { route: "/about", name: "about" },
  { route: "/research", name: "research" },
  { route: "/community", name: "community" },
  { route: "/updates", name: "updates" },
  { route: "/partners", name: "partners" },
  { route: "/referral", name: "referral" },
];
const WIDTHS = [
  { w: 360, h: 780, tag: "360" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1440, h: 900, tag: "1440" },
];
/* persona pages for the srcSet carry-forward regression check */
const PERSONA = ["/student", "/teacher", "/parent", "/professional", "/organization"];

mkdirSync("docs/Frontend(Head Of Product Agent)/l3-shots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const log = [];
for (const s of SHOTS) {
  for (const v of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
    try { await page.goto(BASE + s.route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `docs/Frontend(Head Of Product Agent)/l3-shots/${s.name}-${v.tag}.png` });
    log.push(`${s.name} @${v.tag}: overflow=${overflow} errors=${errors.length}`);
    await page.close();
  }
}
/* persona full-scroll shots @1440 (sections 05/09/11 included via full-page scroll) */
for (const route of PERSONA) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
  try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
  await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: `docs/Frontend(Head Of Product Agent)/l3-shots/persona${route === "/" ? "-home" : route.replace(/\//g, "-")}-1440-full.png`, fullPage: false });
  log.push(`persona ${route} @1440: overflow=${overflow} errors=${errors.length}`);
  await page.close();
}
await browser.close();
console.log(log.join("\n"));
