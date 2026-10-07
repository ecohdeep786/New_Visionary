import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await p.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 700) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 80)); }
  window.scrollTo({ top: 0, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 1200));
await p.evaluate(() => {
  const el = document.querySelector('section[data-section="02-problem"]');
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: "instant" });
});
/* wait through a slide rotation to catch the teacher slide */
await new Promise((r) => setTimeout(r, 4600));
await p.screenshot({ path: "scripts-tmp/shots/landing-compact/d-problem-slide2.png" });
console.log("shot slide2");
/* mobile */
const m = await browser.newPage();
await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await m.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await m.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await m.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 700) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 70)); }
  window.scrollTo({ top: 0, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 1100));
await m.evaluate(() => {
  const el = document.querySelector('section[data-section="02-problem"]');
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 1200));
await m.screenshot({ path: "scripts-tmp/shots/landing-compact/m-problem.png" });
console.log("shot mobile");
await browser.close();
