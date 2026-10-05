/* Measure hero layout geometry + retake crops with explicit scroll reset. */
import puppeteer from "puppeteer";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const browser = await puppeteer.launch({ headless: "new" });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2600));
  await p.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 300));

  const geo = await p.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top + scrollY), height: Math.round(r.height), width: Math.round(r.width) };
    };
    return {
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      hero: box('[data-section="01-hero"]'),
      heroH1: box('[data-section="01-hero"] h1'),
      castImgs: [...document.querySelectorAll('[data-section="01-hero"] .cast-slot-0 img, [data-section="01-hero"] img[loading="eager"]')].slice(0, 6).map((el) => {
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width), src: el.currentSrc?.split("/").pop() };
      }),
      glass: box('main > div[aria-hidden="true"].glass'),
      problem: box('[data-section="02-problem"]'),
    };
  });
  console.log(JSON.stringify(geo, null, 2));

  await p.screenshot({ path: "scripts-tmp/shots/crop-family.png", clip: { x: 0, y: 560, width: 1440, height: 340 } });
  console.log("family crop retaken");
} finally {
  await browser.close();
}
