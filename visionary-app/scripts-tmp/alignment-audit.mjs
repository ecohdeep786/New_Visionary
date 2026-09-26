/* Alignment audit: on every route, the H1's left edge must sit inside the
   page container (x >= 80 at 1440) — catches edge-glued heroes. */
import { chromium } from "playwright-core";

const ROUTES = ["/help", "/how-it-works", "/about", "/pricing", "/download", "/research", "/careers", "/community", "/contact", "/partners", "/updates", "/referral", "/safety", "/privacy", "/terms", "/security", "/accessibility", "/cookies", "/career"];
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const log = [];
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
  await page.waitForSelector("h1", { timeout: 10000 }).catch(() => {});
  const r = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return null;
    const b = h1.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(h1);
    const rects = range.getClientRects();
    const x = rects.length ? Math.min(...[...rects].map((rc) => rc.left)) : b.left;
    return { x: Math.round(x), w: Math.round(window.innerWidth) };
  });
  log.push(`${route}: h1.x=${r ? r.x : "NO-H1"}${r && r.x < 80 ? "  <-- EDGE-GLUED" : ""}`);
  await page.close();
}
await browser.close();
console.log(log.join("\n"));
