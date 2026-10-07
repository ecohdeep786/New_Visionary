import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
const OUT = "scripts-tmp/shots/reduce-verify";
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForSelector('section[data-section="06-journey"]', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 4500));
await p.evaluate(() => document.querySelector('[data-section="06-journey"]').scrollIntoView({ behavior: "instant", block: "start" }));
await new Promise((r) => setTimeout(r, 1000));
const state = () => p.evaluate(() => {
  const track = document.querySelector('[data-section="06-journey"] [role="group"][aria-roledescription="carousel"]');
  const r = track.children[0].getBoundingClientRect();
  return { cardW: Math.round(r.width), cardH: Math.round(r.height), ratio: (r.width / r.height).toFixed(2), pctViewport: Math.round((r.width / window.innerWidth) * 100) };
});
console.log("1440:", JSON.stringify(await state()));
await p.evaluate(() => {
  const track = document.querySelector('[data-section="06-journey"] [role="group"][aria-roledescription="carousel"]');
  track.scrollTo({ left: 0, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: `${OUT}/journey-1440.png`, captureBeyondViewport: false });
await browser.close();
console.log("done");
