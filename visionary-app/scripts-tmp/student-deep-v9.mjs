import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";
const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 120000 });
const page = await browser.newPage();
const events = [];
page.on("pageerror", (e) => events.push(`PAGEERROR: ${String(e).slice(0, 200)}`));
page.on("console", (m) => events.push(`${m.type()}: ${m.text().slice(0, 180)}`));
page.on("requestfailed", (r) => events.push(`REQFAIL: ${r.url().slice(0, 110)} ${r.failure()?.errorText}`));
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:5231/student", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 14000));
const state = await page.evaluate(() => ({
  sections: document.querySelectorAll("main > section[data-section]").length,
  bodyChars: (document.body.textContent || "").trim().length,
  bodySample: (document.body.textContent || "").trim().slice(0, 200),
  suspenseEls: [...document.querySelectorAll("[class*='suspense'], [class*='spinner'], [class*='loader'], [data-suspense]")].map((e) => (e.className || "").toString().slice(0, 40)),
  mainHTML: (document.querySelector("main")?.innerHTML || "").slice(0, 300),
}));
console.log(JSON.stringify(state, null, 1));
console.log("EVENTS:");
[...new Set(events)].slice(0, 14).forEach((e) => console.log("  " + e));
writeFileSync("scripts-tmp/student-deep-v9.json", JSON.stringify({ state, events: [...new Set(events)].slice(0, 14) }, null, 1));
await browser.close();
console.log("DEEP-DONE");
