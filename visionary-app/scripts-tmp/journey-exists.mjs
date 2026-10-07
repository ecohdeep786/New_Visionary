import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0", timeout: 120000 });
await new Promise((r) => setTimeout(r, 3000));
const m = await page.evaluate(() => {
  const j = document.querySelector('[data-section="06-journey"]');
  const all = [...document.querySelectorAll("[data-section]")].map((s) => s.getAttribute("data-section"));
  const html = j ? j.innerHTML.slice(0,200) : null;
  const vh = [...document.querySelectorAll("[data-section] h2")].map((h) => h.textContent.trim().slice(0,30));
  return { found: !!j, allSections: all, journeyHtml: html, allH2s: vh };
});
console.log(JSON.stringify(m, null, 2));
await browser.close();
