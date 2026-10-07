import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900 });
const logs = [];
p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
p.on("pageerror", (e) => logs.push(`pageerror: ${String(e).slice(0, 400)}`));
await p.goto(`${process.env.BASE_URL || "http://localhost:5179"}/student`, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 9000));
const state = await p.evaluate(() => ({
  sections: [...document.querySelectorAll("main > section[data-section]")].map((s) => s.getAttribute("data-section")),
  hasSnap: !!document.querySelector('[data-section="04-journey"] .snap-x'),
  bodyChildren: document.querySelector("#root") ? document.querySelector("#root").children.length : -1,
}));
console.log(JSON.stringify(state, null, 1));
console.log("CONSOLE:");
logs.slice(0, 12).forEach((l) => console.log("  " + l));
await browser.close();
