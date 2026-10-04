import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "scripts-tmp/shots/landing-compact";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });

/* measure the two sections */
const m = await p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const prob = q('section[data-section="02-problem"]')?.getBoundingClientRect();
  const meet = q('section[data-section="04-meet"]')?.getBoundingClientRect();
  return { problemH: Math.round(prob.height), meetH: Math.round(meet.height) };
});
console.log("heights:", JSON.stringify(m));

/* problem settled shot */
await p.evaluate(() => {
  const el = document.querySelector('section[data-section="02-problem"]');
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 950));
await p.screenshot({ path: `${OUT}/d-problem.png` });
console.log("shot problem");

/* meet row shots */
await p.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 800) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 70)); }
});
await p.evaluate(() => {
  const rows = document.querySelectorAll('section[data-section="04-meet"] [data-step]');
  rows[0]?.scrollIntoView({ behavior: "instant", block: "center" });
});
await new Promise((r) => setTimeout(r, 1100));
await p.screenshot({ path: `${OUT}/d-meet-row1.png` });
console.log("shot meet row1");
await p.evaluate(() => {
  const rows = document.querySelectorAll('section[data-section="04-meet"] [data-step]');
  rows[3]?.scrollIntoView({ behavior: "instant", block: "center" });
});
await new Promise((r) => setTimeout(r, 1100));
await p.screenshot({ path: `${OUT}/d-meet-row4.png` });
console.log("shot meet row4");

const overflow = await p.evaluate(() => document.scrollingElement.scrollWidth > document.documentElement.clientWidth);
console.log("overflow:", overflow);
await browser.close();
