/* Render landing hero→meet→language for the premium audit: viewport shots at
   chapter anchors, desktop + mobile, animations ON (no-preference emulated —
   this OS has reduce ON by default). */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const OUT = "scripts-tmp/shots/lang-audit";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, dsf: 2 },
  { name: "mobile-390", width: 390, height: 844, dsf: 3, mobile: true },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const vp of VIEWPORTS) {
    const p = await browser.newPage();
    await p.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dsf,
      isMobile: !!vp.mobile,
      hasTouch: !!vp.mobile,
    });
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForSelector('section[data-section="07-language"]', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4500));

    const shot = async (name) => {
      await p.screenshot({ path: `${OUT}/landing-${vp.name}-${name}.png`, captureBeyondViewport: false });
      console.log(`shot ${vp.name} ${name}`);
    };

    // 01 hero at the fold
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await new Promise((r) => setTimeout(r, 800));
    await shot("01-hero");

    // 02 problem
    await p.evaluate(() => {
      document.querySelector('[data-section="02-problem"]').scrollIntoView({ behavior: "instant", block: "start" });
    });
    await new Promise((r) => setTimeout(r, 900));
    await shot("02-problem");

    // 03 promise mid-pin
    await p.evaluate(() => {
      const s = document.querySelector('[data-section="03-promise"]');
      const r = s.getBoundingClientRect();
      const top = window.scrollY + r.top + (r.height - window.innerHeight) * 0.5;
      window.scrollTo({ top, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 900));
    await shot("03-promise");

    // 04 meet — header + tab band
    await p.evaluate(() => {
      document.querySelector('[data-section="04-meet"]').scrollIntoView({ behavior: "instant", block: "start" });
    });
    await new Promise((r) => setTimeout(r, 900));
    await shot("04-meet-top");

    // 04 meet — first audience panel
    await p.evaluate(() => {
      document.querySelector('[data-step="0"]').scrollIntoView({ behavior: "instant", block: "center" });
    });
    await new Promise((r) => setTimeout(r, 900));
    await shot("04-meet-panel1");

    // 07 language — current state
    await p.evaluate(() => {
      document.querySelector('[data-section="07-language"]').scrollIntoView({ behavior: "instant", block: "start" });
    });
    await new Promise((r) => setTimeout(r, 1200));
    await shot("07-language-top");
    await p.evaluate(() => {
      const s = document.querySelector('[data-section="07-language"]');
      window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().height, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 900));
    await shot("07-language-exit");

    await p.close();
  }
} finally {
  await browser.close();
}
