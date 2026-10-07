import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new" });
for (const vp of [
  { name: "mobile-390", width: 390, height: 844, dsf: 3, mobile: true },
  { name: "desktop-1440", width: 1440, height: 900, dsf: 2 },
]) {
  const p = await browser.newPage();
  await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForSelector('section[data-section="08-trust"]', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4500));
  await p.evaluate(() => document.querySelector('[data-section="08-trust"]').scrollIntoView({ behavior: "instant", block: "start" }));
  await new Promise((r) => setTimeout(r, 1000));
  // desktop: walk to card 3 to check bottom-left chip
  if (vp.name === "desktop-1440") {
    for (let i = 0; i < 6; i++) {
      const counter = await p.evaluate(() => document.querySelector('[data-section="08-trust"] span.ml-2').textContent.trim());
      if (counter.startsWith("03")) break;
      await p.evaluate(() => document.querySelector('button[aria-label="Next trust card"]').click());
      await new Promise((r) => setTimeout(r, 900));
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  await p.screenshot({ path: `scripts-tmp/shots/sweep-verify/trust-final-${vp.name}.png`, captureBeyondViewport: false });
  console.log(`shot ${vp.name}`);
  await p.close();
}
await browser.close();
