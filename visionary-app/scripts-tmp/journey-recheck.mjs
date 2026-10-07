/* Re-verify after the hairline fix: join shots at 1440/1280 + the journey
   control circles + full 1440 metrics (hydration-safe this time). */
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
  ]) {
    const p = await browser.newPage();
    await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf });
    try {
      await p.goto(`${BASE}/student`, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch { /* continue */ }
    await p.waitForSelector('[data-section="04-journey"]', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    const data = await p.evaluate(() => {
      const secs = [...document.querySelectorAll("main > section[data-section]")].map((s) => s.getAttribute("data-section"));
      const j = document.querySelector('[data-section="04-journey"]');
      const bt = getComputedStyle(j).borderTopColor;
      const h2 = j.querySelector("h2");
      const controls = [...j.querySelectorAll('button[aria-label$="stages"]')].map((b) => {
        const c = getComputedStyle(b);
        return { w: Math.round(b.getBoundingClientRect().width), bg: c.backgroundColor, disabled: b.disabled };
      });
      return { sections: secs, journeyBorderTop: bt, h2Size: getComputedStyle(h2).fontSize, controls };
    });
    console.log(`\n===== student @${vp.name} =====`);
    console.log(JSON.stringify(data));

    // join shot
    await p.evaluate(() => {
      const b = document.querySelector('[data-section="04-journey"]');
      window.scrollTo({ top: b.getBoundingClientRect().top + window.scrollY - 620, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 1200));
    await p.screenshot({ path: `${OUT}/join2-${vp.name}.png`, captureBeyondViewport: false });

    // controls: scroll the carousel track fully right so next/prev state shows, then shoot the control row
    await p.evaluate(async () => {
      const track = document.querySelector('[data-section="04-journey"] .snap-x');
      if (track) {
        for (let i = 0; i < 5; i++) { track.scrollBy({ left: 720, behavior: "instant" }); await new Promise((r) => setTimeout(r, 150)); }
      }
      const btn = document.querySelector('[data-section="04-journey"] button[aria-label="Next stages"]');
      const top = btn.getBoundingClientRect().top + window.scrollY - (window.innerHeight - 140);
      window.scrollTo({ top, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 900));
    await p.screenshot({ path: `${OUT}/controls-${vp.name}.png`, captureBeyondViewport: false });
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("\nDONE");
