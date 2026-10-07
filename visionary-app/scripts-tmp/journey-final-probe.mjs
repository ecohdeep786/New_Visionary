import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
for (const [w, h, tag] of [[320, 700, "320"], [390, 844, "390"], [768, 1024, "768"], [1440, 900, "1440"], [1920, 1080, "1920"]]) {
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
    const hdr = j.querySelector("h2");
    const cards = [...j.querySelectorAll("figure")];
    const imgs = [...j.querySelectorAll("figure img")];
    const caps = [...j.querySelectorAll("figcaption")];
    return {
      sectionPad: { pt: px(parseFloat(cs(j).paddingTop)), pb: px(parseFloat(cs(j).paddingBottom)) },
      hdrLeft: hdr ? px(r(hdr).left) : null, hdrFs: hdr ? px(parseFloat(cs(hdr).fontSize)) : null, hdrTrack: hdr ? px(parseFloat(cs(hdr).letterSpacing)*1000)/1000 : null, hdrW: hdr ? px(r(hdr).width) : null,
      cards: cards.map((c, i) => {
        const cr = r(c); const im = imgs[i]; const ic = r(im); const cap = caps[i];
        const capR = cap ? r(cap) : null;
        return {
          w: px(cr.width), h: px(cr.height), radius: cs(c).borderRadius,
          imgW: px(ic.width), imgH: px(ic.height),
          capOnMedia: cap ? (capR ? px(capR.top - cr.top) : null) : null,
          capLeft: capR ? px(capR.left - cr.left) : null,
          capText: cap ? cap.querySelector("p")?.textContent?.slice(0,16) : null,
          capFs: cap ? px(parseFloat(cs(cap.querySelector("p")).fontSize)) : null,
        };
      }),
    };
  });
  console.log(`\n=== ${tag} (${w}px) ===`);
  console.log(JSON.stringify(m, null, 2));
  await page.close();
}
await browser.close();
