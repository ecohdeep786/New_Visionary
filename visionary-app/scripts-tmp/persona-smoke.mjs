/* Smoke check: persona pages still render cleanly after the bridge rhythm
   change (shared --public-section-py + narrow-screen rule).
   Run: node scripts-tmp/persona-smoke.mjs */
import puppeteer from "puppeteer";
const BASE = "http://localhost:5173";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
const PAGES = ["/student", "/teacher", "/parent", "/professional", "/organization", "/how-it-works"];
for (const [w, h] of [[390, 844], [1440, 900]]) {
  for (const path of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 180000 });
      await page.evaluate(() => new Promise((resolve) => {
        const t0 = Date.now();
        const tick = () => {
          if (document.querySelector('[data-section="01-hero"]') || Date.now() - t0 > 60000) resolve();
          else setTimeout(tick, 250);
        };
        tick();
      }));
      const m = await page.evaluate(() => {
        const sec = document.querySelector('[data-section="02-struggle"]');
        const prom = document.querySelector('[data-section="03-promise"]');
        const cs = sec ? getComputedStyle(sec) : null;
        const pcs = prom ? getComputedStyle(prom) : null;
        return {
          hero: !!document.querySelector('[data-section="01-hero"]'),
          secs: document.querySelectorAll("main section").length,
          pad: cs ? `${cs.paddingTop}/${cs.paddingBottom}` : null,
          promisePad: pcs ? `${pcs.paddingTop}/${pcs.paddingBottom}` : null,
          scrollH: document.documentElement.scrollHeight,
        };
      });
      console.log(`${w}px ${path}: hero:${m.hero} secs:${m.secs} strugglePad:${m.pad} promisePad:${m.promisePad} scrollH:${m.scrollH} errors:${errors.length}`);
    } catch (e) {
      console.log(`${w}px ${path}: FAILED ${String(e).slice(0, 120)}`);
    }
    await page.close();
  }
}
await browser.close();
