/* Verify the language chapter rework: shots at top/stage/exit + computed
   rhythm metrics (kicker→h2 12px, h2→sub 16px, sentence-case chips,
   reserved question slot, bar size) at 1440 and 390. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const OUT = "scripts-tmp/shots/lang-verify";
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

    // computed rhythm metrics
    const m = await p.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const sec = q('[data-section="07-language"]');
      const kicker = sec.querySelector("p");
      const h2 = sec.querySelector("h2");
      const sub = h2.nextElementSibling;
      const chip = sec.querySelector('button[aria-pressed]');
      const question = sec.querySelector('p[aria-live]');
      const bar = sec.querySelector('span[aria-hidden] span, span[style*="FBBC04"]') || sec.querySelectorAll('span[style*="4285F4"]')[0];
      const cs = (el, prop) => parseFloat(getComputedStyle(el)[prop]);
      const kickerCS = getComputedStyle(kicker);
      return {
        kickerText: kicker.textContent.trim(),
        kickerTransform: kickerCS.textTransform,
        kickerFontSize: kickerCS.fontSize,
        kickerWeight: kickerCS.fontWeight,
        h2MarginTop: cs(h2, "marginTop"),
        subMarginTop: cs(sub, "marginTop"),
        subFontSize: getComputedStyle(sub).fontSize,
        chipText: chip.textContent.trim(),
        chipTransform: getComputedStyle(chip).textTransform,
        chipFontSize: getComputedStyle(chip).fontSize,
        questionMinHeight: cs(question, "minHeight"),
        questionFontSize: getComputedStyle(question).fontSize,
        barHeight: bar ? cs(bar, "height") : null,
        barWidth: bar ? cs(bar, "width") : null,
        hazeCount: sec.querySelectorAll("div.rounded-full.pointer-events-none").length,
        pillGone: !sec.textContent.includes("Speak your way"),
      };
    });
    console.log(`METRICS ${vp.name}:`, JSON.stringify(m, null, 2));

    const shot = async (name) => {
      await p.screenshot({ path: `${OUT}/landing-${vp.name}-${name}.png`, captureBeyondViewport: false });
      console.log(`shot ${vp.name} ${name}`);
    };

    // language top (join edge visible)
    await p.evaluate(() => {
      const s = document.querySelector('[data-section="07-language"]');
      const top = window.scrollY + s.getBoundingClientRect().top - 140;
      window.scrollTo({ top, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 1000));
    await shot("top");

    // the stage (bars + question + legend)
    await p.evaluate(() => {
      const q = document.querySelector('[data-section="07-language"] p[aria-live]');
      q.scrollIntoView({ behavior: "instant", block: "center" });
    });
    await new Promise((r) => setTimeout(r, 900));
    await shot("stage");

    // chapter exit → dark journey join
    await p.evaluate(() => {
      const s = document.querySelector('[data-section="07-language"]');
      window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().bottom + 120 - window.innerHeight, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 900));
    await shot("exit");

    // chip interaction: switch to English, confirm the question swaps
    await p.evaluate(() => {
      const q = document.querySelector('[data-section="07-language"] p[aria-live]');
      q.scrollIntoView({ behavior: "instant", block: "center" });
    });
    const chips = await p.$$('button[aria-pressed]');
    await chips[1].click(); // English
    await new Promise((r) => setTimeout(r, 700));
    const live = await p.evaluate(() => document.querySelector('[data-section="07-language"] p[aria-live]').getAttribute("lang"));
    console.log(`chip-swap ${vp.name}: aria-live lang now = ${live}`);
    await shot("stage-en");

    await p.close();
  }
} finally {
  await browser.close();
}
