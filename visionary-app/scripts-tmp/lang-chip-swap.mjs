import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForSelector('[data-section="07-language"] button[aria-pressed]', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 4000));
await p.evaluate(() => {
  document.querySelector('[data-section="07-language"] p[aria-live]').scrollIntoView({ behavior: "instant", block: "center" });
});
const labels = await p.evaluate(() =>
  [...document.querySelectorAll('[data-section="07-language"] button[aria-pressed]')].map((b) => b.textContent.trim())
);
console.log("chips:", labels.join(", "));
for (const i of [1, 2]) {
  await p.evaluate((idx) => {
    document.querySelectorAll('[data-section="07-language"] button[aria-pressed]')[idx].click();
  }, i);
  await new Promise((r) => setTimeout(r, 600));
  const state = await p.evaluate(() => {
    const q = document.querySelector('[data-section="07-language"] p[aria-live]');
    return { lang: q.getAttribute("lang"), text: q.textContent.trim().slice(0, 40) };
  });
  console.log(`after click ${labels[i]}: lang=${state.lang} text="${state.text}"`);
  await p.screenshot({ path: `scripts-tmp/shots/lang-verify/chip-swap-${labels[i]}.png`, captureBeyondViewport: false });
}
await browser.close();
