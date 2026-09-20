/* council/rhythm.mjs — 06's RHYTHM LEDGER probe (L3).
   For every public route × 360/768/1440/1920: find header units (h1/h2 followed
   by a sibling/subsequent <p> within the same block), measure fontSize and the
   vertical gap (sub.top - heading.bottom), ratio = gap/fontSize (em). A unit's
   ratio must be width-invariant across widths (max-min ≤ 0.06em).
   Output: scripts-tmp/rhythm-report.json */
import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

const BASE = "http://localhost:4173";
const ROUTES = [
  "/", "/student", "/teacher", "/parent", "/professional", "/organization",
  "/help", "/how-it-works", "/about", "/pricing", "/download", "/research",
  "/careers", "/community", "/contact", "/partners", "/updates", "/referral",
  "/safety", "/privacy", "/terms", "/security", "/accessibility", "/cookies",
  "/definitely-not-a-page",
];
const WIDTHS = [360, 768, 1440, 1920];

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const ledger = [];

const measure = (page) => page.evaluate(() => {
  const units = [];
  const heads = [...document.querySelectorAll("main h1, main h2, main h3")].slice(0, 24);
  for (const h of heads) {
    const fs = Math.max(parseFloat(getComputedStyle(h).fontSize), ...[...h.querySelectorAll("span, b, strong")].map((c) => parseFloat(getComputedStyle(c).fontSize) || 0));
    if (fs <= 0) continue;
    const hPos = getComputedStyle(h).position;
    if (hPos === "absolute" || hPos === "fixed") continue;
    let pair = null, kind = "";
    // (1) TRUE sub: the immediate next sibling, only if it is a <p> (or a wrapper whose FIRST content is a <p> with no heading/grid between)
    let node = h.nextElementSibling;
    let hops = 0;
    const hSec = h.closest("section");
    while (node && hops < 3) {
      // the pair must stay inside the heading's own section — never cross a boundary
      if (node.tagName === "SECTION" || (node.closest("section") && node.closest("section") !== hSec)) break;
      if (node.tagName === "P") { pair = node; kind = "h→sub"; break; }
      const ps = node.querySelectorAll?.("p");
      const firstP = ps && ps.length ? ps[0] : null;
      // accept a wrapper only if it opens with exactly ONE paragraph, no cards/grid
      if (firstP && ps.length === 1 && !node.querySelector("img, svg, h1, h2, h3, ul, table") && getComputedStyle(node).display !== "grid") { pair = firstP; kind = "h→sub"; break; }
      if (node.tagName === "UL" || node.tagName === "TABLE" || node.querySelector("img, svg, h2, h3")) break;
      node = node.nextElementSibling; hops++;
    }
    // (2) fallback pair: the eyebrow that PRECEDES the heading (immediate sibling <p>)
    if (!pair) {
      const prev = h.previousElementSibling;
      if (prev && prev.tagName === "P" && (getComputedStyle(prev).textTransform === "uppercase" || parseFloat(getComputedStyle(prev).letterSpacing) > 1)) {
        pair = prev; kind = "eyebrow→h";
      }
    }
    if (!pair) continue;
    const hb = h.getBoundingClientRect(), pb = pair.getBoundingClientRect();
    const gap = kind === "h→sub" ? pb.top - hb.bottom : hb.top - pb.bottom;
    const pPos = getComputedStyle(pair).position;
    if (pPos === "absolute" || pPos === "fixed") continue; // composition-positioned (frozen DNA)
    if (gap < -4 || gap > 160) continue; // header-unit gaps are never section-scale
    units.push({
      key: ((h.textContent || "") + (kind === "eyebrow→h" ? " [eyebrow]" : "")).trim().slice(0, 40),
      ratio: Math.round((gap / fs) * 1000) / 1000,
    });
  }
  return units;
});

for (const route of ROUTES) {
  const perUnit = new Map();
  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }); } catch {}
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    for (const u of await measure(page)) {
      if (!perUnit.has(u.key)) perUnit.set(u.key, { ratios: {}, ok: true, drift: "" });
      perUnit.get(u.key).ratios[w] = u.ratio;
    }
    await page.close();
  }
  for (const [key, rec] of perUnit) {
    const vals = Object.values(rec.ratios).filter((v) => v > 0);
    if (vals.length >= 2) {
      const drift = Math.max(...vals) - Math.min(...vals);
      rec.ok = drift <= 0.06;
      rec.drift = `spread ${Math.round(drift * 1000) / 1000}em (${Object.entries(rec.ratios).map(([w, r]) => `${w}:${r}`).join(" ")})`;
    } else { rec.ok = true; rec.drift = "insufficient widths"; }
    ledger.push({ route, unit: key, ratios: rec.ratios, ok: rec.ok, drift: rec.drift });
  }
  const bad = ledger.filter((l) => l.route === route && !l.ok).length;
  console.log(`${route}: units=${perUnit.size} drift-rows=${bad}`);
}
await browser.close();
writeFileSync("scripts-tmp/rhythm-report.json", JSON.stringify({ generated: new Date().toISOString(), ledger }, null, 1));
console.log(`RHYTHM LEDGER: ${ledger.length} rows, ${ledger.filter((l) => !l.ok).length} drift-rows`);
