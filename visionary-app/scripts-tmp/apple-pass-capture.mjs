/* Apple-pass capture: per-section screenshots + layout audit for the 8
   landing pages, plus stepped screenshots of Apple reference pages.
   Run: node scripts-tmp/apple-pass-capture.mjs [ours|apple|all] */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5175";
const OUT = "scripts-tmp/apple-pass";
mkdirSync(OUT, { recursive: true });
mkdirSync(`${OUT}/apple`, { recursive: true });

const PAGES = [
  ["student", "/student"],
  ["teacher", "/teacher"],
  ["parent", "/parent"],
  ["professional", "/professional"],
  ["coaching", "/how-it-works"],
  ["organization", "/organization"],
  ["careers", "/careers"],
  ["community", "/community"],
];

const APPLE_PAGES = [
  ["iphone", "https://www.apple.com/iphone/"],
  ["edu-hub", "https://www.apple.com/education/"],
  ["edu-college", "https://www.apple.com/education/college/"],
  ["edu-teacher", "https://www.apple.com/education/teaching/"],
];

const mode = process.argv[2] || "all";

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

async function ours() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const audit = {};
  for (const [name, path] of PAGES) {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2", timeout: 90000 });
    await page.evaluate(() => document.fonts?.ready);
    await new Promise((r) => setTimeout(r, 1600));

    const sections = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main section")).map((s, i) => ({
        i,
        key: s.dataset.section || `sec-${i}`,
        top: s.getBoundingClientRect().top + window.scrollY,
        h: s.getBoundingClientRect().height,
      })),
    );
    audit[name] = { sections: [], errors: [] };

    // hero first
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: `${OUT}/${name}-00-hero.png` });

    for (const s of sections) {
      await page.evaluate((top) => window.scrollTo(0, top), s.top);
      await new Promise((r) => setTimeout(r, 950));
      await page.screenshot({ path: `${OUT}/${name}-${String(s.i + 1).padStart(2, "0")}-${s.key.replace(/[^\w-]/g, "")}.png` });

      const m = await page.evaluate((key) => {
        const el = document.querySelector(`[data-section="${key}"]`) || document.querySelectorAll("main section")[0];
        if (!el) return null;
        const cs = getComputedStyle(el);
        const text = (el.innerText || "").trim();
        const words = text.split(/\s+/).filter(Boolean).length;
        const h2 = el.querySelector("h2, h1");
        const h2cs = h2 ? getComputedStyle(h2) : null;
        // count paragraphs with >12 words (body copy blocks)
        let bodyBlocks = 0, bodyWords = 0;
        el.querySelectorAll("p").forEach((p) => {
          const w = (p.innerText || "").split(/\s+/).filter(Boolean).length;
          if (w > 12) { bodyBlocks += 1; bodyWords += w; }
        });
        return {
          words,
          bodyBlocks,
          bodyWords,
          padTop: cs.paddingTop,
          padBottom: cs.paddingBottom,
          bg: cs.backgroundColor,
          h2Size: h2cs ? h2cs.fontSize : null,
          h2Weight: h2cs ? h2cs.fontWeight : null,
          h2Track: h2cs ? h2cs.letterSpacing : null,
          h2Text: h2 ? (h2.innerText || "").split("\n")[0].slice(0, 60) : null,
        };
      }, s.key);
      if (m) audit[name].sections.push({ key: s.key, ...m });
    }
    audit[name].errors = errors.slice(0, 4);
    console.log(`ours: ${name} done (${sections.length} sections)`);
  }
  await page.close();
  return audit;
}

async function apple() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
  );
  for (const [name, url] of APPLE_PAGES) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
      await page.evaluate(() => document.fonts?.ready);
      await new Promise((r) => setTimeout(r, 2000));
      const height = await page.evaluate(() => document.body.scrollHeight);
      const steps = Math.min(14, Math.ceil(height / 850));
      for (let i = 0; i < steps; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), i * 850);
        await new Promise((r) => setTimeout(r, 1100));
        await page.screenshot({ path: `${OUT}/apple/${name}-${String(i).padStart(2, "0")}.png` });
      }
      console.log(`apple: ${name} done (${steps} steps, height ${height})`);
    } catch (e) {
      console.log(`apple: ${name} FAILED ${String(e).slice(0, 140)}`);
    }
  }
  await page.close();
}

let audit = null;
if (mode === "ours" || mode === "all") audit = await ours();
if (mode === "apple" || mode === "all") await apple();

await browser.close();
if (audit) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(`${OUT}/audit.json`, JSON.stringify(audit, null, 2));
  console.log("audit written");
}
