import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await p.evaluate(() => {
  const el = document.querySelector('section[data-section="02-problem"]');
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: top - 40, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 950));
await p.screenshot({ path: "scripts-tmp/shots/landing-choreo/d-02b-problem-settled.png" });
console.log("ok");
await browser.close();
