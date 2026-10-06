import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
const OUT = "scripts-tmp/shots/align-verify";
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForSelector('section[data-section="08-trust"]', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 4500));
const state = () => p.evaluate(() => {
  const j = document.querySelector('[data-section="06-journey"]');
  const h2 = j.querySelector("h2");
  const card = j.querySelector('[role="group"][aria-roledescription="carousel"]').children[0];
  const sentence = card.querySelector("figcaption p");
  const cardText = (card.textContent || "").trim();
  const t = document.querySelector('[data-section="08-trust"]');
  const tH2 = t.querySelector("h2");
  return {
    journeyH2Left: h2.getBoundingClientRect().left,
    cardSentence: sentence?.textContent.trim().slice(0, 40),
    cardHasTitle: /Adapt|Grow|Create|Continue/.test(cardText) && cardText.includes(sentence.textContent.trim()) ? "sentence-only?" : cardText.slice(0, 60),
    cardW: Math.round(card.getBoundingClientRect().width),
    cardH: Math.round(card.getBoundingClientRect().height),
    trustH2Left: Math.round(tH2.getBoundingClientRect().left),
  };
});
console.log("STATE:", JSON.stringify(await state()));
await p.evaluate(() => document.querySelector('[data-section="06-journey"]').scrollIntoView({ behavior: "instant", block: "start" }));
await new Promise((r) => setTimeout(r, 900));
await p.evaluate(() => {
  const track = document.querySelector('[data-section="06-journey"] [role="group"][aria-roledescription="carousel"]');
  track.scrollTo({ left: 0, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: `${OUT}/journey-1440.png`, captureBeyondViewport: false });
await p.evaluate(() => document.querySelector('[data-section="08-trust"]').scrollIntoView({ behavior: "instant", block: "start" }));
await new Promise((r) => setTimeout(r, 900));
await p.screenshot({ path: `${OUT}/trust-1440.png`, captureBeyondViewport: false });
await browser.close();
console.log("done");
