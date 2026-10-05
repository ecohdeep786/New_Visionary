/* Render landing hero screenshots at Apple-reference viewport sizes. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const OUT = "scripts-tmp/shots";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, dsf: 2 },
  { name: "laptop-1280", width: 1280, height: 800, dsf: 2 },
  { name: "mobile-390", width: 390, height: 844, dsf: 3, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, dsf: 2, mobile: true },
];

const PAGES = [
  { slug: "landing", url: `${BASE}/` },
  { slug: "org", url: `${BASE}/organization` },
  { slug: "student", url: `${BASE}/student` },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const page of PAGES) {
    for (const vp of VIEWPORTS) {
      const p = await browser.newPage();
      await p.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dsf,
        isMobile: !!vp.mobile,
        hasTouch: !!vp.mobile,
      });
      await p.goto(page.url, { waitUntil: "networkidle0", timeout: 60000 });
      // let entrance animations (figIn, 1.15s + stagger ~600ms) settle
      await new Promise((r) => setTimeout(r, 2600));
      await p.screenshot({ path: `${OUT}/${page.slug}-hero-${vp.name}.png` });
      // the glass glide-over state: scrolled past the hero's first cover
      if (vp.name === "desktop-1440" && page.slug === "landing") {
        await p.evaluate(() => window.scrollTo({ top: 700, behavior: "instant" }));
        await new Promise((r) => setTimeout(r, 1200));
        await p.screenshot({ path: `${OUT}/${page.slug}-scrolled-${vp.name}.png` });
      }
      await p.close();
      console.log(`shot ${page.slug} ${vp.name}`);
    }
  }
} finally {
  await browser.close();
}
console.log("done");
