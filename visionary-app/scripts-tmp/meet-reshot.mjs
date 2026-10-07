import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900 });
/* real-user media for the animation work */
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });

/* walk the page first so every lazy image loads and layout settles */
await p.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 700) {
    window.scrollTo({ top: y, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo({ top: 0, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 1200));

await p.evaluate(() => {
  const rows = document.querySelectorAll('section[data-section="04-meet"] [data-step]');
  rows[2]?.scrollIntoView({ behavior: "instant", block: "center" });
});
await new Promise((r) => setTimeout(r, 1100));
await p.screenshot({ path: "scripts-tmp/shots/landing-choreo/d-05b-meet-settled.png" });
const info = await p.evaluate(() => {
  const img = document.querySelectorAll('section[data-section="04-meet"] [data-step] img')[2];
  const r = img.getBoundingClientRect();
  return { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), complete: img.complete, natW: img.naturalWidth };
});
console.log("parent img:", JSON.stringify(info));
await browser.close();
