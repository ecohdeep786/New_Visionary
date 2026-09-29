/* Full-page section audit: per-section screenshots at 1440/390 + DOM inventory. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/audit-shots";
mkdirSync(OUT, { recursive: true });
const SECTIONS = [
  "02-problem", "03-promise", "04-meet", "05-one-intelligence",
  "06-commitment", "07-language", "08-trust", "09-cta", "10-explore", "11-faq",
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  for (const [w, h, tag] of [[1440, 900, "1440"], [390, 844, "390"]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2800));

    for (const id of SECTIONS) {
      const ok = await page.evaluate((sid) => {
        const el = document.querySelector(`[data-section="${sid}"]`);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - 60, behavior: "instant" });
        return true;
      }, id);
      await new Promise((r) => setTimeout(r, 900));
      await page.screenshot({ path: `${OUT}/${tag}-${id}.png` });
      if (!ok) console.log(`MISSING ${tag} ${id}`);
    }

    /* horizontal overflow check per section */
    const overflow = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll("main > section").forEach((s) => {
        if (s.scrollWidth > window.innerWidth + 1) bad.push(`${s.dataset.section}:${s.scrollWidth}`);
      });
      return { bad, doc: document.documentElement.scrollWidth, vw: window.innerWidth };
    });
    console.log(tag, "overflow:", JSON.stringify(overflow));
  }

  /* DOM inventory at 1440: radii, borders, containers, heights */
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  const inv = await page.evaluate(() => {
    const radii = {};
    const borders = {};
    const widths = {};
    document.querySelectorAll("main *").forEach((el) => {
      const cs = getComputedStyle(el);
      const r = cs.borderRadius;
      if (r && r !== "0px" && /^\d+/.test(r)) {
        const key = r.replace(/\.0px/, "px");
        radii[key] = (radii[key] || 0) + 1;
      }
      if (cs.borderTopWidth !== "0px" && cs.borderTopStyle !== "none") {
        const key = `${cs.borderTopWidth} ${cs.borderTopColor}`;
        borders[key] = (borders[key] || 0) + 1;
      }
      if (el.matches("main > section, main > section > div")) {
        const w = cs.maxWidth;
        if (w && w !== "none") widths[w] = (widths[w] || 0) + 1;
      }
    });
    const heights = {};
    document.querySelectorAll("main > section").forEach((s) => {
      heights[s.dataset.section] = Math.round(s.getBoundingClientRect().height);
    });
    return { radii, borders, widths, heights };
  });
  console.log("INVENTORY", JSON.stringify(inv, null, 1));
} finally {
  await browser.close();
}
