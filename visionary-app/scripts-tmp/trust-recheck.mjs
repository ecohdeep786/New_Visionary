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
// card edge vs viewport
const edge = await p.evaluate(() => {
  const card = document.querySelector('[data-section="08-trust"] .elevation-1');
  const r = card.getBoundingClientRect();
  const heading = document.querySelector('[data-section="08-trust"] h3').getBoundingClientRect();
  return { cardRight: Math.round(r.right), viewport: window.innerWidth, gap: Math.round(window.innerWidth - r.right), cardWidth: Math.round(r.width), headingLeft: Math.round(heading.left) };
});
console.log("EDGE:", JSON.stringify(edge));
await p.screenshot({ path: "scripts-tmp/shots/sweep-verify/trust-edge.png", captureBeyondViewport: false });
// walk all three cards deterministically: click next, wait for counter change
for (let n = 2; n <= 3; n++) {
  await p.evaluate(() => document.querySelector('button[aria-label="Next trust card"]').click());
  await new Promise((r) => setTimeout(r, 1200));
  const counter = await p.evaluate(() => document.querySelector('[data-section="08-trust"] span.ml-2').textContent.trim());
  await p.screenshot({ path: `scripts-tmp/shots/sweep-verify/trust-card-${n}.png`, captureBeyondViewport: false });
  console.log(`card shot: counter=${counter}`);
}
await browser.close();
