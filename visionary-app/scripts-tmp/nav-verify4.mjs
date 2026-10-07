import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const settle = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await settle(1800);
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
console.log("body bg at rest:", bodyBg);
await page.screenshot({ path: "scripts-tmp/nav-shots/m1-rest.png" });

// scrolled: straight glass bar, no corners
await page.mouse.move(720, 500);
await page.mouse.wheel({ deltaY: 600 });
await settle(900);
await page.screenshot({ path: "scripts-tmp/nav-shots/m2-scrolled.png" });

// flyout
await page.hover('button[aria-controls="mega-who"]').catch(() => {});
await settle(900);
await page.screenshot({ path: "scripts-tmp/nav-shots/m3-flyout.png" });

// mobile drawer
await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await settle(1600);
await page.tap('button[aria-label="Open menu"]').catch(() => {});
await settle(800);
await page.screenshot({ path: "scripts-tmp/nav-shots/m4-mobile-drawer.png" });

await browser.close();
console.log("done");
