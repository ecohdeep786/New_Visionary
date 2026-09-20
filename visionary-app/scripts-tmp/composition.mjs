/* council/composition.mjs — 06's COMPOSITION LEDGER probe (L7 + link/button inventory).
   Per route (desktop 1440): per <section> compute maxTextRun (longest run of
   consecutive text-only elements), anchorTypes, headingHasEyebrowOrTagline;
   site-wide iconlessNavButtons + chevronLinksMissing (nav/footer/CTA links).
   Output: scripts-tmp/composition-report.json */
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

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const ledger = { sections: [], iconlessNavButtons: [], chevronLinksMissing: [] };

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
  await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const hasAnchor = (el) => {
      if (el.querySelector("svg, img")) return true;
      if (/[0-9]/.test(el.textContent || "") && el.querySelector("[class*='tabular'], [class*='font-medium']")) return true;
      return false;
    };
    const sections = [...document.querySelectorAll("main section")].map((sec) => {
      // maxTextRun: longest walk of consecutive element children that are text-only (no svg/img/icon inside) and not headings
      let run = 0, maxRun = 0;
      for (const child of sec.querySelectorAll("*")) {
        if (child.closest("section") !== sec) continue;
        const textOnly = !child.querySelector("svg, img") && ["P", "SPAN", "STRONG", "EM", "UL", "OL", "LI", "DIV"].includes(child.tagName);
        const isLeafish = ["P", "SPAN", "LI"].includes(child.tagName) || (child.tagName === "DIV" && !child.querySelector("p"));
        if (textOnly && isLeafish && (child.textContent || "").trim().length > 20) { run++; maxRun = Math.max(maxRun, run); }
        else if (child.tagName === "H1" || child.tagName === "H2" || child.tagName === "H3" || hasAnchor(child)) run = 0;
      }
      const anchors = [];
      if (sec.querySelector("svg")) anchors.push("icon");
      if (sec.querySelector("img")) anchors.push("image");
      if (/\d+%|\d+x|\b\d{2,}\b/.test(sec.textContent || "") && sec.querySelector("[class*='medium'], [class*='semibold']")) anchors.push("stat");
      if (sec.querySelector("blockquote, [class*='quote']")) anchors.push("quote");
      const h2 = sec.querySelector("h2, h3");
      const eyebrow = h2 && (() => {
        let n = h2.previousElementSibling, hops = 0;
        while (n && hops < 3) {
          const s = getComputedStyle(n);
          if (n.tagName === "P" && (s.textTransform === "uppercase" || parseFloat(s.letterSpacing) > 1)) return true;
          n = n.previousElementSibling; hops++;
        }
        return false;
      })();
      return { sec: (sec.getAttribute("data-section") || sec.id || sec.querySelector("h1,h2,h3")?.textContent?.trim()?.slice(0, 30) || "?"), maxTextRun: maxRun, anchorTypes: anchors, headingHasEyebrowOrTagline: eyebrow !== false };
    });
    // iconless nav buttons: nav/footer interactive elements without svg and without visible text-only styling
    const iconless = [...document.querySelectorAll("nav a, nav button, header a, header button, footer a")]
      .filter((el) => !el.querySelector("svg, img") && (el.textContent || "").trim().length === 0)
      .map((el) => el.getAttribute("aria-label") || el.getAttribute("href") || "?");
    // chevron/arrow missing on standalone text links that look like CTAs
    const chevronless = [...document.querySelectorAll("main a")]
      .filter((el) => !el.querySelector("svg") && (el.textContent || "").trim().length > 0 && el.textContent.trim().length < 40 &&
        /get started|start free|see how|learn more|read more|contact|sign up|start learning|start practising/i.test(el.textContent))
      .map((el) => el.textContent.trim().slice(0, 30) + " → " + el.getAttribute("href"));
    return { sections, iconless, chevronless };
  });
  for (const s of data.sections) ledger.sections.push({ route, ...s });
  data.iconless.forEach((i) => ledger.iconlessNavButtons.push({ route, selector: i }));
  data.chevronless.forEach((c) => ledger.chevronLinksMissing.push({ route, link: c }));
  const viol = data.sections.filter((s) => s.maxTextRun > 3 || !s.headingHasEyebrowOrTagline).length;
  console.log(`${route}: sections=${data.sections.length} L7-violations=${viol} iconless=${data.iconless.length} chevronless=${data.chevronless.length}`);
}
await browser.close();
writeFileSync("scripts-tmp/composition-report.json", JSON.stringify(ledger, null, 1));
console.log(`COMPOSITION LEDGER: ${ledger.sections.length} rows`);
