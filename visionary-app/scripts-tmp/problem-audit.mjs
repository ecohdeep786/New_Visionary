/* Audit the problem section (02) — scroll it into view and capture. */
import puppeteer from "puppeteer";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const vp of [
    { name: "desktop-1440", width: 1440, height: 900, dsf: 2 },
    { name: "mobile-390", width: 390, height: 844, dsf: 3, mobile: true },
  ]) {
    const p = await browser.newPage();
    await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    await p.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    await p.evaluate(() => document.querySelector('[data-section="02-problem"]').scrollIntoView({ block: "start" }));
    await new Promise((r) => setTimeout(r, 1200));
    await p.evaluate(() => window.scrollBy({ top: -60, behavior: "instant" }));
    await new Promise((r) => setTimeout(r, 600));
    await p.screenshot({ path: `scripts-tmp/shots/problem-after-${vp.name}.png`, captureBeyondViewport: false, fullPage: false });
    // full-section capture (may be taller than viewport)
    const el = await p.$('[data-section="02-problem"]');
    await el.screenshot({ path: `scripts-tmp/shots/problem-after-full-${vp.name}.png` });
    await p.close();
    console.log(`problem before ${vp.name}`);
  }
} finally {
  await browser.close();
}
console.log("done");
