/* Apple deep metrics — Oct 2026 UX pass. Measures Apple's live pages end to
   end: type scale, section rhythm, tile grids, buttons, nav, and the
   responsive curve at 390 / 1068 / 1440. Saves JSON + stepped screenshots
   under scripts-tmp/apple-deep.
   Run: node scripts-tmp/apple-deep.mjs */
import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "scripts-tmp/apple-deep";
mkdirSync(OUT, { recursive: true });

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";

const PAGES = [
  ["iphone", "https://www.apple.com/iphone/"],
  ["airpods", "https://www.apple.com/airpods/"],
  ["visionpro", "https://www.apple.com/apple-vision-pro/"],
  ["education", "https://www.apple.com/education/"],
  ["edu-k12", "https://www.apple.com/education/k12/"],
];
const VIEWPORTS = [
  [390, 844, "phone"],
  [1068, 900, "desktop-lg"],
  [1440, 900, "desktop-xl"],
];

function metricsInPage() {
  const px = (v) => Math.round(parseFloat(v) * 10) / 10;
  const out = {
    headings: [], body: [], sections: [], tiles: [], buttons: [], nav: null,
    doc: { w: document.documentElement.clientWidth, scrollH: document.documentElement.scrollHeight },
  };

  document.querySelectorAll("h1, h2, h3, h4, [class*='headline']").forEach((h) => {
    const t = (h.innerText || "").trim().split("\n")[0].trim();
    if (!t || t.length < 2) return;
    const cs = getComputedStyle(h);
    const size = parseFloat(cs.fontSize);
    if (size < 18) return;
    out.headings.push({
      t: t.slice(0, 48), size: Math.round(size), w: cs.fontWeight,
      ls: px(cs.letterSpacing),
      lh: Math.round((parseFloat(cs.lineHeight) / size) * 100) / 100,
      color: cs.color, fam: cs.fontFamily.split(",")[0].replace(/"/g, ""),
    });
  });

  document.querySelectorAll("p, li").forEach((p) => {
    const t = (p.innerText || "").trim();
    if (t.length < 30 || t.length > 400) return;
    const cs = getComputedStyle(p);
    const size = parseFloat(cs.fontSize);
    if (size < 13 || size > 40) return;
    out.body.push({
      t: t.slice(0, 48), size: Math.round(size * 10) / 10,
      lh: Math.round((parseFloat(cs.lineHeight) / size) * 100) / 100,
      w: cs.fontWeight, color: cs.color,
    });
  });

  document.querySelectorAll("section, main > div, [class*='unit-wrapper']").forEach((s) => {
    const r = s.getBoundingClientRect();
    if (r.height < 300 || r.width < 100) return;
    const cs = getComputedStyle(s);
    out.sections.push({
      padT: cs.paddingTop, padB: cs.paddingBottom, h: Math.round(r.height),
      bg: cs.backgroundColor, color: cs.color,
      cls: (s.className || "").toString().slice(0, 60),
    });
  });

  // tile grids: grid/flex rows whose ≥2 children read as cards
  const grids = new Map();
  document.querySelectorAll("div, ul").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display !== "grid" && cs.display !== "flex") return;
    const kids = Array.from(el.children).filter(
      (k) => k.getBoundingClientRect().width > 100 && k.getBoundingClientRect().height > 100,
    );
    if (kids.length < 2) return;
    const kcs = getComputedStyle(kids[0]);
    const radius = Math.round(parseFloat(kcs.borderRadius) || 0);
    const gap = cs.rowGap || cs.columnGap || "0px";
    const cols = cs.gridTemplateColumns.replace(/\s+/g, " ").slice(0, 40);
    const key = `${cs.display}|${cols}|${gap}|${radius}`;
    if (grids.has(key)) grids.get(key).count += 1;
    else grids.set(key, { display: cs.display, cols, gap, radius, itemPad: kcs.padding, bg: kcs.backgroundColor, count: 1 });
  });
  out.tiles = [...grids.values()].slice(0, 20);

  document.querySelectorAll("a, button").forEach((a) => {
    const cs = getComputedStyle(a);
    const t = (a.innerText || "").trim();
    if (!t || t.length < 3 || t.length > 28) return;
    const r = a.getBoundingClientRect();
    if (r.width < 60 || r.height < 28 || r.width > 480 || r.height > 64) return;
    const radius = parseFloat(cs.borderRadius);
    const bg = cs.backgroundColor;
    if (radius < 8 && !/rgba?\(/.test(bg)) return;
    out.buttons.push({
      t: t.slice(0, 30), fs: Math.round(parseFloat(cs.fontSize) * 10) / 10,
      w: cs.fontWeight, px: `${cs.paddingLeft}/${cs.paddingRight}`,
      h: Math.round(r.height), radius: Math.round(radius),
      bg, color: cs.color,
      border: cs.borderTopWidth !== "0px" ? cs.borderTopColor : null,
    });
  });

  const nav = document.querySelector(".globalnav") || document.querySelector("nav") || document.querySelector("header");
  if (nav) {
    const cs = getComputedStyle(nav);
    out.nav = {
      h: Math.round(nav.getBoundingClientRect().height), bg: cs.backgroundColor,
      blur: cs.backdropFilter || cs.webkitBackdropFilter, fontSize: cs.fontSize,
    };
  }
  return out;
}

