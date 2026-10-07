import puppeteer from "puppeteer";
const BASE = "http://localhost:5173";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 180000 });
await page.evaluate(() => new Promise((resolve) => {
  const t0 = Date.now();
  const tick = () => {
    if (document.querySelector('[data-section="01-hero"]') || Date.now() - t0 > 60000) resolve();
    else setTimeout(tick, 250);
  };
  tick();
}));
await new Promise((r) => setTimeout(r, 2000));
const result = await page.evaluate(async () => {
  const strip = document.querySelector('[data-section="04-meet"] [role="tablist"]');
  const btns = [...strip.querySelectorAll('[role="tab"]')];
  const click = async (i) => {
    btns[i].click();
    // wait until the strip's smooth scroll settles
    let prev = -1;
    for (let k = 0; k < 40; k++) {
      await new Promise((r) => setTimeout(r, 120));
      if (Math.abs(strip.scrollLeft - prev) < 0.5 && k > 4) break;
      prev = strip.scrollLeft;
    }
    const srect = strip.getBoundingClientRect();
    const brect = btns[i].getBoundingClientRect();
    return {
      chip: btns[i].innerText,
      scrollLeft: Math.round(strip.scrollLeft),
      fullyVisible: brect.left >= srect.left - 1 && brect.right <= srect.right + 1,
      centeredDelta: Math.round((brect.left + brect.width / 2) - (srect.left + srect.width / 2)),
    };
  };
  const out = [];
  for (const i of [0, 2, 4, 0]) out.push(await click(i));
  return out;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
