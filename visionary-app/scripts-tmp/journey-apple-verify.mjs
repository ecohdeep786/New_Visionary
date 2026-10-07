import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const VIEWPORTS = [[320, 700], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const report = {};

for (const [w, h] of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0", timeout: 120000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 800)));

  const m = await page.evaluate((vw) => {
    const px = (n) => Math.round(n);
    const r = (el) => el ? el.getBoundingClientRect() : null;
    const cs = (el) => el ? getComputedStyle(el) : null;
    const num = (s) => { const n = parseFloat(s); return isNaN(n) ? null : n; };
    const j = document.querySelector('[data-section="06-journey"]');
    if (!j) return { err: "journey not found", viewport: vw };
    const h2 = j.querySelector("h2");
    const sub = j.querySelector("p");
    const hr2 = r(h2); const cr2 = cs(h2);
    const hs = r(sub); const csSub = cs(sub);
    const band = j.querySelector("div.mx-auto");
    const bcs = band ? cs(band) : null; const br = band ? r(band) : null;
    const fs2 = num(cr2.fontSize);
    return {
      viewport: vw,
      bg: cs(j).backgroundColor,
      h2: { fs: px(fs2), t_em: num(cr2.letterSpacing), leading: num(cr2.lineHeight)/fs2, tracking_px: px(num(cr2.letterSpacing)*fs2), left: px(hr2.left), w: px(hr2.width) },
      sub: { fs: px(num(csSub.fontSize)), t_em: num(csSub.letterSpacing), left: px(hs.left), w: px(hs.width), gapFromH2: px(hs.top - hr2.bottom) },
      bandMaxW: bcs ? num(bcs.maxWidth) : null,
      bandCenterMinusH2Center: band ? px((br.left + br.width/2) - (hr2.left + hr2.width/2)) : null,
      appleRef: { h2_fs: vw <= 768 ? 64 : 56, h2_t_em: -0.028, band_maxW: 980, bg: "rgb(245, 245, 247)" },
    };
  }, w);
  report[`w${w}`] = m;
  console.log(`=== ${w}px ===`);
  console.log(JSON.stringify(m, null, 2));
  await page.close();
}
writeFileSync("scripts-tmp/landing-audit/journey-verify.json", JSON.stringify(report, null, 2));
console.log("done");
await browser.close();
