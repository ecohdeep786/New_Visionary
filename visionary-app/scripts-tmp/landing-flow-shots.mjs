import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "scripts-tmp/shots/landing-flow";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

async function shot(page, path) {
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/${path}.png` });
  console.log("shot", path);
}

/* Desktop 1440 — the scroll story */
{
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await shot(p, "d-01-hero-rest");

  /* the glass moment — sheet halfway over the pinned hero */
  await p.evaluate(() => window.scrollTo({ top: 620, behavior: "instant" }));
  await shot(p, "d-02-glass-mid");

  /* sheet at top, problem content arriving */
  await p.evaluate(() => {
    document.querySelector('section[data-section="02-problem"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "d-03-problem");

  await p.evaluate(() => {
    document.querySelector('section[data-section="03-promise"]')?.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await shot(p, "d-04-promise");

  await p.evaluate(() => {
    document.querySelector('section[data-section="04-meet"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "d-05-meet-top");

  await p.evaluate(() => {
    const rows = document.querySelectorAll('section[data-section="04-meet"] [data-step]');
    rows[2]?.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await shot(p, "d-06-meet-row");

  await p.evaluate(() => {
    document.querySelector('section[data-section="07-language"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "d-07-language");

  await p.evaluate(() => {
    document.querySelector('section[data-section="06-journey"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "d-08-journey");

  await p.evaluate(() => {
    document.querySelector('section[data-section="08-trust"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "d-09-trust");

  await p.evaluate(() => {
    document.querySelector('section[data-section="09-cta"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "d-10-cta");

  const overflow = await p.evaluate(() => document.scrollingElement.scrollWidth > document.documentElement.clientWidth);
  const sticky = await p.evaluate(() => {
    const hero = document.querySelector('section[data-section="01-hero"]');
    return getComputedStyle(hero).position;
  });
  console.log("desktop overflow:", overflow, "| hero position:", sticky);
  await p.close();
}

/* Mobile 390 — hero, glass moment, problem, meet, journey, cta */
{
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await shot(p, "m-01-hero");
  await p.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
  await shot(p, "m-02-glass-mid");
  await p.evaluate(() => {
    document.querySelector('section[data-section="02-problem"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "m-03-problem");
  await p.evaluate(() => {
    document.querySelector('section[data-section="04-meet"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "m-05-meet");
  await p.evaluate(() => {
    document.querySelector('section[data-section="06-journey"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "m-08-journey");
  await p.evaluate(() => {
    document.querySelector('section[data-section="09-cta"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "m-10-cta");
  const overflow = await p.evaluate(() => document.scrollingElement.scrollWidth > document.documentElement.clientWidth);
  console.log("mobile overflow:", overflow);
  await p.close();
}

/* Persona hero regression (default branch untouched, but confirm) */
for (const route of ["student", "organization"]) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(`${BASE}/${route}`, { waitUntil: "networkidle2", timeout: 60000 });
  await shot(p, `p-${route}-d`);
  const overflow = await p.evaluate(() => document.scrollingElement.scrollWidth > document.documentElement.clientWidth);
  const pos = await p.evaluate(() => getComputedStyle(document.querySelector('section[data-section="01-hero"]')).position);
  console.log(route, "overflow:", overflow, "| hero position:", pos, "(must be relative)");
  await p.close();
}

await browser.close();
console.log("done");
