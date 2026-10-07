/* Hero verification across the one-hero law: landing family stage + the five
   persona stages. Shots + overflow/aspect probes + reduced-motion pass. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/hero-shots";
mkdirSync(OUT, { recursive: true });
const BASE = process.env.HERO_BASE || "http://localhost:5176";

const PAGES = [
  ["landing", "/"],
  ["student", "/student"],
  ["teacher", "/teacher"],
  ["parent", "/parent"],
  ["pro", "/professional"],
  ["org", "/organization"],
];

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  for (const [name, path] of PAGES) {
    for (const [vw, vh, tag] of [[1440, 900, "1440"], [768, 1024, "768"], [390, 844, "390"]]) {
      await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1 });
      await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 2600));
      await page.screenshot({ path: `${OUT}/${name}-${tag}.png` });

      const probe = await page.evaluate(() => {
        const sec = document.querySelector('[data-section="01-hero"]');
        if (!sec) return { missing: true };
        const imgs = [...sec.querySelectorAll("img")].map((im) => {
          const b = im.getBoundingClientRect();
          return { nw: im.naturalWidth, cw: Math.round(b.width), ch: Math.round(b.height) };
        });
        const r = sec.getBoundingClientRect();
        const sq = imgs.every((i) => i.cw === 0 || Math.abs(i.cw - i.ch) <= 2 || i.nw > 900);
        return {
          sectionH: Math.round(r.height),
          overflowX: document.documentElement.scrollWidth > window.innerWidth,
          squareCanvases: sq,
          imgCount: imgs.length,
        };
      });
      console.log(`${name}-${tag}`, JSON.stringify(probe));
    }
  }
  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "NO JS ERRORS");

  // reduced motion: family fully visible, no motion
  const rm = await browser.newPage();
  await rm.setViewport({ width: 1440, height: 900 });
  await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await rm.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 1200));
  await rm.screenshot({ path: `${OUT}/landing-1440-rm.png` });
  const rmProbe = await rm.evaluate(() => {
    const slots = [...document.querySelectorAll('[data-section="01-hero"] .relative.flex.items-end > div')];
    return slots.map((s) => ({ op: getComputedStyle(s).opacity, anim: getComputedStyle(s).animationName }));
  });
  console.log("reduced-motion slots:", JSON.stringify(rmProbe));
} finally {
  await browser.close();
}
