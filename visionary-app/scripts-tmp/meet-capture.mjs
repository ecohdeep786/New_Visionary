import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
mkdirSync("scripts-tmp/landing-audit/final", { recursive: true });
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1800));
  // scroll to meet section, capture
  const { y } = await page.evaluate(() => {
    const el = document.querySelector("section[data-section='04-meet']");
    const r = el.getBoundingClientRect();
    window.scrollTo(0, r.top + window.scrollY - 60);
    return { y: r.top + window.scrollY };
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `scripts-tmp/landing-audit/final/${w}-meet-tabs.png`, fullPage: false });
  // click Teacher tab, capture swap
  await page.evaluate(() => { document.querySelector('[data-section="04-meet"] [role="tablist"]').children[1].click(); });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `scripts-tmp/landing-audit/final/${w}-meet-tabs-teacher.png`, fullPage: false });
  console.log(`captured ${w}`);
  await page.close();
}
await browser.close();
