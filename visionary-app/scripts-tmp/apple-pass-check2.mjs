/* Verify long-tail pages + mobile. Run: node scripts-tmp/apple-pass-check2.mjs */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/apple-pass";
mkdirSync(OUT, { recursive: true });

const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const TARGETS = [
  ["coaching-h1", "/how-it-works", 0],
  ["community-h1", "/community", 0],
  ["careers-h1", "/careers", 0],
  ["community-cards", "/community", 700],
  ["careers-cards", "/careers", 900],
  ["coaching-steps", "/how-it-works", 1600],
];

for (const [name, path, y] of TARGETS) {
  await p.goto(`http://localhost:5175${path}`, { waitUntil: "networkidle2", timeout: 60000 });
  await p.evaluate(() => document.fonts?.ready);
  if (y) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
  }
  await new Promise((r) => setTimeout(r, 1400));
  await p.screenshot({ path: `${OUT}/check-${name}.png` });
  console.log(`shot ${name}`);
}

// mobile spot check on student (kicker size, headline wrap, no overflow)
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await p.goto("http://localhost:5175/student", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: `${OUT}/check-mobile-hero.png` });
await p.evaluate(() => document.querySelector('[data-section="02-struggle"]')?.scrollIntoView({ behavior: "instant" }));
await new Promise((r) => setTimeout(r, 900));
await p.screenshot({ path: `${OUT}/check-mobile-struggle.png` });
const mobile = await p.evaluate(() => ({
  scrollW: document.scrollingElement.scrollWidth,
  vw: document.documentElement.clientWidth,
  eyebrow: (() => {
    const el = document.querySelector("main p.uppercase");
    return el ? { size: getComputedStyle(el).fontSize, text: el.innerText.slice(0, 20) } : null;
  })(),
}));
console.log("MOBILE:", JSON.stringify(mobile));
await b.close();
