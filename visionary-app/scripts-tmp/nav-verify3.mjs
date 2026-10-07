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
await page.screenshot({ path: "scripts-tmp/nav-shots/j1-rest.png" });

// worst case: frosted capsule over the blue language field
await page.evaluate(() => {
  document.querySelector('[data-section="07-language"]')?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -100);
});
await settle(1000);
await page.screenshot({ path: "scripts-tmp/nav-shots/j2-blue-zone.png" });

// flyout over scrolled page
await page.hover('button[aria-controls="mega-who"]').catch(() => {});
await settle(900);
await page.screenshot({ path: "scripts-tmp/nav-shots/j3-flyout.png" });

await browser.close();
console.log("done");
