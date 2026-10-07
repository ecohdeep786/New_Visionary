/* Measures Apple's localnav → chapter alignment on /education/k12/ at 1440:
   pill width/position vs chapter copy width/position, and inter-chapter
   vertical gaps. Grounds the meet-section alignment decisions. */
import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.setUserAgent(UA);
await page.goto("https://www.apple.com/education/k12/", { waitUntil: "load", timeout: 120000 });
await page.evaluate(async () => {
  const H = document.documentElement.scrollHeight;
  for (let y = 0; y < H; y += 1200) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 1500));
const m = await page.evaluate(() => {
  const abs = (el) => { const r = el.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY), w: Math.round(r.width) }; };
  const localnav = document.querySelector('[class*="localnav"] [class*="ac-ln"]') || document.querySelector('[class*="localnav"]');
  const copyBlocks = [...document.querySelectorAll("h2, h3")].filter((h) => h.getBoundingClientRect().width > 300).slice(0, 8).map((h) => ({ t: (h.innerText || "").trim().split("\n")[0].slice(0, 40), ...abs(h) }));
  return { localnav: localnav ? abs(localnav) : null, copyBlocks };
});
console.log(JSON.stringify(m, null, 2));
await browser.close();
