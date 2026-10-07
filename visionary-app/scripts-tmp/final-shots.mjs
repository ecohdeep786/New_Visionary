import puppeteer from "puppeteer";
import { writeFileSync, mkdirSync } from "node:fs";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
const dir = "scripts-tmp/landing-audit/final";
mkdirSync(dir, { recursive: true });
const shots = [
  { w: 390, h: 844, tag: "390", y: 2436 }, // meet strip y — but we want the meet section
];
for (const [w, h, tag] of [[390, 844, "390"], [1440, 900, "1440"], [320, 700, "320"]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));
  // scroll to meet section
  const box = await page.evaluate(() => {
    const el = document.querySelector("section[data-section='04-meet']");
    const r = el.getBoundingClientRect();
    window.scrollTo(0, Math.max(0, r.top + window.scrollY - 80));
    return { y: r.top, h: Math.min(r.height, 820) };
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${dir}/${tag}-meet.png`, fullPage: false, clip: { x: 0, y: Math.max(0, box.y - 80), width: w, height: box.h } });
  console.log(`captured ${w} meet`);
  await page.close();
}
await browser.close();
console.log("done");
