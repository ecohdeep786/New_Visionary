import { chromium } from "playwright-core";
import { mkdirSync } from "fs";

const BASE = "http://localhost:4173";
const SHOTS = [
  { route: "/", name: "landing" },
  { route: "/student", name: "persona-student" },
  { route: "/parent", name: "persona-parent" },
  { route: "/organization", name: "persona-organization" },
  { route: "/pricing", name: "pricing" },
  { route: "/careers", name: "careers" },
  { route: "/updates", name: "updates" },
  { route: "/privacy", name: "legal-privacy" },
  { route: "/login", name: "auth-login" },
  { route: "/no-such-page", name: "404" },
];
const WIDTHS = [
  { w: 360, h: 780, tag: "360" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1440, h: 900, tag: "1440" },
];

mkdirSync("docs/Frontend(Head Of Product Agent)/l1-shots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });

const log = [];
for (const s of SHOTS) {
  for (const v of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
    try { await page.goto(BASE + s.route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
    await page.waitForTimeout(1000);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
    const mounted = await page.evaluate(() => Boolean(document.querySelector("#root")?.children.length));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const file = `docs/Frontend(Head Of Product Agent)/l1-shots/${s.name}-${v.tag}.png`;
    await page.screenshot({ path: file, fullPage: false });
    log.push(`${s.route} @${v.tag}: mounted=${mounted} overflow=${overflow}${errors.length ? " ERR:" + errors[0] : ""}`);
    await page.close();
  }
}
await browser.close();
console.log(log.join("\n"));
