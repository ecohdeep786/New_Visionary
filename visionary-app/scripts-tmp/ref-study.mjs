/* Reference responsive study: apple.com + workspace.google.com at 390/768/1440. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/ref-shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
  await page.setUserAgent(ua);

  for (const [name, url, stops] of [
    ["apple", "https://www.apple.com/", [[390, 844], [1440, 900]]],
    ["workspace", "https://workspace.google.com/", [[390, 844], [1440, 900]]],
  ]) {
    for (const [w, h] of stops) {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        await new Promise((r) => setTimeout(r, 6000));
        await page.screenshot({ path: `${OUT}/${name}-${w}-top.png` });
        /* scroll to mid + lower page for section rhythm */
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.6));
        await new Promise((r) => setTimeout(r, 2500));
        await page.screenshot({ path: `${OUT}/${name}-${w}-mid.png` });
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.8));
        await new Promise((r) => setTimeout(r, 2500));
        await page.screenshot({ path: `${OUT}/${name}-${w}-low.png` });
        console.log(`${name}-${w} done`);
      } catch (e) {
        console.log(`${name}-${w} FAIL: ${e.message.slice(0, 60)}`);
      }
    }
  }
} finally {
  await browser.close();
}
