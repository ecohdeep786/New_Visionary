import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
mkdirSync("scripts-tmp/landing-audit/final", { recursive: true });
for (const [w, h, tag] of [[390, 844, "390"], [1440, 900, "1440"]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.evaluate(async () => { const H=document.documentElement.scrollHeight; for(let y=0;y<H;y+=1000){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))} window.scrollTo(0,0); });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `scripts-tmp/landing-audit/final/${tag}-full.png`, fullPage: true });
  console.log(`captured ${tag} full`);
  const coords = await page.evaluate(() => {
    const el = document.querySelector("section[data-section='04-meet']");
    const r = el.getBoundingClientRect();
    return { y: r.top, scrollY: window.scrollY || window.pageYOffset, w: r.width };
  });
  const absY = coords.y + coords.scrollY - 60;
  await page.evaluate((y) => window.scrollTo(0, y), absY);
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `scripts-tmp/landing-audit/final/${tag}-meet-student.png`, fullPage: false, clip: { x:0, y: Math.max(0, absY - 20), width: w, height: Math.min(h, 820) } });
  await page.evaluate(() => document.querySelector('[data-section="04-meet"] [role="tablist"]').children[1].click());
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `scripts-tmp/landing-audit/final/${tag}-meet-teacher.png`, fullPage: false, clip: { x:0, y: Math.max(0, absY - 20), width: w, height: Math.min(h, 820) } });
  console.log(`captured ${tag} meet states`);
  await page.close();
}
await browser.close();
console.log("done");
