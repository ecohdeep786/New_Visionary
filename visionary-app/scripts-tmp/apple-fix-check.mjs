/* Verifies the four user-reported fixes:
   1. Problem: balanced statement→stage→caption spacing, device-scaled stage.
   2. Promise: a light fade-in/out sentence, not a 200vh pinned section.
   3. Meet tabs: selected chip slides into view on narrow screens.
   4. Meet chapters: copy-first rows on mobile, vertically balanced on desktop.
   Run: node scripts-tmp/apple-fix-check.mjs */
import puppeteer from "puppeteer";
const BASE = "http://localhost:5173";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });

async function load(page, w, h) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.evaluate(() => new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if (document.querySelector('[data-section="01-hero"]') || Date.now() - t0 > 60000) resolve();
      else setTimeout(tick, 250);
    };
    tick();
  }));
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 1500));
  // settle reveals by walking the page
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 900));
}

const out = {};

// ── 390: mobile checks ──────────────────────────────────────────────────
{
  const page = await browser.newPage();
  await load(page, 390, 844);
  out.mobile = await page.evaluate(() => {
    const sec = (k) => document.querySelector(`[data-section="${k}"]`);
    const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;
    const problem = sec("02-problem");
    const h2 = problem.querySelector("h2");
    const stage = problem.querySelector("figure > div");
    const cap = problem.querySelector("figcaption");
    const cs = getComputedStyle(problem);
    const promise = sec("03-promise");
    const meet = sec("04-meet");
    const firstRow = meet.querySelector('[data-step="0"]');
    const rowCopy = firstRow.querySelector("div");
    const rowImg = firstRow.querySelector("img");
    return {
      problem: { pad: `${cs.paddingTop}/${cs.paddingBottom}`, h2StageGap: Math.round(absTop(stage) - (absTop(h2) + h2.getBoundingClientRect().height)), stageH: Math.round(stage.getBoundingClientRect().height), stageCapGap: Math.round(absTop(cap) - (absTop(stage) + stage.getBoundingClientRect().height)) },
      promise: { h: Math.round(promise.getBoundingClientRect().height), pad: getComputedStyle(promise).paddingTop },
      meetCopyFirst: absTop(rowCopy) < absTop(rowImg),
      meetCopyImgGap: Math.round(absTop(rowImg) - (absTop(rowCopy) + rowCopy.getBoundingClientRect().height)),
    };
  });
  // tab strip: click the last chip, then check it slid into view
  const tabCheck = await page.evaluate(async () => {
    const strip = document.querySelector('[data-section="04-meet"] [role="tablist"]');
    const btns = [...strip.querySelectorAll('[role="tab"]')];
    btns[btns.length - 1].click();
    await new Promise((r) => setTimeout(r, 900));
    const srect = strip.getBoundingClientRect();
    const brect = btns[btns.length - 1].getBoundingClientRect();
    return {
      scrollLeft: Math.round(strip.scrollLeft),
      activeFullyVisible: brect.left >= srect.left - 1 && brect.right <= srect.right + 1,
      stripScrollable: strip.scrollWidth > strip.clientWidth,
    };
  });
  out.mobile.tabs = tabCheck;
  await page.close();
}

// ── 1440: desktop checks ────────────────────────────────────────────────
{
  const page = await browser.newPage();
  await load(page, 1440, 900);
  out.desktop = await page.evaluate(() => {
    const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;
    const sec = (k) => document.querySelector(`[data-section="${k}"]`);
    const problem = sec("02-problem");
    const h2 = problem.querySelector("h2");
    const stage = problem.querySelector("figure > div");
    const cap = problem.querySelector("figcaption");
    const meet = sec("04-meet");
    const row = meet.querySelector('[data-step="0"]');
    const rowCopy = row.querySelector("div");
    const rowImg = row.querySelector("img");
    const language = sec("07-language");
    const langKicker = language.querySelector("p");
    const lastRow = meet.querySelector('[data-step="4"]');
    const center = (el) => { const r = el.getBoundingClientRect(); return r.top + window.scrollY + r.height / 2; };
    return {
      problem: {
        pad: getComputedStyle(problem).paddingTop,
        h2StageGap: Math.round(absTop(stage) - (absTop(h2) + h2.getBoundingClientRect().height)),
        stageH: Math.round(stage.getBoundingClientRect().height),
        stageCapGap: Math.round(absTop(cap) - (absTop(stage) + stage.getBoundingClientRect().height)),
        sectionH: Math.round(problem.getBoundingClientRect().height),
      },
      promise: { h: Math.round(sec("03-promise").getBoundingClientRect().height) },
      meetRowBalance: Math.abs(Math.round(center(rowCopy) - center(rowImg))),
      meetLastRowToLanguage: Math.round(absTop(langKicker) - (absTop(lastRow) + lastRow.getBoundingClientRect().height)),
      docH: document.documentElement.scrollHeight,
    };
  });
  await page.close();
}

// ── overflow sweep at 4 widths ──────────────────────────────────────────
out.overflows = {};
for (const w of [320, 390, 734, 1440]) {
  const page = await browser.newPage();
  await load(page, w, w === 320 ? 700 : 900);
  out.overflows[w] = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll("body *").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" || cs.position === "sticky") return;
      const r = el.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1) && !el.closest('[role="tablist"], [aria-roledescription="carousel"], [data-section="01-hero"], .overflow-x-auto, [data-section="02-problem"]')) {
        bad.push(`${el.tagName}.${String(el.className).slice(0, 30)} right:${Math.round(r.right)}`);
      }
    });
    return bad.slice(0, 6);
  });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 2));
