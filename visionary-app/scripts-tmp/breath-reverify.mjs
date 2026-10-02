/* Re-verify pricing + privacy after clearance fixes. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/curve-shots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5177";

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  for (const { file, path, kw } of [
    { file: "b-pricing-fixed.png", path: "/pricing", kw: "every journey has a plan" },
    { file: "b-privacy-fixed.png", path: "/privacy", kw: "essentials, at a glance" },
  ]) {
    await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 1700));
    await page.evaluate((kw) => {
      const el = [...document.querySelectorAll("h2")].find((x) => x.textContent.toLowerCase().includes(kw));
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top - 150 });
    }, kw);
    await new Promise((r) => setTimeout(r, 850));
    await page.screenshot({ path: `${OUT}/${file}` });
    console.log(file, "ok");
  }
} finally {
  await browser.close();
}
console.log("DONE");
