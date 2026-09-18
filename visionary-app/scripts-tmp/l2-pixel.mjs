import { chromium } from "playwright-core";
import { mkdirSync } from "fs";

/* Wave L2 — 10-pixel: persona pages at 7 widths. */
const BASE = "http://localhost:4173";
const SHOTS = [
  { route: "/", name: "landing" },
  { route: "/student", name: "persona-student" },
  { route: "/teacher", name: "persona-teacher" },
  { route: "/parent", name: "persona-parent" },
  { route: "/professional", name: "persona-professional" },
  { route: "/organization", name: "persona-organization" },
];
const WIDTHS = [
  { w: 360, h: 780, tag: "360" },
  { w: 390, h: 844, tag: "390" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1024, h: 768, tag: "1024" },
  { w: 1280, h: 800, tag: "1280" },
  { w: 1440, h: 900, tag: "1440" },
  { w: 1920, h: 1080, tag: "1920" },
];

mkdirSync("docs/Frontend(Head Of Product Agent)/l2-shots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const log = [];
for (const s of SHOTS) {
  for (const v of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
    try { await page.goto(BASE + s.route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `docs/Frontend(Head Of Product Agent)/l2-shots/${s.name}-${v.tag}.png` });
    log.push(`${s.name} @${v.tag}: overflow=${overflow} errors=${errors.length}`);
    await page.close();
  }
}
await browser.close();
console.log(log.join("\n"));
