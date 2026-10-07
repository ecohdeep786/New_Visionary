/* Screenshot the reverted landing OI section + the Student/Teacher/College
   intelligence sections at desktop and mobile widths. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5175";
const OUT = "scripts-tmp/shots/landing-matrix";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

const jobs = [
  { url: "/", sel: '[data-section="05-one-intelligence"]', tag: "oi-reverted", w: 1440, h: 900 },
  { url: "/", sel: '[data-section="05-one-intelligence"]', tag: "oi-reverted-320", w: 320, h: 800 },
  { url: "/student", sel: '[data-section="05-intelligence"]', tag: "student-intel", w: 1440, h: 900 },
  { url: "/teacher", sel: '[data-section="05-intelligence"]', tag: "teacher-intel", w: 1440, h: 900 },
  { url: "/professional", sel: '[data-section="05-intelligence"]', tag: "college-intel", w: 1440, h: 900 },
  { url: "/student", sel: '[data-section="05-intelligence"]', tag: "student-intel-390", w: 390, h: 844 },
];

for (const j of jobs) {
  const p = await browser.newPage();
  await p.setViewport({ width: j.w, height: j.h, deviceScaleFactor: 2 });
  await p.goto(BASE + j.url, { waitUntil: "networkidle2", timeout: 60000 });
  await p.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ behavior: "instant", block: "start" }), j.sel);
  await new Promise((r) => setTimeout(r, 1400));
  // overflow probe while at the section
  const overflow = await p.evaluate(() => document.scrollingElement.scrollWidth > document.documentElement.clientWidth);
  await p.screenshot({ path: `${OUT}/${j.tag}.png` });
  console.log(`${j.tag}: overflow=${overflow}`);
  await p.close();
}

await browser.close();
