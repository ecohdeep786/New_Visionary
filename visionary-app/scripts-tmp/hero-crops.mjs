/* Detail crops of the landing hero for close inspection. */
import puppeteer from "puppeteer";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const browser = await puppeteer.launch({ headless: "new" });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 3 });
  await p.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2600));

  // the family at the fold — edges, shadows, floor blend
  await p.screenshot({ path: "scripts-tmp/shots/crop-family.png", clip: { x: 0, y: 560, width: 1440, height: 340 } });
  // copy block — headline gradient, sub, CTAs, audience row
  await p.screenshot({ path: "scripts-tmp/shots/crop-copy.png", clip: { x: 320, y: 180, width: 800, height: 400 } });

  // mobile family + fold
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await m.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2600));
  await m.screenshot({ path: "scripts-tmp/shots/crop-mobile-family.png", clip: { x: 0, y: 520, width: 390, height: 324 } });
  console.log("crops done");
} finally {
  await browser.close();
}
