import puppeteer from "puppeteer";
import { appendFileSync } from "node:fs";

/* Smoke every public route for module-load crashes (the "stuck first load"
   class: a pageerror at import time leaves React unmounted). Unique run. */
const BASE = "http://localhost:5231";
const ROUTES = ["/", "/student", "/teacher", "/parent", "/organization", "/college"];
const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 120000 });
const out = [];
try {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 140)}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 140)}`); });
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch (e) { errors.push(`goto: ${String(e).slice(0, 100)}`); }
    await new Promise((r) => setTimeout(r, 6000));
    const state = await page.evaluate(() => ({
      rootMounted: !!document.getElementById("root") && document.getElementById("root").children.length > 0,
      sections: document.querySelectorAll("main > section[data-section]").length,
      bodyChars: (document.body.textContent || "").trim().length,
      title: document.title.slice(0, 40),
    })).catch((e) => ({ evalError: String(e).slice(0, 120) }));
    out.push({ route, ...state, errors: errors.slice(0, 4) });
    await page.close();
  }
} finally {
  await browser.close();
}
appendFileSync("scripts-tmp/route-smoke-v11-out.json", JSON.stringify(out, null, 1));
for (const r of out) {
  console.log(`${r.route.padEnd(15)} mounted:${r.rootMounted ? "Y" : "N"} sections:${String(r.sections).padStart(2)} chars:${String(r.bodyChars).padStart(6)} ${r.errors && r.errors.length ? "ERRORS: " + r.errors[0] : "clean"}`);
}
console.log("SMOKE-DONE");
