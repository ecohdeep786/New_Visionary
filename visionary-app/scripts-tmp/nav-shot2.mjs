import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: "scripts-tmp/nav-shots/10-rest-fresh.png", clip: { x: 0, y: 0, width: 1440, height: 120 } });
await page.evaluate(() => window.scrollTo(0, 600));
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: "scripts-tmp/nav-shots/11-frosted-fresh.png", clip: { x: 0, y: 0, width: 1440, height: 120 } });
await browser.close();
console.log("done");
