import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

/* Walk Apple premium pages (vision-pro / education / airpods) at desktop +
   mobile, measuring chapter breath, type tiers, media sizing, and the
   statement→media gap on narrative person chapters. Shots land in
   scripts-tmp/shots/apple-edu-walk/. */
const OUT = "scripts-tmp/shots/apple-edu-walk";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["vision-pro", "https://www.apple.com/vision-pro/"],
  ["education", "https://www.apple.com/education/"],
  ["airpods-pro", "https://www.apple.com/airpods-pro/"],
];
const VIEWPORTS = [
  [1440, 900, "1440"],
  [390, 844, "390"],
];

const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 240000 });
try {
  for (const [name, url] of PAGES) {
    for (const [w, h, tag] of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
      } catch { /* heavy page; continue */ }
      await new Promise((r) => setTimeout(r, 6000));
      // full walk so lazy media mounts
      await page.evaluate(async () => {
        const step = Math.max(400, Math.round(window.innerHeight * 0.6));
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 90));
        }
        window.scrollTo(0, 0);
      });
      await new Promise((r) => setTimeout(r, 2500));

      const data = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const px = (v) => Math.round(parseFloat(v) * 10) / 10;
        const chapters = [];
        const nodes = [...document.querySelectorAll("main > section, main > div[class*='section'], main > div[class*='chapter'], main > [class*='chapter']")];
        for (const el of nodes) {
          const r = el.getBoundingClientRect();
          if (r.height < 200) continue;
          const cs = getComputedStyle(el);
          const heads = [...el.querySelectorAll("h1,h2,h3")].slice(0, 3).map((hd) => {
            const c = getComputedStyle(hd);
            const hr = hd.getBoundingClientRect();
            return {
              tag: hd.tagName.toLowerCase(),
              size: px(c.fontSize), weight: c.fontWeight,
              color: c.color,
              text: (hd.textContent || "").trim().slice(0, 44),
              wPct: Math.round((hr.width / vw) * 100),
            };
          });
          const media = [...el.querySelectorAll("img,video")].slice(0, 4).map((m) => {
            const mr = m.getBoundingClientRect();
            return { wPct: Math.round((mr.width / vw) * 100), h: Math.round(mr.height) };
          });
          // gap between first heading and first media (statement → stage drop)
          let gapHeadMedia = null;
          const h1 = el.querySelector("h1,h2,h3");
          const m1 = el.querySelector("img,video");
          if (h1 && m1) {
            const a = h1.getBoundingClientRect();
            const b = m1.getBoundingClientRect();
            gapHeadMedia = Math.round(b.top - a.bottom);
          }
          chapters.push({
            h: Math.round(r.height),
            padTop: px(cs.paddingTop), padBottom: px(cs.paddingBottom),
            bg: cs.backgroundColor, gapHeadMedia,
            heads, media,
          });
        }
        // type ramp
        const ramp = {};
        [...document.querySelectorAll("h1,h2,h3,p")].forEach((hd) => {
          const c = getComputedStyle(hd);
          if (parseFloat(c.fontSize) >= 17) {
            const k = `${hd.tagName} ${px(c.fontSize)}/${c.fontWeight}`;
            ramp[k] = (ramp[k] || 0) + 1;
          }
        });
        return {
          vw,
          pageH: Math.round(document.body.scrollHeight),
          chapters: chapters.slice(0, 12),
          ramp: Object.entries(ramp)
            .sort((a, b) => parseFloat(b[0].split(" ")[1]) - parseFloat(a[0].split(" ")[1]))
            .slice(0, 12),
        };
      });
      console.log(`\n===== ${name} @${tag} =====`);
      console.log(JSON.stringify(data, null, 1));

      // chapter shots — walk again and capture each measured chapter
      const boxes = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [...document.querySelectorAll("main > section, main > div[class*='section'], main > div[class*='chapter'], main > [class*='chapter']")]
          .filter((el) => el.getBoundingClientRect().height > 200)
          .slice(0, 12)
          .map((el) => {
            const r = el.getBoundingClientRect();
            const t = (el.querySelector("h1,h2,h3")?.textContent || "").trim().slice(0, 30).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
            return { top: r.top + window.scrollY, h: r.height, label: t || "chapter" };
          });
      });
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        await page.evaluate((top) => window.scrollTo({ top: top - 60, behavior: "instant" }), b.top);
        await new Promise((r) => setTimeout(r, 900));
        const file = `${OUT}/${name}-${tag}-${String(i).padStart(2, "0")}-${b.label.slice(0, 24)}.png`;
        await page.screenshot({ path: file });
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log("\nDONE");
