import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
const OUT = "scripts-tmp/shots/journey-verify";
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new" });

// desktop: capture two consecutive auto-advances to prove the crossfade
// (no blank frame), then a click-taken-over state
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForSelector('section[data-section="06-journey"]', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 4500));
await p.evaluate(() => document.querySelector('[data-section="06-journey"]').scrollIntoView({ behavior: "instant", block: "start" }));
await new Promise((r) => setTimeout(r, 1000));

const state = () => p.evaluate(() => {
  const imgs = [...document.querySelectorAll('[data-section="06-journey"] .relative img')];
  const visible = imgs.filter((im) => getComputedStyle(im).opacity === "1").length;
  const border = getComputedStyle(document.querySelector('[data-section="06-journey"] .relative')).borderTopWidth;
  const titles = [...document.querySelectorAll('[data-section="06-journey"] button > span.flex-1 > span:first-child')].map((t) => t.textContent.trim());
  return { visibleImages: visible, mediaBorder: border, stepTitles: titles };
});
console.log("STATE-A:", JSON.stringify(await state()));
await p.screenshot({ path: `${OUT}/journey-1440-a.png`, captureBeyondViewport: false });

// wait for the auto-advance (fill = 4000ms) and re-check: exactly one visible image, no blank
await new Promise((r) => setTimeout(r, 4300));
console.log("STATE-B (after auto-advance):", JSON.stringify(await state()));
await p.screenshot({ path: `${OUT}/journey-1440-b.png`, captureBeyondViewport: false });

// mobile
const m = await browser.newPage();
await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await m.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await m.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
await m.waitForSelector('section[data-section="06-journey"]', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 4500));
await m.evaluate(() => document.querySelector('[data-section="06-journey"]').scrollIntoView({ behavior: "instant", block: "start" }));
await new Promise((r) => setTimeout(r, 1000));
await m.screenshot({ path: `${OUT}/journey-390.png`, captureBeyondViewport: false });

// join: language exit → journey entry
await m.evaluate(() => {
  const s = document.querySelector('[data-section="06-journey"]');
  window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().top - window.innerHeight * 0.55, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 900));
await m.screenshot({ path: `${OUT}/join-language-journey-390.png`, captureBeyondViewport: false });
await browser.close();
console.log("done");
