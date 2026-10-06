/* Full start-to-end landing walkthrough at 1440 + spot mobile checks:
   one viewport shot per chapter, animations ON. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const OUT = "scripts-tmp/shots/full-walk";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, dsf: 2 },
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
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForSelector('section[data-section="09-cta"]', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4500));

    const shot = async (name, y = null) => {
      if (y !== null) {
        await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
      }
      await new Promise((r) => setTimeout(r, 900));
      await p.screenshot({ path: `${OUT}/landing-${vp.name}-${name}.png`, captureBeyondViewport: false });
      console.log(`shot ${vp.name} ${name}`);
    };

    const top = async (sel) => p.evaluate((s) => {
      document.querySelector(s).scrollIntoView({ behavior: "instant", block: "start" });
    }, sel);

    if (vp.name === "desktop-1440") {
      await shot("01-hero", 0);
      await top('[data-section="02-problem"]');
      await shot("02-problem");
      await p.evaluate(() => {
        const s = document.querySelector('[data-section="03-promise"]');
        const r = s.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top + (r.height - window.innerHeight) * 0.5, behavior: "instant" });
      });
      await shot("03-promise");
      await top('[data-section="04-meet"]');
      await shot("04-meet-top");
      await p.evaluate(() => document.querySelector('[data-step="0"]').scrollIntoView({ behavior: "instant", block: "center" }));
      await shot("04-meet-panel1");
      await top('[data-section="07-language"]');
      await shot("07-language");
      await top('[data-section="06-journey"]');
      await shot("06-journey");
      // journey mid: active step 2 of the dark scene
      await p.evaluate(() => {
        const s = document.querySelector('[data-section="06-journey"]');
        window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().height * 0.45, behavior: "instant" });
      });
      await shot("06-journey-mid");
      await top('[data-section="08-trust"]');
      await shot("08-trust");
      await p.evaluate(() => {
        const s = document.querySelector('[data-section="08-trust"]');
        window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().height * 0.55, behavior: "instant" });
      });
      await shot("08-trust-cards");
      await top('[data-section="09-cta"]');
      await shot("09-cta");
      // footer
      await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await shot("10-footer");
    } else {
      await shot("01-hero", 0);
      await top('[data-section="02-problem"]');
      await shot("02-problem");
      await top('[data-section="04-meet"]');
      await shot("04-meet-top");
      await top('[data-section="07-language"]');
      await shot("07-language");
      await top('[data-section="06-journey"]');
      await shot("06-journey");
      await top('[data-section="08-trust"]');
      await shot("08-trust");
      await top('[data-section="09-cta"]');
      await shot("09-cta");
      await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await shot("10-footer");
    }
    await p.close();
  }
} finally {
  await browser.close();
}
