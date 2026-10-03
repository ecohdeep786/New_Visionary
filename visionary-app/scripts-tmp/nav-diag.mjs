import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise(r => setTimeout(r, 1500));
const diag = await page.evaluate(() => {
  const header = document.querySelector("header");
  const logoLink = header?.querySelector('a[aria-label="Visionary home"]');
  const logoRect = logoLink?.getBoundingClientRect();
  const logoStyle = logoLink ? getComputedStyle(logoLink) : null;
  const svg = logoLink?.querySelector("svg");
  return {
    headerExists: !!header,
    headerCls: header?.className?.slice(0, 90),
    frameCls: header?.querySelector("div.relative, div[class*='public-frame']")?.className?.slice(0, 110),
    logoRect: logoRect ? { x: logoRect.x, y: logoRect.y, w: logoRect.width, h: logoRect.height } : null,
    logoVisibility: logoStyle?.visibility,
    logoOpacity: logoStyle?.opacity,
    logoColor: logoStyle?.color,
    svgExists: !!svg,
    svgSize: svg ? `${svg.getBoundingClientRect().width}x${svg.getBoundingClientRect().height}` : null,
    svgFill: svg ? getComputedStyle(svg).fill : null,
  };
});
console.log(JSON.stringify(diag, null, 2));
await browser.close();
