/* Audit the STUDENT 02-struggle section + LANDING 02-problem reference:
   capture viewport shots at 4 widths and measure the chapter's key metrics
   (breath, heading tier, media size, statement→media gap, quote position,
   one-viewport check). */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/shots/struggle-audit";
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || "http://localhost:5199";

const TARGETS = [
  { page: "student", section: '[data-section="02-struggle"]' },
  { page: "landing", section: '[data-section="02-problem"]' },
  { page: "teacher", section: '[data-section="02-struggle"]' },
  { page: "parent", section: '[data-section="02-struggle"]' },
  { page: "organization", section: '[data-section="02-struggle"]' },
];
const VPS = [
  { name: "1440", width: 1440, height: 900, dsf: 1 },
  { name: "1280", width: 1280, height: 800, dsf: 1 },
  { name: "768", width: 768, height: 1024, dsf: 1 },
  { name: "390", width: 390, height: 844, dsf: 1, mobile: true },
];

const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 180000 });
try {
  for (const t of TARGETS) {
    const url = t.page === "student" ? `${BASE}/student` : t.page === "landing" ? `${BASE}/` : `${BASE}/${t.page}`;
    const tVps = t.page === "student" || t.page === "landing" ? VPS : VPS.filter((v) => v.name === "1440");
    for (const vp of tVps) {
      const p = await browser.newPage();
      await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
      try {
        await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      } catch { /* continue with what loaded */ }
      await new Promise((r) => setTimeout(r, 4500));
      // settle-walk to the section (smooth scrolling + carousels fight single scrolls)
      const landed = await p.evaluate(async (sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        for (let i = 0; i < 8; i++) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
          await new Promise((r) => setTimeout(r, 250));
          if (Math.abs(el.getBoundingClientRect().top) <= 2) return true;
        }
        return Math.abs(el.getBoundingClientRect().top) <= 40;
      }, t.section);
      await p.evaluate(() => window.scrollBy({ top: -72, behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 1200));

      const metrics = await p.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const px = (v) => Math.round(parseFloat(v) * 10) / 10;
        const cs0 = getComputedStyle(el);
        const vw = document.documentElement.clientWidth;
        const vh = window.innerHeight;
        const r0 = el.getBoundingClientRect();
        const out = {
          section: { padTop: px(cs0.paddingTop), padBottom: px(cs0.paddingBottom), h: Math.round(r0.height) },
          vw, vh,
          parts: [],
        };
        const heads = [...el.querySelectorAll("h2,h3,p,figure,img,figcaption")].slice(0, 14);
        for (const el2 of heads) {
          const r = el2.getBoundingClientRect();
          const cs = getComputedStyle(el2);
          out.parts.push({
            tag: el2.tagName.toLowerCase(),
            text: (el2.textContent || "").trim().slice(0, 30),
            topInSection: Math.round(r.top - r0.top),
            h: Math.round(r.height),
            wPct: Math.round((r.width / vw) * 100),
            size: px(cs.fontSize), weight: cs.fontWeight, color: cs.color,
          });
        }
        // one-viewport check: bottom of figcaption/quote relative to viewport at this scroll
        const q = el.querySelector("figcaption");
        if (q) out.quoteBottomInVp = Math.round(q.getBoundingClientRect().bottom);
        return out;
      }, t.section);
      console.log(`\n===== ${t.page} @${vp.name} landed=${landed} =====`);
      console.log(JSON.stringify(metrics, null, 1));

      await p.screenshot({ path: `${OUT}/${t.page}-${vp.name}-vp.png`, captureBeyondViewport: false });
      const el = await p.$(t.section);
      if (el) await el.screenshot({ path: `${OUT}/${t.page}-${vp.name}-full.png` });
      await p.close();
    }
  }
} finally {
  await browser.close();
}
console.log("DONE");
