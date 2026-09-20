/* Reveal-aware full-page shot: scrolls through the page to fire IntersectionObservers, then captures. */
import { chromium } from "playwright-core";

const [route, tag] = process.argv.slice(2);
const widths = tag === "390" ? [[390, 844]] : tag === "both" ? [[1440, 900], [390, 844]] : [[1440, 900]];
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
for (const [w, h] of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
  await page.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
  await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
  // scroll through in viewport steps so every FadeReveal fires
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(900);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const name = route.split("/").filter(Boolean).join("-") || "home";
  await page.screenshot({ path: `scripts-tmp/parity-shots/${name}-${w}.png`, fullPage: true });
  console.log(`${route} @${w}: overflow=${overflow} errors=${errors.length}`);
  await page.close();
}
await browser.close();
