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

/* gentle walk to load + arm everything, then return to top and settle */
await p.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 700) {
    window.scrollTo({ top: y, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo({ top: 0, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 1300));

const goto = async (sel, offset = -40) => {
  await p.evaluate((s, o) => {
    const el = document.querySelector(s);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + o, behavior: "instant" });
  }, sel, offset);
  await new Promise((r) => setTimeout(r, 1200));
};

await goto('section[data-section="02-problem"]');
await p.screenshot({ path: `${OUT}/d-problem.png` });
console.log("shot problem");

const heights = await p.evaluate(() => {
  const q = (s) => document.querySelector(s)?.getBoundingClientRect();
  return { problemH: Math.round(q('section[data-section="02-problem"]').height) };
});
console.log("heights:", JSON.stringify(heights));

/* meet: land inside the section, then center each row */
await p.evaluate(() => {
  document.querySelector('section[data-section="04-meet"]')?.scrollIntoView({ behavior: "instant", block: "start" });
  window.scrollBy(0, -56);
});
await new Promise((r) => setTimeout(r, 1200));
await p.screenshot({ path: `${OUT}/d-meet-top.png` });
console.log("shot meet top");

await p.evaluate(() => {
  const rows = document.querySelectorAll('section[data-section="04-meet"] [data-step]');
  rows[2]?.scrollIntoView({ behavior: "instant", block: "center" });
});
await new Promise((r) => setTimeout(r, 1200));
await p.screenshot({ path: `${OUT}/d-meet-row3.png` });
const rowInfo = await p.evaluate(() => {
  const img = document.querySelectorAll('section[data-section="04-meet"] [data-step] img')[2];
  const r = img.getBoundingClientRect();
  const fade = document.querySelector('section[data-section="04-meet"] .transition-opacity');
  return { imgTop: Math.round(r.top), imgH: Math.round(r.height), complete: img.complete, gridOpacity: fade ? getComputedStyle(fade).opacity : "?" };
});
console.log("row3:", JSON.stringify(rowInfo));

await browser.close();
