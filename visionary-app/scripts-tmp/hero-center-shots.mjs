/* Centered-copy hero verification: landing only, 5 viewports. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const OUT = "scripts-tmp/shots/hero-center";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "wide-1920", width: 1920, height: 1080, dsf: 1 },
  { name: "large-1536", width: 1536, height: 864, dsf: 1 },
  { name: "desktop-1440", width: 1440, height: 900, dsf: 2 },
  { name: "laptop-1280", width: 1280, height: 800, dsf: 2 },
  { name: "lg-1024", width: 1024, height: 768, dsf: 2 },
  { name: "tablet-768", width: 768, height: 1024, dsf: 2, mobile: true },
  { name: "mobile-390", width: 390, height: 844, dsf: 3, mobile: true },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const vp of VIEWPORTS) {
    const p = await browser.newPage();
    await p.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dsf,
      isMobile: !!vp.mobile,
      hasTouch: !!vp.mobile,
    });
    // this machine has reduce-motion ON at the OS level — force full animation
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForSelector('[data-section="01-hero"]', { timeout: 30000 });
    // let hydration + entrance animations (figIn 1.15s + stagger) settle
    await new Promise((r) => setTimeout(r, 5000));
    await p.screenshot({ path: `${OUT}/landing-hero-${vp.name}.png` });
    // geometry probe: is the copy block actually centered, and clear of the family?
    const geo = await p.evaluate(() => {
      const hero = document.querySelector('[data-section="01-hero"]');
      const copy = document.querySelector(".cast-copy");
      const h = hero.getBoundingClientRect();
      const c = copy.getBoundingClientRect();
      // in-flow reserve box (the family's floor) and painted family top
      const kids = [...hero.children].filter((el) => getComputedStyle(el).position !== "absolute" && el.tagName !== "STYLE");
      const spacer = kids[kids.length - 1];
      const s = spacer.getBoundingClientRect();
      let imgTop = Infinity;
      document.querySelectorAll(".cast-slot-0 img, .cast-slot-1 img, .cast-slot-2 img, .cast-slot-3 img, .cast-slot-4 img").forEach((img) => {
        const t = img.getBoundingClientRect().top;
        if (t < imgTop) imgTop = t;
      });
      const cta = copy.querySelector('a[href*="register"]');
      return {
        copyTop: Math.round(c.top - h.top),
        heroH: Math.round(h.height),
        spaceAbove: Math.round(c.top - h.top),
        gapCopyToHeads: Math.round(imgTop - c.bottom),
        spaceBalanced: Math.abs((c.top - h.top) - (s.top - c.bottom)) <= 2,
        spacerTopInHero: Math.round(s.top - h.top),
        spacerH: Math.round(s.height),
        linkCount: copy.querySelectorAll("a").length,
        ctaText: cta ? cta.textContent.trim() : null,
        hasSecondaryHowItWorks: !!copy.querySelector('a[href*="how-it-works"]'),
      };
    });
    console.log(vp.name, JSON.stringify(geo));
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("done");
