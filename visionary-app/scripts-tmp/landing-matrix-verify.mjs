/* Landing viewport-matrix verification: overflow probe + section shots
   at 320×800, 390×844, 768×1024, 1280×720, 1440×900, plus a reduced-motion
   autoplay-gating check. Run: node scripts-tmp/landing-matrix-verify.mjs */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5175";
const OUT = "scripts-tmp/shots/landing-matrix";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { w: 320, h: 800, tag: "320" },
  { w: 390, h: 844, tag: "390" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1280, h: 720, tag: "1280" },
  { w: 1440, h: 900, tag: "1440" },
];

async function overflowReport(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const doc = document.scrollingElement;
    const offenders = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 1 && (r.right > vw + 1 || r.left < -1) && r.height > 4) {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed") return;
        offenders.push(
          `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")} right=${Math.round(r.right)} left=${Math.round(r.left)}`,
        );
      }
    });
    return {
      vw,
      scrollW: doc.scrollWidth,
      overflow: doc.scrollWidth > vw,
      offenders: offenders.slice(0, 8),
    };
  });
}

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const report = {};

for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });

  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 1800));

  // hero shot
  await page.screenshot({ path: `${OUT}/${vp.tag}-hero.png` });

  // overflow at top
  report[vp.tag] = { hero: await overflowReport(page) };

  // walk the chapters
  const sections = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main section[data-section]")).map((s) => s.dataset.section),
  );
  report[vp.tag].sections = sections;
  for (const s of sections) {
    await page.evaluate((sel) => {
      document.querySelector(`[data-section="${sel}"]`)?.scrollIntoView({ behavior: "instant", block: "start" });
      window.scrollBy(0, -70);
    }, s);
    await new Promise((r) => setTimeout(r, 900));
    if (["04-meet", "05-one-intelligence", "10-explore", "02-problem"].includes(s)) {
      report[vp.tag][s] = await overflowReport(page);
      await page.screenshot({ path: `${OUT}/${vp.tag}-${s}.png` });
    }
  }

  // bottom (CTA/FAQ/footer boundary)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `${OUT}/${vp.tag}-bottom.png` });

  // mobile drawer at phone sizes
  if (vp.w <= 390) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));
    await page.click('button[aria-label="Open menu"]');
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: `${OUT}/${vp.tag}-drawer.png` });
    report[vp.tag].drawerOverflow = await overflowReport(page);
    await page.keyboard.press("Escape");
  }

  // desktop nav visible check
  report[vp.tag].nav = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Primary"]');
    const burger = document.querySelector('button[aria-label="Open menu"], button[aria-label="Close menu"]');
    return { primaryNavVisible: nav ? getComputedStyle(nav).display !== "none" : false, burgerVisible: burger ? getComputedStyle(burger).display !== "none" : false };
  });

  report[vp.tag].errors = errors.slice(0, 5);
  await page.close();
}

// reduced-motion pass at 390: autoplay engines must hold still
const rm = await browser.newPage();
await rm.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await rm.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
await rm.screenshot({ path: `${OUT}/rm-390-hero.png` });
const oiPhase = () => rm.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('[data-section="05-one-intelligence"] [role="group"] button'));
  return btns.findIndex((b) => b.getAttribute("aria-pressed") === "true");
});
await rm.evaluate(() => document.querySelector('[data-section="05-one-intelligence"]')?.scrollIntoView({ behavior: "instant" }));
await new Promise((r) => setTimeout(r, 800));
const phaseA = await oiPhase();
await rm.screenshot({ path: `${OUT}/rm-390-oi.png` });
await new Promise((r) => setTimeout(r, 5200));
const phaseB = await oiPhase();
report.reducedMotion = { oiPhaseStable: phaseA === phaseB, phaseA, phaseB };
await rm.evaluate(() => document.querySelector('[data-section="06-commitment"]')?.scrollIntoView({ behavior: "instant" }));
await new Promise((r) => setTimeout(r, 500));
const activeStep = () => rm.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('[data-section="06-commitment"] button[aria-expanded]'));
  return rows.findIndex((b) => b.getAttribute("aria-expanded") === "true");
});
const stepA = await activeStep();
await rm.screenshot({ path: `${OUT}/rm-390-commitment.png` });
await new Promise((r) => setTimeout(r, 5000));
const stepB = await activeStep();
report.reducedMotion.commitmentStable = stepA === stepB;
await rm.close();

await browser.close();
console.log(JSON.stringify(report, null, 2));
