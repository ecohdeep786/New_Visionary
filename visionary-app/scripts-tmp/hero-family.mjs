/* Family-lineup hero verification: shots + overflow/aspect probes. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/hero-shots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5173";

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  for (const [file, w, h] of [
    ["family-2000.png", 2000, 1050],
    ["family-1440.png", 1440, 900],
    ["family-1366.png", 1366, 768],
    ["family-768.png", 768, 1024],
    ["family-390.png", 390, 844],
  ]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2600));
    await page.screenshot({ path: `${OUT}/${file}` });

    const probe = await page.evaluate(() => {
      const sec = document.querySelector('[data-section="01-hero"]');
      const imgs = [...sec.querySelectorAll("img")].map((im) => ({
        nw: im.naturalWidth, nh: im.naturalHeight, cw: im.clientWidth, ch: im.clientHeight,
      }));
      const h1 = sec.querySelector("h1");
      const r = sec.getBoundingClientRect();
      return {
        h1Font: getComputedStyle(h1).fontSize,
        sectionH: Math.round(r.height),
        viewportH: window.innerHeight,
        docScrollW: document.documentElement.scrollWidth,
        viewportW: window.innerWidth,
        imgs,
      };
    });
    console.log(file, JSON.stringify(probe));
  }
  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "NO JS ERRORS");
} finally {
  await browser.close();
}
