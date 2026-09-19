import { chromium } from "playwright-core";
import { mkdirSync } from "fs";

/* Wave L5 — 10-pixel: ALL public routes x 360/768/1440. */
const BASE = "http://localhost:4173";
const ROUTES = ["/","/student","/teacher","/parent","/professional","/organization","/help","/how-it-works","/about","/pricing","/download","/research","/careers","/community","/contact","/partners","/updates","/referral","/safety","/privacy","/terms","/security","/accessibility","/cookies","/signin","/definitely-not-a-page"];
const WIDTHS = [
  { w: 360, h: 780, tag: "360" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1440, h: 900, tag: "1440" },
];
mkdirSync("docs/Frontend(Head Of Product Agent)/l6img-shots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const log = [];
for (const route of ROUTES) {
  const name = route === "/" ? "home" : route.split("/").filter(Boolean).join("-");
  for (const v of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
    try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `docs/Frontend(Head Of Product Agent)/l6img-shots/${name}-${v.tag}.png` });
    log.push(`${route} @${v.tag}: overflow=${overflow} errors=${errors.length}`);
    await page.close();
  }
}
await browser.close();
console.log(log.join("\n"));
