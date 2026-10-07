/* Landing page audit capture — per-section screenshots + computed metrics at
   320 / 390 / 734 / 1440, for comparison against the Apple deep pass.
   Run: node scripts-tmp/landing-audit.mjs */
import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "scripts-tmp/landing-audit";
mkdirSync(OUT, { recursive: true });
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });

async function capture(width, height, tag) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  // poll until the app mounts the hero (the Suspense shell shows "Loading..." meanwhile)
  await page.evaluate(() => new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if (document.querySelector('[data-section="01-hero"]') || Date.now() - t0 > 60000) resolve();
      else setTimeout(tick, 250);
    };
    tick();
  }));
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 1800));
  await new Promise((r) => setTimeout(r, 1800));

  const sections = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main > section, main > div")).map((s, i) => ({
      i,
      key: s.dataset.section || `div-${i}`,
      top: Math.round(s.getBoundingClientRect().top + window.scrollY),
      h: Math.round(s.getBoundingClientRect().height),
    })),
  );

  const metrics = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("main section").forEach((s) => {
      const cs = getComputedStyle(s);
      const h2 = s.querySelector("h2, h3");
      const h2cs = h2 ? getComputedStyle(h2) : null;
      out.push({
        key: s.dataset.section,
        padT: cs.paddingTop, padB: cs.paddingBottom, bg: cs.backgroundColor,
        h2: h2 ? (h2.innerText || "").trim().split("\n")[0].slice(0, 60) : null,
        h2Size: h2cs ? h2cs.fontSize : null,
        h2Lh: h2cs ? h2cs.lineHeight : null,
        h2Track: h2cs ? h2cs.letterSpacing : null,
        h2W: h2cs ? h2cs.fontWeight : null,
      });
    });
    return out;
  });

  // walk the page once so all reveals settle
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 1200));

  for (const s of sections) {
    await page.evaluate((t) => window.scrollTo(0, t), s.top);
    await new Promise((r) => setTimeout(r, 850));
    await page.screenshot({ path: `${OUT}/${tag}-${String(s.i + 1).padStart(2, "0")}-${s.key.replace(/[^\w-]/g, "")}.png` });
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: `${OUT}/${tag}-00-fold.png` });

  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.close();
  return { sections, metrics, docH, errors: errors.slice(0, 4) };
}

const results = {};
const only = process.argv[2];
for (const [w, h, tag] of [[320, 700, "320"], [390, 844, "390"], [734, 900, "734"], [1440, 900, "1440"]]) {
  if (only && tag !== only) continue;
  try {
    results[tag] = await capture(w, h, tag);
    console.log(`captured ${tag} (${w}px): ${results[tag].sections.length} sections, docH ${results[tag].docH}`);
  } catch (e) {
    console.log(`${tag} FAILED: ${String(e).slice(0, 160)}`);
  }
}
await browser.close();
writeFileSync(`${OUT}/landing.json`, JSON.stringify(results, null, 2));
console.log("done → scripts-tmp/landing-audit/landing.json");
