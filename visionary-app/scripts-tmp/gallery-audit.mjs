/* Verify the rebuilt journey gallery:
   1. section shots at 4 widths (cards, in-card text, controls)
   2. autoplay: dot advances after ~5.5s; pause button stops it
   3. modal open: kicker, black primary pill, blocks
   4. teacher page sanity (shared component) */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/shots/gallery-audit";
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || "http://localhost:5199";

const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 120000 });
try {
  for (const vp of [
    { name: "1440", width: 1440, height: 900, dsf: 1 },
    { name: "1280", width: 1280, height: 800, dsf: 1 },
    { name: "768", width: 768, height: 1024, dsf: 1 },
    { name: "390", width: 390, height: 844, dsf: 1, mobile: true },
  ]) {
    const p = await browser.newPage();
    await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    const errors = [];
    p.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
    try {
      await p.goto(`${BASE}/student`, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch { /* continue */ }
    await p.waitForSelector('[data-section="04-journey"] .snap-x', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3500));

    // lock the section, then measure + shoot
    await p.evaluate(async () => {
      const el = document.querySelector('[data-section="04-journey"]');
      for (let i = 0; i < 8; i++) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        await new Promise((r) => setTimeout(r, 220));
        if (Math.abs(el.getBoundingClientRect().top) <= 2) break;
      }
      window.scrollBy({ top: -56, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 1200));

    const metrics = await p.evaluate(() => {
      const j = document.querySelector('[data-section="04-journey"]');
      const vw = document.documentElement.clientWidth;
      const track = j.querySelector(".snap-x");
      const card = track.querySelector("figure");
      const cr = card.getBoundingClientRect();
      const h2 = j.querySelector("h2");
      const hr = h2.getBoundingClientRect();
      const ctl = [...j.querySelectorAll('button[aria-label$="journey"]')].map((b) => Math.round(b.getBoundingClientRect().width));
      const pill = j.querySelector('[class*="rounded-full"][class*="bg-[#E8E8ED]"]');
      const dots = j.querySelectorAll('[role="group"] button');
      return {
        cardW: Math.round(cr.width), cardWPct: Math.round((cr.width / vw) * 100), cardH: Math.round(cr.height),
        h2Left: Math.round(hr.left), h2Size: getComputedStyle(h2).fontSize,
        cardLeft: Math.round(cr.left), firstCardAlignsWithH2: Math.abs(cr.left - hr.left) <= 2,
        controlWidths: ctl,
        pillH: pill ? Math.round(pill.getBoundingClientRect().height) : null,
        dotCount: dots.length,
        spineDelta: Math.round(cr.left - hr.left),
      };
    });
    console.log(`\n===== student journey @${vp.name} =====`);
    console.log(JSON.stringify(metrics));
    await p.screenshot({ path: `${OUT}/journey-${vp.name}.png`, captureBeyondViewport: false });

    // autoplay check on desktop only: wait 5.6s, read active dot index via aria-pressed
    if (vp.name === "1440") {
      const before = await p.evaluate(() => [...document.querySelectorAll('[data-section="04-journey"] [role="group"] button')].findIndex((b) => b.getAttribute("aria-pressed") === "true"));
      await new Promise((r) => setTimeout(r, 5600));
      const after = await p.evaluate(() => [...document.querySelectorAll('[data-section="04-journey"] [role="group"] button')].findIndex((b) => b.getAttribute("aria-pressed") === "true"));
      console.log(`autoplay: dot ${before} -> ${after} (expect +1)`);
      // pause check
      await p.evaluate(() => document.querySelector('[data-section="04-journey"] button[aria-label="Pause the journey"]').click());
      const a1 = await p.evaluate(() => [...document.querySelectorAll('[data-section="04-journey"] [role="group"] button')].findIndex((b) => b.getAttribute("aria-pressed") === "true"));
      await new Promise((r) => setTimeout(r, 5600));
      const a2 = await p.evaluate(() => [...document.querySelectorAll('[data-section="04-journey"] [role="group"] button')].findIndex((b) => b.getAttribute("aria-pressed") === "true"));
      console.log(`paused: dot ${a1} -> ${a2} (expect same)`);
      await p.screenshot({ path: `${OUT}/journey-1440-controls.png`, captureBeyondViewport: false });

      // modal: click first visible card, shoot open state
      await p.evaluate(() => {
        const track = document.querySelector('[data-section="04-journey"] .snap-x');
        track.scrollTo({ left: 0, behavior: "auto" });
        window.scrollTo({ top: document.querySelector('[data-section="04-journey"]').getBoundingClientRect().top + window.scrollY, behavior: "auto" });
      });
      await new Promise((r) => setTimeout(r, 900));
      await p.evaluate(() => document.querySelector('[data-section="04-journey"] figure button').click());
      await p.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 8000 });
      await new Promise((r) => setTimeout(r, 900));
      await p.screenshot({ path: `${OUT}/modal-1440.png`, captureBeyondViewport: false });
      const modal = await p.evaluate(() => {
        const d = document.querySelector('[role="dialog"][aria-modal="true"]');
        const kick = d.querySelector("p");
        const h3 = d.querySelector("h3");
        const primary = [...d.querySelectorAll("a")].find((a) => a.className.includes("bg-[#121317]"));
        const cs = primary ? getComputedStyle(primary) : null;
        return {
          kicker: { text: kick.textContent.trim(), size: getComputedStyle(kick).fontSize, transform: getComputedStyle(kick).textTransform },
          h3Size: getComputedStyle(h3).fontSize,
          primaryBg: cs ? cs.backgroundColor : null,
        };
      });
      console.log("modal:", JSON.stringify(modal));
    }
    if (errors.length) console.log("PAGEERRORS:", JSON.stringify(errors));
    await p.close();
  }

  // teacher sanity
  const t = await browser.newPage();
  await t.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  try {
    await t.goto(`${BASE}/teacher`, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch { /* continue */ }
  await t.waitForSelector('[data-section="04-journey"] .snap-x', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));
  await t.evaluate(async () => {
    const el = document.querySelector('[data-section="04-journey"]');
    for (let i = 0; i < 8; i++) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
      await new Promise((r) => setTimeout(r, 220));
      if (Math.abs(el.getBoundingClientRect().top) <= 2) break;
    }
    window.scrollBy({ top: -56, behavior: "instant" });
  });
  await new Promise((r) => setTimeout(r, 1000));
  await t.screenshot({ path: `${OUT}/teacher-1440.png`, captureBeyondViewport: false });
  console.log("teacher shot done");
  await t.close();
} finally {
  await browser.close();
}
console.log("\nDONE");
