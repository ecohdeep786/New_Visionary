import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
const OUT = "scripts-tmp/shots/cardslide-verify";
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
  const dots = [...document.querySelectorAll('[data-section="06-journey"] [role="group"][aria-label="Carousel slides"] button')];
  const activeDot = dots.findIndex((d) => d.getAttribute("aria-pressed") === "true");
  const pauseBtn = document.querySelector('[data-section="06-journey"] button[aria-label*="journey"]');
  return {
    cardWidth: Math.round(card.getBoundingClientRect().width),
    peek: Math.round(window.innerWidth - 24 - card.getBoundingClientRect().width - 24 - 24),
    activeDot,
    pauseLabel: pauseBtn?.getAttribute("aria-label"),
    bg: getComputedStyle(document.querySelector('[data-section="06-journey"]')).backgroundColor,
    trackScrollable: track.scrollWidth > track.clientWidth,
  };
});
console.log("STATE-A:", JSON.stringify(await state()));
await p.screenshot({ path: `${OUT}/journey-1440-a.png`, captureBeyondViewport: false });

// wait for auto-advance (5s) and confirm the dot moved
await new Promise((r) => setTimeout(r, 5600));
console.log("STATE-B (after auto-advance):", JSON.stringify(await state()));
await p.screenshot({ path: `${OUT}/journey-1440-b.png`, captureBeyondViewport: false });

// click dot 4 → card jumps
await p.evaluate(() => {
  const dots = [...document.querySelectorAll('[data-section="06-journey"] [role="group"][aria-label="Carousel slides"] button')];
  dots[3].click();
});
await new Promise((r) => setTimeout(r, 1200));
console.log("STATE-C (after dot 4 click):", JSON.stringify(await state()));
await p.screenshot({ path: `${OUT}/journey-1440-d4.png`, captureBeyondViewport: false });

// pause toggle
await p.evaluate(() => document.querySelector('[data-section="06-journey"] button[aria-label*="journey"]').click());
console.log("STATE-D (after pause click):", JSON.stringify(await state()));

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
  window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().top - window.innerHeight * 0.6, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 900));
await m.screenshot({ path: `${OUT}/join-language-journey-390.png`, captureBeyondViewport: false });
// join: journey → trust
await m.evaluate(() => {
  const s = document.querySelector('[data-section="08-trust"]');
  window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().top - window.innerHeight * 0.75, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 900));
await m.screenshot({ path: `${OUT}/join-journey-trust-390.png`, captureBeyondViewport: false });
await browser.close();
console.log("done");
