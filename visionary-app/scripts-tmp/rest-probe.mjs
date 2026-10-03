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
// sample pixels in the top strip (nav zone) at rest
const colors = await page.evaluate(() => {
  const out = [];
  // what's the body bg?
  out.push({ what: "body computed bg", v: getComputedStyle(document.body).backgroundColor });
  return out;
});
console.log(JSON.stringify(colors));
await page.screenshot({ path: "scripts-tmp/nav-shots/k1-rest-top.png", clip: { x: 0, y: 0, width: 1440, height: 70 } });
await browser.close();
