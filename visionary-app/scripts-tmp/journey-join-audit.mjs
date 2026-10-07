/* Verify the student page flow after the promise removal:
   1. sections in order (no 03-promise), struggle → journey join distance
   2. journey chapter shots (1440/1280/768/390) + the controls (circles)
   3. the h2 reserve (mobile line-count stability proxy: box height) */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/shots/journey-join";
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || "http://localhost:5199";

const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 120000 });
try {
  for (const vp of [
    { name: "1440", width: 1440, height: 900, dsf: 1 },
    { name: "1280", width: 1280, height: 800, dsf: 1 },
    { name: "768", width: 768, height: 1024, dsf: 1 },
    { name: "390", width: 390, height: 844, dsf: 1, mobile: true },
  ]) {
    const p = await browser.newPage();
    await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    const errors = [];
    p.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
    try {
      await p.goto(`${BASE}/student`, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch { /* continue */ }
    await new Promise((r) => setTimeout(r, 4500));
    const data = await p.evaluate(() => {
      const secs = [...document.querySelectorAll("main > section[data-section]")].map((s) => s.getAttribute("data-section"));
      const gapToJourney = (() => {
        const a = document.querySelector('[data-section="02-struggle"]');
        const b = document.querySelector('[data-section="04-journey"]');
        if (!a || !b) return null;
        return Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom);
      })();
      const h2 = document.querySelector('[data-section="04-journey"] h2');
      const cs = h2 ? getComputedStyle(h2) : null;
      const controls = [...document.querySelectorAll('[data-section="04-journey"] button[aria-label$="stages"]')].map((b) => {
        const r = b.getBoundingClientRect();
        const c = getComputedStyle(b);
        return { w: Math.round(r.width), h: Math.round(r.height), radius: c.borderRadius, bg: c.backgroundColor, disabled: b.disabled };
      });
      return {
        sections: secs,
        gapStruggleToJourney: gapToJourney,
        journeyH2: h2 ? { h: Math.round(h2.getBoundingClientRect().height), size: cs.fontSize, minH: cs.minHeight } : null,
        controls,
      };
    });
    console.log(`\n===== student @${vp.name} =====`);
    console.log(JSON.stringify(data));

    // journey chapter shot
    await p.evaluate(async () => {
      const el = document.querySelector('[data-section="04-journey"]');
      for (let i = 0; i < 8; i++) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        await new Promise((r) => setTimeout(r, 220));
        if (Math.abs(el.getBoundingClientRect().top) <= 2) break;
      }
      window.scrollBy({ top: -64, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 1400));
    await p.screenshot({ path: `${OUT}/journey-${vp.name}-vp.png`, captureBeyondViewport: false });
    // the join: scroll so struggle dots + journey header share the viewport
    await p.evaluate(() => {
      const b = document.querySelector('[data-section="04-journey"]');
      window.scrollTo({ top: b.getBoundingClientRect().top + window.scrollY - 620, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 1200));
    await p.screenshot({ path: `${OUT}/join-${vp.name}.png`, captureBeyondViewport: false });
    if (errors.length) console.log("PAGEERRORS:", JSON.stringify(errors));
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("\nDONE");
