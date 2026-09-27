import { chromium } from "playwright-core";
import fs from "node:fs";

const out = "scripts-tmp/careers-shots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:4173/careers", { waitUntil: "networkidle" });

// scroll through the page to trigger IntersectionObserver reveals
await page.evaluate(async () => {
  const h = document.body.scrollHeight;
  for (let y = 0; y <= h; y += 600) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1200);

await page.screenshot({ path: `${out}/careers-full.png`, fullPage: true });
const height = await page.evaluate(() => document.body.scrollHeight);
console.log("page height:", height);

// mobile
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto("http://localhost:4173/careers", { waitUntil: "networkidle" });
await mob.evaluate(async () => {
  const h = document.body.scrollHeight;
  for (let y = 0; y <= h; y += 500) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 80));
  }
  window.scrollTo(0, 0);
});
await mob.waitForTimeout(1000);
await mob.screenshot({ path: `${out}/careers-mobile.png`, fullPage: true });

await browser.close();
console.log("done");
