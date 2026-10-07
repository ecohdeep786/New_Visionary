/* Route smoke: load every public route and capture pageerror/ console
   errors — a module-scope ReferenceError (the "stuck first load" class)
   shows as a pageerror with an empty section list. Unique run name:
   route-smoke-5231. */
import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:5231";
const ROUTES = ["/", "/student", "/teacher", "/parent", "/organization", "/college"];

const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 120000 });
const results = [];
try {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 160)}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 160)}`); });
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    } catch (e) {
      errors.push(`goto: ${String(e).slice(0, 100)}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
    const state = await page.evaluate(() => ({
      sections: [...document.querySelectorAll("main > section[data-section], main section[data-section]")].length,
      rootChildren: document.getElementById("root") ? document.getElementById("root").children.length : -1,
      hasHero: !!document.querySelector('[data-section="01-hero"]'),
      bodyText: (document.body.textContent || "").trim().length,
    }));
    results.push({ route, ...state, errors: errors.slice(0, 4) });
    await page.close();
  }
} finally {
  await browser.close();
}
writeFileSync("scripts-tmp/landing-audit/route-smoke-5231.json", JSON.stringify(results, null, 1));
for (const r of results) {
  console.log(`${r.route.padEnd(15)} sections:${String(r.sections).padStart(3)} hero:${r.hasHero ? "y" : "n"} text:${r.bodyText}${r.errors.length ? "  ERRORS: " + r.errors[0] : ""}`);
}