const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
const report = {};
for (const [name, url] of PAGES) {
  report[name] = {};
  for (const [w, h, tag] of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.setUserAgent(UA);
    try {
      await page.goto(url, { waitUntil: "load", timeout: 120000 });
      await page.evaluate(() => document.fonts?.ready);
      // walk the page so lazy sections mount, then settle at the top
      await page.evaluate(async () => {
        const H = document.documentElement.scrollHeight;
        for (let y = 0; y < H; y += 1200) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await new Promise((r) => setTimeout(r, 1500));
      const m = await page.evaluate(metricsInPage);
      const dedupe = (arr, n) => {
        const seen = new Set(); const res = [];
        for (const it of arr) {
          if (seen.has(it.t)) continue;
          seen.add(it.t); res.push(it);
          if (res.length >= n) break;
        }
        return res;
      };
      m.headings = dedupe(m.headings, 40);
      m.body = dedupe(m.body, 30);
      m.buttons = dedupe(m.buttons, 24);
      report[name][tag] = m;
      console.log(`metrics: ${name} @${tag} (${w}px) OK — scrollH ${m.doc.scrollH}`);

      if (tag === "desktop-xl") {
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 800));
        await page.screenshot({ path: `${OUT}/${name}-1440-00-top.png` });
        const H = await page.evaluate(() => document.documentElement.scrollHeight);
        let n = 1;
        for (let y = 900; y < H; y += 900) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await new Promise((r) => setTimeout(r, 600));
          await page.screenshot({ path: `${OUT}/${name}-1440-${String(n).padStart(2, "0")}.png` });
          n += 1;
        }
        if (tag === "desktop-xl" && name === "iphone") {
          // phone-size screenshots for the flagship page too
          const p = await browser.newPage();
          await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
          await p.setUserAgent(UA);
          await p.goto(url, { waitUntil: "load", timeout: 120000 });
          await p.evaluate(async () => {
            const H = document.documentElement.scrollHeight;
            for (let y = 0; y < H; y += 1200) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
            window.scrollTo(0, 0);
          });
          await new Promise((r) => setTimeout(r, 1200));
          await p.screenshot({ path: `${OUT}/${name}-390-00-top.png` });
          const pH = await p.evaluate(() => document.documentElement.scrollHeight);
          let pn = 1;
          for (let y = 800; y < pH; y += 800) {
            await p.evaluate((yy) => window.scrollTo(0, yy), y);
            await new Promise((r) => setTimeout(r, 500));
            await p.screenshot({ path: `${OUT}/${name}-390-${String(pn).padStart(2, "0")}.png` });
            pn += 1;
          }
          await p.close();
        }
      }
    } catch (e) {
      console.log(`${name} @${tag} FAILED: ${String(e).slice(0, 160)}`);
    }
    await page.close();
  }
}
writeFileSync(`${OUT}/metrics.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log("done → scripts-tmp/apple-deep/metrics.json");
