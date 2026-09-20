/* Full in-scope route sweep with reveal-aware scrolling at 1440. */
import { chromium } from "playwright-core";
import { mkdirSync } from "fs";

const ROUTES = ["/help", "/how-it-works", "/about", "/pricing", "/download", "/research", "/careers", "/community", "/contact", "/partners", "/updates", "/referral", "/safety", "/privacy", "/terms", "/security", "/accessibility", "/cookies", "/career"];
mkdirSync("scripts-tmp/parity-shots/sweep", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const log = [];
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
  try { await page.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
  await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y <= document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 130)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const name = route.split("/").filter(Boolean).join("-");
  await page.screenshot({ path: `scripts-tmp/parity-shots/sweep/${name}-1440.png`, fullPage: true });
  log.push(`${route}: overflow=${overflow} errors=${errors.length}${errors.length ? " :: " + errors.join("|") : ""}`);
  await page.close();
}
await browser.close();
console.log(log.join("\n"));
