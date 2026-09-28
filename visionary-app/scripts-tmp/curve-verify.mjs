/* Screenshot the changed card sections of each edited page for visual verification. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/curve-shots";
mkdirSync(OUT, { recursive: true });

const pages = [
  { file: "pricing.png", path: "/pricing", keyword: "every journey has a plan" },
  { file: "research.png", path: "/research", keyword: "help us shape the future" },
  { file: "referral.png", path: "/referral", keyword: "start from what they need" },
  { file: "safety.png", path: "/safety", keyword: "right for your family" },
  { file: "privacy-glance.png", path: "/privacy", keyword: "essentials, at a glance" },
  { file: "privacy-related.png", path: "/privacy", keyword: "read them together" },
  { file: "terms-glance.png", path: "/terms", keyword: "essentials, at a glance" },
  { file: "security-glance.png", path: "/security", keyword: "essentials, at a glance" },
  { file: "cookies-glance.png", path: "/cookies", keyword: "essentials, at a glance" },
  { file: "community.png", path: "/community", keyword: "more ways to engage" },
  { file: "contact.png", path: "/contact", keyword: "", tablist: true },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  for (const { file, path, keyword, tablist } of pages) {
    await page.goto("http://localhost:5175" + path, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 1800));
    const found = await page.evaluate(({ kw, useTablist }) => {
      let el = null;
      if (useTablist) {
        const t = document.querySelector('[role="tablist"]');
        el = t ? t.closest("section") : null;
      } else {
        el = [...document.querySelectorAll("h2")].find((x) => x.textContent.toLowerCase().includes(kw));
      }
      if (!el) return false;
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top - 150 });
      return true;
    }, { kw: keyword, useTablist: !!tablist });
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: `${OUT}/${file}` });
    console.log(file, found ? "ok" : "HEADING NOT FOUND");
  }
} finally {
  await browser.close();
}
console.log("DONE");
