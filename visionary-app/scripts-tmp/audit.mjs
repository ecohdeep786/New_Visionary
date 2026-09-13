import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

const BASE = "http://localhost:4173";
const ROUTES = [
  "/", "/login", "/register", "/forgot-password", "/forgot-user-id",
  "/student", "/teacher", "/parent", "/professional", "/organization",
  "/help", "/how-it-works", "/about", "/pricing", "/download", "/research",
  "/career", "/careers", "/community", "/contact", "/partners", "/updates",
  "/referral", "/safety", "/privacy", "/terms", "/security", "/accessibility",
  "/cookies", "/definitely-not-a-page",
];
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server", "--proxy-bypass-list=<-loopback>"] });
const report = [];

for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleErrors = [];
    const badResponses = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 160)); });
    page.on("response", (res) => { if (res.status() >= 400) badResponses.push(res.status() + " " + res.url().slice(-90)); });
    page.on("pageerror", (err) => consoleErrors.push("PAGEERROR " + String(err).slice(0, 160)));

    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    } catch { /* SPA may keep connections open; continue with what loaded */ }
    await page.waitForTimeout(1200);
    // scroll through to trigger lazy loads / reveals
    await page.evaluate(async () => {
      const step = 800;
      for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);

    const result = await page.evaluate(() => {
      const vw = window.innerWidth;
      const doc = document.documentElement;
      const docOverflow = doc.scrollWidth - vw;
      const offenders = [];
      const brokenImgs = [];
      const tinyTargets = [];

      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") continue;
        // element extends past right edge (with tolerance), skip intentional scrollers
        if (r.right > vw + 2 && style.overflowX !== "auto" && style.overflowX !== "scroll") {
          const p = el.closest('[class*="overflow-x-auto"], [class*="overflow-x-clip"], [class*="snap-x"]');
          if (!p) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")} right=${Math.round(r.right)}`);
        }
        if (el.tagName === "IMG" && el.complete && el.naturalWidth === 0 && !el.src.startsWith("data:")) {
          brokenImgs.push((el.getAttribute("src") || el.src).slice(-80));
        }
        if ((el.tagName === "BUTTON" || el.tagName === "A") && r.height > 0 && r.height < 24) {
          tinyTargets.push(`${el.tagName.toLowerCase()}:"${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)}" h=${Math.round(r.height)}`);
        }
      }

      return {
        mounted: Boolean(document.querySelector("#root")?.children.length) && !document.querySelector("a[onclick*='toggleHelpBox']"),
        title: document.title,
        docOverflow,
        offenders: offenders.slice(0, 4),
        brokenImgs: [...new Set(brokenImgs)].slice(0, 4),
        tinyTargets: [...new Set(tinyTargets)].slice(0, 4),
      };
    });

    if (!result.mounted || result.docOverflow > 1 || result.offenders.length || result.brokenImgs.length || result.tinyTargets.length || consoleErrors.length || badResponses.length) {
      report.push({ viewport: vp.name, route, ...result, consoleErrors: [...new Set(consoleErrors)].slice(0, 3), badResponses: [...new Set(badResponses)].slice(0, 4) });
    }
    await page.close();
  }
  console.log("viewport done:", vp.name);
}

await browser.close();
writeFileSync("audit-report.json", JSON.stringify(report, null, 1));
console.log("ISSUES:", report.length);
for (const r of report) console.log(`${r.viewport} ${r.route}${r.mounted ? "" : " NOT-MOUNTED"} | overflow=${r.docOverflow}${r.offenders.length ? " | off:" + r.offenders[0] : ""}${r.brokenImgs.length ? " | img:" + r.brokenImgs[0] : ""}${r.tinyTargets.length ? " | tiny:" + r.tinyTargets[0] : ""}${r.consoleErrors.length ? " | err:" + r.consoleErrors[0].slice(0, 60) : ""}${r.badResponses.length ? " | http:" + r.badResponses[0].slice(0, 50) : ""}`);
