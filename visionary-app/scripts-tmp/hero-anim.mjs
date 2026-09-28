/* Verify the Apple entrance animation: early-frame capture + computed animation probe. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/hero-shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded2" in page ? "domcontentloaded" : "domcontentloaded", timeout: 45000 });

  /* early frame — mid-entrance */
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: `${OUT}/anim-early.png` });

  /* settled frame */
  await new Promise((r) => setTimeout(r, 2400));
  await page.screenshot({ path: `${OUT}/anim-settled.png` });

  const probe = (label) =>
    page.evaluate((lbl) => {
      const wrap = document.querySelector('[data-section="01-hero"]');
      const portrait = wrap.querySelector("img").parentElement.parentElement;
      const title = wrap.querySelector("h1 span");
      const row = wrap.querySelector(".apple-float");
      const cs = (el) => {
        const s = getComputedStyle(el);
        return { name: s.animationName, dur: s.animationDuration, delay: s.animationDelay, iter: s.animationIterationCount };
      };
      return {
        mode: lbl,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        portrait: cs(portrait),
        title: cs(title),
        floatRow: row ? cs(row) : null,
        titleFontPx: getComputedStyle(title).fontSize,
      };
    }, label);

  console.log(JSON.stringify(await probe("normal"), null, 1));

  /* now the user's environment: OS reports reduce */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: `${OUT}/anim-reduce-mid.png` });
  console.log(JSON.stringify(await probe("reduce"), null, 1));
} finally {
  await browser.close();
}
