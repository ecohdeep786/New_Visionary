import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise((r) => setTimeout(r, 2000));
const result = await page.evaluate(() => {
  const panels = [...document.querySelectorAll('[data-section="04-meet"] [data-step]')];
  return panels.map((p, i) => {
    const cs = getComputedStyle(p);
    return {
      i, id: p.id, hasHiddenAttr: p.hasAttribute("hidden"),
      display: cs.display,
      height: Math.round(p.getBoundingClientRect().height),
      offsetHeight: p.offsetHeight,
      // computed style for the active vs hidden
    };
  });
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
