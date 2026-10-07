import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0");
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
const measureHeadlines = async (url, label) => {
  await page.goto(url, { waitUntil: "networkidle0", timeout: 180000 });
  await new Promise((r) => setTimeout(r, 2000));
  const m = await page.evaluate(() => {
    const px = (n) => Math.round(n);
    const r = (el) => el ? el.getBoundingClientRect() : null;
    const cs = (el) => el ? getComputedStyle(el) : null;
    // grab ALL headlines >= 32px (the premium chapter tier) with their context
    const hdrs = [...document.querySelectorAll("h1,h2,h3")].filter((h) => {
      const fs = parseFloat(cs(h).fontSize);
      return fs >= 30 && fs <= 80;
    });
    return hdrs.slice(0, 24).map((h) => {
      const cr = r(h); const c = cs(h);
      return {
        text: h.textContent.trim().slice(0,70),
        fs: px(parseFloat(c.fontSize)), t: px(parseFloat(c.letterSpacing)*1000)/1000,
        l: px(parseFloat(c.lineHeight)), w: px(cr.width), centered: c.textAlign, left: px(cr.left), top: px(cr.top),
      };
    });
  });
  return { label, headlines: m };
};
for (const [name, url] of [["vision-pro","https://www.apple.com/apple-vision-pro/"], ["mb-pro","https://www.apple.com/macbook-pro-14-and-16/"], ["edu","https://www.apple.com/in/education-initiative/"]]) {
  console.log(JSON.stringify(await measureHeadlines(url, name), null, 2));
}
await browser.close();
