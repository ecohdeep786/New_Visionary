/* Final Apple-match verification probe: measures the landing's computed
   geometry against the live-measured Apple spec (Oct 2026) at 4 viewports.
   Run: node scripts-tmp/apple-final-check.mjs */
import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";

const BASE = "http://127.0.0.1:5173";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });

const TARGETS = {
  "section-pad-phone": "96–112px",
  "section-pad-desktop": "112–144px",
  "junction-desktop": "~224–310px air between chapters",
  "junction-phone": "~192–224px",
  "h2-meet-desktop": "64px chapter tier",
  "h2-statements-desktop": "56px",
  "h2-journey": "40px desktop / 32px phone",
  "h2-journey-tracking": "-0.002em",
  "card-radius": "18px",
  "card-bg": "#F5F5F7 tiles / white cards on band",
  "card-gap": "20–24px",
  "btn-height": "44px",
  "btn-font": "17px",
  "trust-band": "#F5F5F7 section",
  "footer-bg": "#F5F5F7",
  "no-hairline": "transparent border-top on landing sections",
  "no-h-overflow": "no element wider than viewport",
};

function probe() {
  const d = document.documentElement;
  const vw = d.clientWidth;
  const px = (n) => Math.round(parseFloat(n) * 10) / 10;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY), h: Math.round(r.height), w: Math.round(r.width) }; };

  // horizontal overflow sweep
  const overflows = [];
  document.querySelectorAll("body *").forEach((el) => {
    if (el.getBoundingClientRect().right > vw + 1 || el.getBoundingClientRect().left < -1) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" || cs.position === "sticky") return;
      overflows.push(`${el.tagName}.${String(el.className).slice(0, 40)} right:${Math.round(el.getBoundingClientRect().right)}`);
    }
  });

  const sections = [];
  document.querySelectorAll("main > section").forEach((s) => {
    const cs = getComputedStyle(s);
    const h2 = s.querySelector("h2, h3");
    const h2cs = h2 ? getComputedStyle(h2) : null;
    const kicker = s.querySelector("p");
    const rects = [];
    s.querySelectorAll("h1, h2, h3, p, figure, img, div").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      rects.push({ top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, tag: el.tagName, cls: String(el.className).slice(0, 30) });
    });
    const first = rects.length ? Math.min(...rects.map((r) => r.top)) : null;
    const last = rects.length ? Math.max(...rects.map((r) => r.bottom)) : null;
    sections.push({
      key: s.dataset.section,
      padT: cs.paddingTop, padB: cs.paddingBottom, bg: cs.backgroundColor,
      borderTop: cs.borderTopColor + " " + cs.borderTopWidth,
      h2: h2 ? (h2.innerText || "").trim().split("\n")[0].slice(0, 44) : null,
      h2Size: h2cs ? Math.round(parseFloat(h2cs.fontSize)) : null,
      h2Track: h2cs ? h2cs.letterSpacing : null,
      h2Lh: h2cs ? h2cs.lineHeight : null,
      kickerGap: kicker && h2 ? Math.round(h2.getBoundingClientRect().top - kicker.getBoundingClientRect().bottom) : null,
      firstGap: first !== null ? Math.round(first - (s.getBoundingClientRect().top + window.scrollY)) : null,
      lastGap: last !== null ? Math.round((s.getBoundingClientRect().bottom + window.scrollY) - last) : null,
    });
  });

  // journey cards
  const journey = [];
  document.querySelectorAll('[data-section="06-journey"] figure').forEach((f) => {
    const cs = getComputedStyle(f);
    const img = f.querySelector("img");
    const cap = f.querySelector("figcaption");
    journey.push({
      radius: cs.borderRadius, bg: cs.backgroundColor, w: Math.round(f.getBoundingClientRect().width),
      capBelowImage: img && cap ? cap.getBoundingClientRect().top >= img.getBoundingClientRect().bottom - 1 : null,
      capPad: cap ? getComputedStyle(cap).padding : null,
    });
  });

  // trust tiles
  const trust = [];
  document.querySelectorAll('[data-section="08-trust"] .rounded-\\[18px\\], [data-section="08-trust"] div.overflow-hidden').forEach((t) => {
    const r = t.getBoundingClientRect();
    if (r.width < 100 || r.height < 100) return;
    const cs = getComputedStyle(t);
    trust.push({ radius: cs.borderRadius, bg: cs.backgroundColor, w: Math.round(r.width) });
  });

  // CTA buttons
  const btns = [];
  document.querySelectorAll('[data-section="09-cta"] a, [data-section="04-meet"] a').forEach((a) => {
    const r = a.getBoundingClientRect();
    if (r.width < 80) return;
    const cs = getComputedStyle(a);
    btns.push({ t: (a.innerText || "").trim().slice(0, 24), h: Math.round(r.height), fs: Math.round(parseFloat(cs.fontSize) * 10) / 10, radius: cs.borderRadius });
  });

  const footer = document.querySelector("footer");
  const meetH2 = document.querySelector('[data-section="04-meet"] h2');
  const gapMeet = meetH2 ? Math.round(meetH2.getBoundingClientRect().top - (meetH2.parentElement.querySelector("p")?.getBoundingClientRect().bottom || 0)) : null;

  // Meet alignment + rhythm: tab strip center X vs chapters container center X
  // (the "centered as the rectangle" check), gap from strip-bottom to first
  // row top, inter-row gaps, and per-row copy/image centering.
  const strip = document.querySelector('[data-section="04-meet"] [role="tablist"]');
  const rowsContainer = document.querySelector('[data-section="04-meet"] div.grid.w-full');
  const center = (el) => { const r = el.getBoundingClientRect(); return { cx: Math.round(r.left + r.width / 2), t: Math.round(r.top + window.scrollY), b: Math.round(r.bottom + window.scrollY) }; };
  const rows = [];
  if (rowsContainer) {
    const stripRect = strip ? strip.getBoundingClientRect() : null;
    const stripBottom = stripRect ? Math.round(stripRect.bottom + window.scrollY) : null;
    const stepEls = rowsContainer.querySelectorAll('[data-step]');
    stepEls.forEach((row, idx) => {
      const copy = row.querySelector("div");
      const img = row.querySelector("figure img") || row.querySelector("img");
      const rt = center(row);
      const prevBottom = idx === 0 ? stripBottom : rows[idx - 1].bottom;
      rows.push({
        copyCx: copy ? center(copy).cx : null, imgCx: img ? center(img).cx : null,
        top: rt.t, bottom: rt.b,
        gapAbove: prevBottom !== null ? Math.round(rt.t - prevBottom) : null,
        rowGap: row.style.gap || getComputedStyle(row).gap,
      });
    });
  }

  // Journey alignment: header left vs first card left (structural spine check)
  const journeyHeader = document.querySelector('[data-section="06-journey"] h2');
  const journeyTrack = document.querySelector('[data-section="06-journey"] [role="group"][aria-label*="journey"]');
  // read the LEFT PADDING (the spine) rather than the scrolled card's offset
  const trackLeftPad = journeyTrack ? parseInt(getComputedStyle(journeyTrack).paddingLeft) : null;
  const journeyFirstCard = journeyTrack ? journeyTrack.querySelector("figure") : null;
  const jhLeft = journeyHeader ? Math.round(journeyHeader.getBoundingClientRect().left) : null;
  const trackRect = journeyTrack ? journeyTrack.getBoundingClientRect() : null;
  const trackLeftEdge = trackRect ? Math.round(trackRect.left) : null;
  const firstCardRestLeft = journeyFirstCard ? Math.round(trackRect.left + trackLeftPad) : null; // where card[0] *rests*

  return {
    vw,
    docH: d.scrollHeight,
    overflows: overflows.slice(0, 8),
    sections,
    journey,
    trust,
    btns,
    footer: footer ? { bg: getComputedStyle(footer).backgroundColor, borderTop: getComputedStyle(footer).borderTopColor } : null,
    meetKickerGap: gapMeet,
    meet: {
      stripCenterX: strip ? center(strip).cx : null,
      containerCenterX: rowsContainer ? center(rowsContainer).cx : null,
      centerDelta: strip && rowsContainer ? Math.round(center(strip).cx - center(rowsContainer).cx) : null,
      rows,
    },
    journeyHeaderLeft: jhLeft,
    journeyTrackLeftPad: trackLeftPad,
    journeyTrackLeftEdge: trackLeftEdge,
    journeyCardRestLeft: firstCardRestLeft,
    journeyLeftDelta: jhLeft !== null && firstCardRestLeft !== null ? Math.round(jhLeft - firstCardRestLeft) : null,
  };
}

const report = { targets: TARGETS };
for (const [w, h, tag] of [[320, 700, "320"], [390, 844, "390"], [768, 1024, "768"], [1024, 900, "1024"], [1440, 900, "1440"], [1920, 1080, "1920"]]) {
  const page = await browser.newPage();
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
  // settle reveals
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 900));
  report[tag] = await page.evaluate(probe);
  console.log(`probed ${tag} (${w}px): sections ${report[tag].sections.length}, overflows ${report[tag].overflows.length}`);
  await page.close();
}
await browser.close();
writeFileSync("scripts-tmp/landing-audit/final-check.json", JSON.stringify(report, null, 2));
console.log("done → scripts-tmp/landing-audit/final-check.json");
