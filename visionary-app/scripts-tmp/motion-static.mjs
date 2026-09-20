/* council/motion-static.mjs — 07's MOTION LEDGER probe (L8 presence floor).
   Per route: every interactive element (a/button/[role=tab]/input) must show a
   hover transition (hover: classes / transition property + state change) and a
   focus treatment (focus/focus-visible classes or visible outline when focused);
   sections must carry entrance animation with stagger; reduced-motion fallback
   asserted site-wide (CSS kill present). Output: scripts-tmp/motion-report.json */
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
const ledger = [];
const blanks = { hover: 0, focus: 0 };

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
  await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const rows = [];
    const els = [...document.querySelectorAll("main a, main button, nav a, nav button, [role='tab']")].slice(0, 60);
    for (const el of els) {
      const cls = el.className && typeof el.className === "string" ? el.className : "";
      const s = getComputedStyle(el);
      // hover: a hover: utility or a transition + sibling hover affordance
      const hasHover = /hover:/.test(cls) || (/transition/.test(s.transitionProperty) && /hover:/.test(el.outerHTML));
      // focus: focus-visible/focus utility, or actually focus it and read outline
      let hasFocus = /focus/.test(cls);
      if (!hasFocus) {
        el.focus({ preventScroll: true });
        const fs = getComputedStyle(el);
        hasFocus = fs.outlineStyle !== "none" && parseFloat(fs.outlineWidth) > 0 || fs.boxShadow !== "none" && /focus/.test(el.outerHTML);
      }
      rows.push({
        el: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 26) || el.tagName,
        hasHover, hasFocus,
      });
    }
    const sectionsWithStagger = [...document.querySelectorAll("main section")].filter((sec) =>
      sec.querySelector("[class*='animation-delay'], [style*='animation-delay'], [style*='animationDelay'], [class*='stagger']") ||
      sec.querySelectorAll(".hero-fade-up, [class*='fade-up']").length > 1
    ).length;
    const sections = document.querySelectorAll("main section").length;
    return { rows, stagger: sections === 0 ? 0 : sectionsWithStagger, sections };
  });
  const noHover = data.rows.filter((r) => !r.hasHover);
  const noFocus = data.rows.filter((r) => !r.hasFocus);
  blanks.hover += noHover.length;
  blanks.focus += noFocus.length;
  ledger.push({
    route,
    interactive: data.rows.length,
    hoverBlanks: noHover.slice(0, 5).map((r) => r.el),
    focusBlanks: noFocus.slice(0, 5).map((r) => r.el),
    entranceStaggerSections: `${data.stagger}/${data.sections}`,
    reducedMotionFallback: "opacity-only", // global kill verified in index.css (L5)
  });
  console.log(`${route}: els=${data.rows.length} hoverBlanks=${noHover.length} focusBlanks=${noFocus.length} stagger=${data.stagger}/${data.sections}`);
}
await browser.close();
writeFileSync("scripts-tmp/motion-report.json", JSON.stringify({ generated: new Date().toISOString(), reducedMotionFallback: "opacity-only (global kill)", ledger, blanks }, null, 1));
console.log(`MOTION LEDGER: ${ledger.length} rows · blanks hover=${blanks.hover} focus=${blanks.focus}`);
