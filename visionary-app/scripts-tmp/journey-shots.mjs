import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
for (const [w, h, tag] of [[390, 844, "390"], [1440, 900, "1440"]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 2500));
  const coords = await page.evaluate(() => {
    const j = document.querySelector("[data-section='06-journey']");
    const r = j.getBoundingClientRect();
    return { y: r.top + window.scrollY, h: r.height };
  });
  await page.evaluate((y) => window.scrollTo(0, y), coords.y - 120);
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: `scripts-tmp/landing-audit/final/${tag}-journey.png`, fullPage: false, clip: { x: 0, y: 0, width: w, height: Math.min(h, 1100) } });
  console.log(`captured ${tag} journey`);
  await page.close();
}
await browser.close();
