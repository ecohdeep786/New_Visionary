import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForSelector('section[data-section="08-trust"]', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 4500));
await p.evaluate(() => document.querySelector('[data-section="08-trust"]').scrollIntoView({ behavior: "instant", block: "start" }));
await new Promise((r) => setTimeout(r, 900));
// walk to card 3 (Built with care / parent image) deterministically
for (let i = 0; i < 6; i++) {
  const counter = await p.evaluate(() => document.querySelector('[data-section="08-trust"] span.ml-2').textContent.trim());
  if (counter.startsWith("03")) break;
  await p.evaluate(() => document.querySelector('button[aria-label="Next trust card"]').click());
  await new Promise((r) => setTimeout(r, 900));
}
await new Promise((r) => setTimeout(r, 800));
await p.screenshot({ path: "scripts-tmp/shots/sweep-verify/trust-card3-bottomchip.png", captureBeyondViewport: false });
const counter = await p.evaluate(() => document.querySelector('[data-section="08-trust"] span.ml-2').textContent.trim());
console.log("final counter:", counter);
await browser.close();
