import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

/* Wave L1 final hardening — full public-surface sweep, Google-quality bar.
   Auth + internal surfaces excluded per scope. */
const BASE = "http://localhost:4173";
const ROUTES = [
  "/", "/student", "/teacher", "/parent", "/professional", "/organization",
  "/help", "/how-it-works", "/about", "/pricing", "/download", "/research",
  "/careers", "/community", "/contact", "/partners", "/updates", "/referral",
  "/safety", "/privacy", "/terms", "/security", "/accessibility", "/cookies",
  "/signin", "/definitely-not-a-page",
];
const WIDTHS = [
  { name: "360", width: 360, height: 780 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const report = { issues: [], images: [], stats: { loads: 0, brokenImages: 0, overflows: 0, errors: 0 } };

for (const w of WIDTHS) {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: w.width, height: w.height } });
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 140)); });
    page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 140)));
    page.on("response", (r) => { if (r.status() >= 400) errors.push("HTTP " + r.status() + " " + r.url().slice(-70)); });
    try { await page.goto(BASE + route, { waitUntil: "load", timeout: 25000 }); } catch { errors.push("GOTO-TIMEOUT"); }
    /* mount-aware wait — permanent (L2 09-qa): h1 present before sampling */
    await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    // scroll through the page to trigger lazy images, then back to top
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
      window.scrollTo(0, 0);
    }).catch(() => {});
    await page.waitForTimeout(600);

    const check = await page.evaluate(() => {
      const vw = window.innerWidth;
      const out = {};
      out.overflow = document.documentElement.scrollWidth - vw;
      // offending elements (wider than viewport, visible)
      if (out.overflow > 0) {
        out.offenders = [...document.querySelectorAll("body *")]
          .filter((el) => el.getBoundingClientRect().right > vw + 1 && el.getBoundingClientRect().width > 40 && getComputedStyle(el).visibility !== "hidden")
          .slice(0, 3)
          .map((el) => el.tagName + "." + String(el.className).split(" ").slice(0, 2).join(".") + " w=" + Math.round(el.getBoundingClientRect().width));
      }
      out.broken = [...document.querySelectorAll("img")]
        .filter((i) => i.complete && i.naturalWidth === 0 && !i.hasAttribute("aria-hidden"))
        .map((i) => (i.getAttribute("src") || "").split("/").pop().slice(0, 60));
      out.distorted = [...document.querySelectorAll("img")]
        .filter((i) => i.complete && i.naturalWidth > 0 && i.getBoundingClientRect().width > 60)
        .filter((i) => {
          const nat = i.naturalWidth / i.naturalHeight, ren = i.getBoundingClientRect().width / i.getBoundingClientRect().height;
          return Math.abs(nat - ren) / nat > 0.03 && i.style.objectPosition === "" && !/object-(cover|contain|scale)/.test(i.className);
        })
        .map((i) => (i.currentSrc || i.src).split("/").pop().slice(0, 60));
      out.h1 = document.querySelectorAll("h1").length;
      out.nav = Boolean(document.querySelector("header, nav"));
      out.footer = Boolean(document.querySelector("footer"));
      out.imgCount = document.querySelectorAll("img").length;
      return out;
    }).catch(() => null);

    report.stats.loads++;
    const problems = [];
    if (errors.length) { problems.push(...errors.slice(0, 3)); report.stats.errors++; }
    if (check?.overflow > 0) { problems.push(`OVERFLOW+${check.overflow}px [${(check.offenders || []).join(" | ")}]`); report.stats.overflows++; }
    if (check?.broken.length) { problems.push("BROKEN-IMG " + check.broken.join(",")); report.stats.brokenImages++; }
    if (check?.distorted.length) problems.push("DISTORTED-IMG " + check.distorted.join(","));
    if (check && check.h1 !== 1 && !["/signin", "/definitely-not-a-page", "/login", "/register", "/forgot-password", "/forgot-user-id"].includes(route))
      problems.push(`H1-COUNT ${check.h1}`);
    if (check && !check.nav) problems.push("NO-NAV");
    if (check && !check.footer && !["/signin", "/definitely-not-a-page"].includes(route)) problems.push("NO-FOOTER");
    if (problems.length) report.issues.push({ route, width: w.name, problems });

    if (route === "/parent" && w.name === "1440") {
      report.images = await page.evaluate(() => [...document.querySelectorAll("img")].slice(0, 6).map((i) => ({
        src: (i.currentSrc || i.src).split("/").pop().slice(0, 50),
        natural: i.naturalWidth + "x" + i.naturalHeight,
        rendered: Math.round(i.getBoundingClientRect().width) + "x" + Math.round(i.getBoundingClientRect().height),
        loading: i.getAttribute("loading"),
      })));
    }
    await page.close();
  }
  console.log(`width ${w.name} done — issues so far: ${report.issues.length}`);
}

writeFileSync("scripts-tmp/final-verify-report.json", JSON.stringify(report, null, 2));
console.log("\nloads:", report.stats.loads, "errors:", report.stats.errors, "overflows:", report.stats.overflows, "brokenImgs:", report.stats.brokenImages);
console.log("ISSUES:", report.issues.length ? JSON.stringify(report.issues, null, 1).slice(0, 3000) : "NONE");
console.log("sample images /parent @1440:", JSON.stringify(report.images, null, 1));
await browser.close();
