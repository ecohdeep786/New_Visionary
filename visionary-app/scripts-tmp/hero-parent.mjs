/* Control shots: /parent and /teacher category heroes at 1440 (the approved reference dialect). */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/hero-shots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5173";

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  for (const [file, path, waitWord] of [
    ["ref-parent-1440.png", "/parent", "Parenting."],
    ["ref-teacher-1440.png", "/teacher", "Teaching."],
  ]) {
    await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
    await page.waitForFunction(
      (w) => { const s = document.querySelector('[data-section="01-hero"] h1 span[aria-hidden="true"]'); return s && s.textContent.trim() === w; },
      { timeout: 20000 }, waitWord
    ).catch(() => console.log(`WARN: ${waitWord} not seen on ${path}`));
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: `${OUT}/${file}` });
    console.log("shot", file);
  }
} finally {
  await browser.close();
}
