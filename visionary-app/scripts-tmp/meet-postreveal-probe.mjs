/* Meet-section post-reveal geometry at 1440 (scroll-first so reveals settle). */
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: "new" });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForSelector('[data-section="04-meet"]', { timeout: 30000 });
  await p.evaluate(() => document.querySelector('[data-section="04-meet"]').scrollIntoView({ block: "start" }));
  await new Promise((r) => setTimeout(r, 2500));
  const geo = await p.evaluate(() => {
    const sec = document.querySelector('[data-section="04-meet"]');
    const r = (el) => el.getBoundingClientRect();
    const q = (sel) => sec.querySelector(sel);
    const kicker = q("p");
    const h2 = q("h2");
    const sub = [...sec.querySelectorAll("p")].find((el) => el.textContent.includes("continues your journey"));
    const band = q(".glass");
    const fig0 = q("figure");
    const img0 = q("figure img");
    const copy = sec.querySelector('[class*="max-w-[560px]"]');
    const g = (x) => Math.round(x);
    const out = {
      kickerToH2: g(r(h2).top - r(kicker).bottom),
      h2ToSub: g(r(sub).top - r(h2).bottom),
      subToBand: g(r(band).top - r(sub).bottom),
      bandToFigure: g(r(fig0).top - r(band).bottom),
      copyLeft: copy ? g(r(copy).left) : null,
      gutterTextToImage: copy ? g(r(img0).left - r(copy).right) : null,
      copyTopVsImgTop: copy ? g(r(copy).top - r(img0).top) : null,
      bandPinnedTop: g(r(band).top),
      kickerOpacity: getComputedStyle(kicker).opacity,
      kickerTransform: getComputedStyle(kicker).transform,
    };
    return out;
  });
  console.log(JSON.stringify(geo, null, 1));
  await browser.close();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
