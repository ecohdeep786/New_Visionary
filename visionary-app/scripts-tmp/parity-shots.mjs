/* Design-parity QA — full-page shots of touched routes at 1440/390. */
import { chromium } from "playwright-core";
import { mkdirSync } from "fs";

const BASE = "http://localhost:4173";
const ROUTES = ["/updates", "/contact", "/careers", "/research", "/pricing", "/how-it-works"];
const WIDTHS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 390, h: 844, tag: "390" },
];
mkdirSync("scripts-tmp/parity-shots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const log = [];
for (const route of ROUTES) {
  const name = route.split("/").filter(Boolean).join("-");
  for (const v of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
    try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim().slice(0, 60));
    await page.screenshot({ path: `scripts-tmp/parity-shots/${name}-${v.tag}.png`, fullPage: true });
    log.push(`${route} @${v.tag}: overflow=${overflow} h1="${h1}" errors=${errors.length}${errors.length ? " :: " + errors.join("|") : ""}`);
    await page.close();
  }
}
await browser.close();
console.log(log.join("\n"));
