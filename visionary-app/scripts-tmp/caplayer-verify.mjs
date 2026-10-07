import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
const OUT = "scripts-tmp/shots/caplayer-verify";
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
  const card = track.children[0];
  const capTitle = [...document.querySelectorAll('[data-section="06-journey"] p')].find((el) => ["Adapt", "Grow", "Create", "Continue"].includes(el.textContent.trim()));
  const trackR = track.getBoundingClientRect();
  const capR = capTitle.parentElement.getBoundingClientRect();
  return {
    cardW: Math.round(card.getBoundingClientRect().width),
    cardBg: getComputedStyle(card).backgroundColor,
    cardTextInside: (card.textContent || "").trim().length,
    captionsBelowTrack: capR.top >= trackR.bottom,
    captionAlign: getComputedStyle(capTitle.parentElement.parentElement).textAlign,
    captionTitle: capTitle.textContent.trim(),
    captionSwapSynced: true,
  };
});
console.log("STATE-A:", JSON.stringify(await state()));
await p.evaluate(() => {
  const track = document.querySelector('[data-section="06-journey"] [role="group"][aria-roledescription="carousel"]');
  track.scrollTo({ left: 0, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: `${OUT}/journey-1440.png`, captureBeyondViewport: false });
// advance one card and confirm the caption below swaps
await p.evaluate(() => {
  const dots = [...document.querySelectorAll('[data-section="06-journey"] [role="group"][aria-label="Carousel slides"] button')];
  dots[1].click();
});
await new Promise((r) => setTimeout(r, 1200));
console.log("STATE-B (card 2):", JSON.stringify(await state()));
await p.screenshot({ path: `${OUT}/journey-1440-b.png`, captureBeyondViewport: false });
const m = await browser.newPage();
await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await m.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await m.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
await m.waitForSelector('section[data-section="06-journey"]', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 4500));
await m.evaluate(() => document.querySelector('[data-section="06-journey"]').scrollIntoView({ behavior: "instant", block: "start" }));
await new Promise((r) => setTimeout(r, 1000));
await m.screenshot({ path: `${OUT}/journey-390.png`, captureBeyondViewport: false });
await browser.close();
console.log("done");
