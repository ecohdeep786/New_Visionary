/* Final verification: student journey chapter against Apple's measured
   anatomy + modal open + screenshots at 4 widths. Unique run name. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/shots/rebuild-final";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5240";

const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 120000 });
try {
  // 1) student health + gallery metrics at 1440
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e).slice(0, 120)));
    await p.goto(`${BASE}/student`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 6000));
    const m = await p.evaluate(() => {
      const j = document.querySelector('[data-section="04-journey"]');
      const vw = document.documentElement.clientWidth;
      const track = j.querySelector('[aria-roledescription="carousel"]');
      const card = track.querySelector("figure");
      const cr = card.getBoundingClientRect();
      const h2 = j.querySelector("h2");
      const hr = h2.getBoundingClientRect();
      const btn = card.querySelector("button");
      const br = btn.getBoundingClientRect();
      const img = card.querySelector("img");
      const cs = getComputedStyle(btn);
      const stmt = card.querySelector("span span");
      const play = j.querySelector('button[aria-label^="Pause"], button[aria-label^="Play"]');
      const sections = document.querySelectorAll("main > section[data-section]").length;
      return {
        sections,
        cardWPct: Math.round((cr.width / vw) * 100),
        cardH: Math.round(cr.height),
        radius: cs.borderRadius,
        aspect: (cr.width / cr.height).toFixed(2),
        h2Size: getComputedStyle(h2).fontSize,
        h2Weight: getComputedStyle(h2).fontWeight,
        h2Left: Math.round(hr.left),
        spineDelta: Math.round(cr.left - hr.left),
        stmtSize: stmt ? getComputedStyle(stmt).fontSize : null,
        stmtColor: stmt ? getComputedStyle(stmt).color : null,
        plusInViewBox: img && !!card.querySelector('svg[viewBox="0 0 36 36"]'),
        playBtn: !!play,
      };
    });
    console.log("STUDENT@1440:", JSON.stringify(m, null, 1));
    await p.evaluate(async () => {
      const el = document.querySelector('[data-section="04-journey"]');
      for (let i = 0; i < 8; i++) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        await new Promise((r) => setTimeout(r, 200));
        if (Math.abs(el.getBoundingClientRect().top) <= 2) break;
      }
      window.scrollBy({ top: -64, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 1400));
    await p.screenshot({ path: `${OUT}/student-journey-1440.png`, captureBeyondViewport: false });
    // modal open + shot
    await p.evaluate(() => document.querySelector('[data-section="04-journey"] figure button').click());
    await p.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 1100));
    const modal = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-modal="true"]');
      const cs = getComputedStyle(d);
      const panel = d.querySelector(".relative.mx-auto");
      const pcs = panel ? getComputedStyle(panel) : null;
      const h3 = d.querySelector("h3");
      const body = d.querySelector("p");
      return {
        curtainBg: cs.backgroundColor, curtainBlur: cs.backdropFilter,
        panelRadius: pcs ? pcs.borderRadius : null, panelW: panel ? Math.round(panel.getBoundingClientRect().width) : null,
        h3Size: h3 ? getComputedStyle(h3).fontSize : null,
        bodySize: body ? getComputedStyle(body).fontSize : null,
      };
    });
    console.log("MODAL:", JSON.stringify(modal));
    await p.screenshot({ path: `${OUT}/student-modal-1440.png`, captureBeyondViewport: false });
    await p.close();
  }

  // 2) quick shots at other widths
  for (const vp of [
    { name: "1280", width: 1280, height: 800 },
    { name: "768", width: 768, height: 1024 },
    { name: "390", width: 390, height: 844, mobile: true },
  ]) {
    const p = await browser.newPage();
    await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e).slice(0, 100)));
    await p.goto(`${BASE}/student`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 5000));
    await p.evaluate(async () => {
      const el = document.querySelector('[data-section="04-journey"]');
      for (let i = 0; i < 8; i++) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        await new Promise((r) => setTimeout(r, 200));
        if (Math.abs(el.getBoundingClientRect().top) <= 2) break;
      }
      window.scrollBy({ top: -64, behavior: "instant" });
    });
    await new Promise((r) => setTimeout(r, 1100));
    await p.screenshot({ path: `${OUT}/student-journey-${vp.name}.png`, captureBeyondViewport: false });
    console.log(`shot ${vp.name}: pageerrors=${errs.length}`);
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("FINAL-VERIFY-DONE");
