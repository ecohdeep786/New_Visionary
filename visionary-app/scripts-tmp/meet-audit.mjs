/* Meet-section geometry audit: rendered position/space vs the approved
   Apple-rhythm law (text left 140px @1440, text→image gutter 144px,
   portrait centered in column, band→first block 80px, grid pt 56px). */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const OUT = "scripts-tmp/shots/meet-audit";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, dsf: 2 },
  { name: "laptop-1366", width: 1366, height: 768, dsf: 1 },
  { name: "lg-1024", width: 1024, height: 768, dsf: 1 },
  { name: "tablet-768", width: 768, height: 1024, dsf: 2, mobile: true },
  { name: "mobile-390", width: 390, height: 844, dsf: 3, mobile: true },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const vp of VIEWPORTS) {
    const p = await browser.newPage();
    await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForSelector('[data-section="04-meet"]', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4500));

    const geo = await p.evaluate(() => {
      const sec = document.querySelector('[data-section="04-meet"]');
      const S = sec.getBoundingClientRect();
      const q = (sel, root = sec) => root.querySelector(sel);
      const r = (el) => el.getBoundingClientRect();
      const kicker = q("p");
      const h2 = q("h2");
      const sub = [...sec.querySelectorAll("p")].find((el) => el.textContent.includes("continues your journey"));
      const band = q(".glass");
      const grid = q(".grid");
      const copyBlock = q(".max-w-\\[560px\\]");
      const figs = [...sec.querySelectorAll("figure")];
      const img0 = q("figure img");
      const fig0col = figs[0]?.parentElement;
      const row2 = figs[1]?.parentElement;
      const g = (x) => Math.round(x);
      const out = {
        kickerToH2: g(r(h2).top - r(kicker).bottom),
        h2ToSub: g(r(sub).top - r(h2).bottom),
        subToBand: g(r(band).top - r(sub).bottom),
        bandToGridTop: g(r(grid).top - r(band).bottom),
        gridPadTop: g(r(figs[0]).top - r(grid).top),
      };
      if (copyBlock && getComputedStyle(copyBlock.offsetParent || copyBlock).display !== "none" && r(copyBlock).width > 0) {
        const c = r(copyBlock);
        const i = r(img0);
        out.copyLeftFromViewport = g(c.left);
        out.gutterTextToImage = g(i.left - c.right);
        out.imgCenterOffsetInCol = g((i.left + i.right) / 2 - (r(fig0col).left + r(fig0col).right) / 2);
        out.copyPinTop = g(c.top);
      } else {
        out.copyColumn = "hidden (mobile anatomy)";
        const i = r(img0);
        out.imgLeftFromViewport = g(i.left);
        out.imgWidth = g(i.width);
      }
      if (row2) out.row1ToRow2 = g(r(row2).top - r(figs[0].parentElement).bottom);
      out.sectionPadTop = g(r(kicker).top - S.top);
      return out;
    });
    console.log(vp.name, JSON.stringify(geo));

    // section-top viewport shot
    await p.evaluate(() => document.querySelector('[data-section="04-meet"]').scrollIntoView({ block: "start" }));
    await new Promise((r) => setTimeout(r, 900));
    await p.screenshot({ path: `${OUT}/meet-top-${vp.name}.png` });
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("done");
