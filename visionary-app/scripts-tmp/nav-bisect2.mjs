import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise(r => setTimeout(r, 1800));
// real wheel scroll
await page.mouse.move(720, 500);
await page.mouse.wheel({ deltaY: 600 });
await new Promise(r => setTimeout(r, 1000));
const y = await page.evaluate(() => window.scrollY);
console.log("scrollY:", y);
await page.screenshot({ path: "scripts-tmp/nav-shots/bisect-wheel.png", clip: { x: 0, y: 0, width: 1440, height: 70 } });
// full frame for context
await page.screenshot({ path: "scripts-tmp/nav-shots/bisect-wheel-full.png" });
await browser.close();
console.log("done");
