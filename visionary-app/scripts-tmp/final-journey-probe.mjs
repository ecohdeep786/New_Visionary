import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
for (const [w, h, tag] of [[320, 700, "320"], [390, 844, "390"], [768, 1024, "768"], [1024, 768, "1024"], [1440, 900, "1440"], [1920, 1080, "1920"]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1800));
  const m = await page.evaluate(() => {
    const px = (n) => Math.round(n);
    const r = (el) => el ? el.getBoundingClientRect() : null;
    const cs = (el) => el ? getComputedStyle(el) : null;
    const j = document.querySelector('[data-section="06-journey"]');
    if (!j) return { err: "no journey" };
    const jr = r(j); const jc = cs(j);
    const h2 = j.querySelector("h2"); const sub = j.querySelector("p");
    const hr2 = r(h2); const hs = r(sub);
    const band = j.querySelector("div");
    const bcs = band ? cs(band) : null;
    const bw = band ? r(band) : null;
    return {
      sectionW: px(jr.width), sectionH: px(jr.height), bg: jc.backgroundColor,
      h2Fs: px(parseFloat(cs(h2).fontSize)), h2T: px(parseFloat(cs(h2).letterSpacing)*1000)/1000,
      h2Left: px(hr2.left), h2W: px(hr2.width), h2Center: px(hr2.left + hr2.width/2),
      subFs: px(parseFloat(cs(sub).fontSize)), subT: px(parseFloat(cs(sub).letterSpacing)*1000)/1000,
      subLeft: px(hs.left), subW: px(hs.width),
      bandMaxW: bcs ? px(parseFloat(bcs.maxWidth)) : null,
      bandCenter: bw ? px(bw.left + bw.width/2) : null,
      h2Top: px(hr2.top), subTop: px(hs.top), subGap: px(hs.top - hr2.bottom),
    };
  });
  console.log(`\n=== ${tag} (${w}px) ===`);
  console.log(JSON.stringify(m, null, 2));
  await page.close();
}
await browser.close();
