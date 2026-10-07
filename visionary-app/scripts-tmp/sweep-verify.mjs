/* Verify the trust rework + kicker normalization: render trust (all 3 cards),
   the normalized chapter headers, and the footer; probe computed metrics. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5199";
const OUT = "scripts-tmp/shots/sweep-verify";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: "new" });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForSelector('section[data-section="09-cta"]', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4500));

  const shot = async (name) => {
    await p.screenshot({ path: `${OUT}/landing-1440-${name}.png`, captureBeyondViewport: false });
    console.log(`shot ${name}`);
  };
  const kickerMetrics = () => p.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      const cs = getComputedStyle(el);
      return { text: el.textContent.trim(), size: cs.fontSize, weight: cs.fontWeight, transform: cs.textTransform, mtNext: getComputedStyle(el.nextElementSibling).marginTop };
    };
    return {
      problem: read('[data-section="02-problem"] p'),
      journey: read('[data-section="06-journey"] p'),
      trust: read('[data-section="08-trust"] p'),
      cta: read('[data-section="09-cta"] p'),
      footerHeading: (() => {
        const h = document.querySelector("footer h4");
        const cs = getComputedStyle(h);
        return { text: h.textContent.trim(), size: cs.fontSize, transform: cs.textTransform };
      })(),
    };
  });

  // trust chapter — header + card 1
  await p.evaluate(() => document.querySelector('[data-section="08-trust"]').scrollIntoView({ behavior: "instant", block: "start" }));
  await new Promise((r) => setTimeout(r, 1000));
  await shot("08-trust-card1");
  console.log("KICKERS:", JSON.stringify(await kickerMetrics(), null, 2));

  // card 2, card 3 via next arrow
  for (const n of [2, 3]) {
    await p.evaluate(() => document.querySelector('button[aria-label="Next trust card"]').click());
    await new Promise((r) => setTimeout(r, 1400));
    await shot(`08-trust-card${n}`);
  }

  // trust header sub widow check (element rect vs text)
  const subLines = await p.evaluate(() => {
    const el = document.querySelector('[data-section="08-trust"] p[style]');
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight);
    return { height: Math.round(r.height), lines: Math.round(r.height / lh) };
  });
  console.log("TRUST SUB lines:", JSON.stringify(subLines));

  // journey + cta headers
  await p.evaluate(() => document.querySelector('[data-section="06-journey"]').scrollIntoView({ behavior: "instant", block: "start" }));
  await new Promise((r) => setTimeout(r, 900));
  await shot("06-journey-header");
  await p.evaluate(() => document.querySelector('[data-section="09-cta"]').scrollIntoView({ behavior: "instant", block: "start" }));
  await new Promise((r) => setTimeout(r, 900));
  await shot("09-cta-header");

  // footer
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await new Promise((r) => setTimeout(r, 900));
  await shot("10-footer");

  await p.close();
} finally {
  await browser.close();
}
