import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise(r => setTimeout(r, 1800));
// scroll into the blue language section — worst case for the frost
await page.evaluate(() => {
  document.querySelector('[data-section="07-language"]')?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -100);
});
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: "scripts-tmp/nav-shots/i1-blue-zone.png", clip: { x: 0, y: 0, width: 1440, height: 90 } });
// sample the capsule's rendered pixel color
const rgb = await page.evaluate(() => {
  const c = document.createElement("canvas");
  return null;
});
await browser.close();
console.log("probe done");
