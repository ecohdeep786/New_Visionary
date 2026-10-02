/**
 * Runtime verification of the Vision Pro scroll system (pinned path).
 * Forces prefers-reduced-motion: no-preference (this machine's OS reports
 * reduce, which exercises only the stacked fallback).
 */
import puppeteer from "puppeteer";
import fs from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "scripts-tmp/scroll-verify";
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { route: "/student", name: "student" },
  { route: "/teacher", name: "teacher" },
  { route: "/parent", name: "parent" },
  { route: "/professional", name: "professional" },
  { route: "/organization", name: "organization" },
];

const browser = await puppeteer.launch({ headless: "new" });
const results = [];

for (const { route, name } of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

  await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 45000 });
  await page.evaluate(() => document.fonts?.ready?.catch?.(() => {}));
  await new Promise((r) => setTimeout(r, 800));
  const report = { route, errors };

  const stageInfo = await page.evaluate(() => {
    const section = document.querySelector('section[data-section="02-struggle"]');
    if (!section) return null;
    const sticky = Array.from(section.querySelectorAll("div")).find(
      (d) => getComputedStyle(d).position === "sticky"
    );
    return {
      scenes: section.querySelectorAll(".stage-scene").length,
      hasSticky: !!sticky,
      sectionH: Math.round(section.getBoundingClientRect().height),
    };
  });
  report.stage = stageInfo;

  if (stageInfo?.hasSticky) {
    const sectionTop = await page.evaluate(() => {
      const s = document.querySelector('section[data-section="02-struggle"]');
      return s.getBoundingClientRect().top + window.scrollY;
    });
    const probe = async (y) => {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await new Promise((r) => setTimeout(r, 650));
      return page.evaluate(() => {
        const section = document.querySelector('section[data-section="02-struggle"]');
        const sticky = Array.from(section.querySelectorAll("div")).find(
          (d) => getComputedStyle(d).position === "sticky"
        );
        const dots = Array.from(section.querySelectorAll('[role="group"] button'));
        return {
          stickyTop: Math.round(sticky.getBoundingClientRect().top),
          activeDot: dots.findIndex((d) => d.getAttribute("aria-pressed") === "true"),
          word: section.querySelector("h2 span")?.textContent,
        };
      });
    };
    const enter = await probe(sectionTop + 40);
    const mid = await probe(sectionTop + stageInfo.sectionH * 0.6);
    const late = await probe(sectionTop + stageInfo.sectionH - 500);
    report.pin = { enter, mid, late };
    await page.evaluate((yy) => window.scrollTo(0, yy), sectionTop + stageInfo.sectionH * 0.6);
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: `${OUT}/${name}-stage-mid.png` });

    /* Dot click jumps within the stage */
    const dotJump = await page.evaluate(async () => {
      const section = document.querySelector('section[data-section="02-struggle"]');
      const dots = Array.from(section.querySelectorAll('[role="group"] button'));
      const before = window.scrollY;
      dots[dots.length - 1]?.click();
      await new Promise((r) => setTimeout(r, 900));
      return { before: Math.round(before), after: Math.round(window.scrollY) };
    });
    report.dotJump = dotJump;
  }

  /* Scrub sections: heading word must change across the section's travel. */
  const scrubCheck = {};
  for (const id of ["04-journey", "06-closing", "07-language"]) {
    const words = await page.evaluate(async (id) => {
      const s = document.querySelector(`section[data-section="${id}"]`);
      if (!s) return null;
      const r0 = s.getBoundingClientRect();
      const readWord = () => {
        const span = s.querySelector("h2 span.hero-fade-up, p span.hero-fade-up");
        return span ? span.textContent.trim().slice(0, 30) : null;
      };
      const vh = window.innerHeight;
      const at = (frac) =>
        window.scrollY + r0.top + r0.height * frac - vh * 0.5;
      window.scrollTo(0, Math.max(0, at(0.08)));
      await new Promise((res) => setTimeout(res, 500));
      const early = readWord();
      window.scrollTo(0, at(0.85));
      await new Promise((res) => setTimeout(res, 500));
      const late = readWord();
      return { early, late };
    }, id);
    scrubCheck[id] = words;
  }
  report.scrub = scrubCheck;

  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/${name}-top.png` });

  /* Mobile 390: stacked + find overflow culprit */
  await page.setViewport({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 700));
  report.mobile = await page.evaluate(() => {
    const section = document.querySelector('section[data-section="02-struggle"]');
    const sticky = section
      ? Array.from(section.querySelectorAll("div")).find((d) => getComputedStyle(d).position === "sticky")
      : null;
    const doc = document.documentElement;
    let culprit = null;
    if (doc.scrollWidth > window.innerWidth + 1) {
      const vw = window.innerWidth;
      const els = Array.from(document.querySelectorAll("body *"));
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 8 && r.width > 40 && getComputedStyle(el).position !== "fixed") {
          culprit = `${el.tagName}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)}`;
          break;
        }
      }
    }
    return {
      anySticky: !!sticky,
      scenes: section ? section.querySelectorAll(".stage-scene").length : -1,
      noOverflowX: doc.scrollWidth <= window.innerWidth + 1,
      culprit,
    };
  });

  results.push(report);
  await page.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/report2.json`, JSON.stringify(results, null, 2));
for (const r of results) {
  console.log(`\n${r.route}`);
  console.log("  stage:", JSON.stringify(r.stage));
  console.log("  pin:", JSON.stringify(r.pin));
  console.log("  dotJump:", JSON.stringify(r.dotJump));
  console.log("  scrub:", JSON.stringify(r.scrub));
  console.log("  mobile:", JSON.stringify(r.mobile));
  if (r.errors.length) console.log("  ERRORS:", r.errors.join(" | "));
}
