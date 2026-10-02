/* Before-shots: landing hero vs category heroes (Apple NewPersona dialect). */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/hero-shots";
mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:5173";
const shots = [
  { file: "before-landing-1440.png", path: "/", w: 1440, h: 900 },
  { file: "before-student-1440.png", path: "/student", w: 1440, h: 900 },
  { file: "before-org-1440.png", path: "/organization", w: 1440, h: 900 },
  { file: "before-landing-390.png", path: "/", w: 390, h: 844 },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  for (const { file, path, w, h } of shots) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: `${OUT}/${file}` });
    console.log("shot", file);
  }
} finally {
  await browser.close();
}
