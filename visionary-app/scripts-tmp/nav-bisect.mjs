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
await page.evaluate(() => window.scrollTo(0, 600));
await new Promise(r => setTimeout(r, 800));

// A: baseline scrolled
await page.screenshot({ path: "scripts-tmp/nav-shots/bisect-A.png", clip: { x: 0, y: 0, width: 1440, height: 70 } });

// B: kill backdrop-filter on all header layers
await page.evaluate(() => {
  document.querySelectorAll("header, header *").forEach(el => { el.style.backdropFilter = "none"; el.style.webkitBackdropFilter = "none"; });
});
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: "scripts-tmp/nav-shots/bisect-B.png", clip: { x: 0, y: 0, width: 1440, height: 70 } });

// C: also make the frosted layer transparent
await page.evaluate(() => {
  const header = document.querySelector("header");
  const layer = header.querySelector("div[aria-hidden='true']");
  if (layer) layer.style.backgroundColor = "transparent";
});
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: "scripts-tmp/nav-shots/bisect-C.png", clip: { x: 0, y: 0, width: 1440, height: 70 } });

await browser.close();
console.log("bisect done");
