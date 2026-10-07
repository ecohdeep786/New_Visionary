import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errs.push(`console: ${String(m.text()).slice(0, 200)}`); });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3500));
const info = await page.evaluate(() => ({
  href: location.href,
  title: document.title,
  hasMain: !!document.querySelector("main"),
  mainKids: document.querySelector("main") ? document.querySelector("main").children.length : 0,
  bodyText: (document.body.innerText || "").slice(0, 300),
}));
console.log(JSON.stringify(info, null, 2));
console.log("errors:", errs.slice(0, 6));
await browser.close();
