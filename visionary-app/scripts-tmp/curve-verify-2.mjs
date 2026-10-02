/* Screenshot the completed pending-card sections (desktop + mobile). */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/curve-shots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5176";

const shots = [
  { file: "download-hero.png", path: "/download", kw: "on every device" },
  { file: "careers-hero.png", path: "/careers", kw: "", top: 0 },
  { file: "partners-band.png", path: "/partners", kw: "start with the support" },
  { file: "updates-featured.png", path: "/updates", kw: "one intelligence, every learner" },
  { file: "updates-research.png", path: "/updates", kw: "evidence over claims" },
  { file: "updates-mobile.png", path: "/updates", kw: "one intelligence, every learner", mobile: true },
  { file: "partners-mobile.png", path: "/partners", kw: "start with the support", mobile: true },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  for (const { file, path, kw, top = 150, mobile } of shots) {
    await page.setViewport({ width: mobile ? 390 : 1440, height: mobile ? 844 : 900 });
    await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 1800));
    const found = await page.evaluate(({ kw, top }) => {
      if (!kw) { window.scrollTo({ top }); return "top"; }
      const el = [...document.querySelectorAll("h1,h2")].find((x) => x.textContent.toLowerCase().includes(kw));
      if (!el) return false;
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top - top });
      return true;
    }, { kw, top });
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: `${OUT}/${file}` });
    console.log(file, found === false ? "NOT FOUND" : "ok");
  }
} finally {
  await browser.close();
}
console.log("DONE");
