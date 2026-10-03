/* Deterministic animation poll: sample cycling text on one page over ~10s.
   Run: node scripts-tmp/anim-poll.mjs [path] */
import puppeteer from "puppeteer";

const path = process.argv[2] || "/student";
const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });

await p.goto(`http://localhost:5175${path}`, { waitUntil: "networkidle2", timeout: 90000 });
await p.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 1000));

const readAll = () => p.evaluate(() => {
  const g = (sel) => document.querySelector(sel)?.textContent.trim() ?? null;
  return {
    struggleWord: g('[data-section="02-struggle"] h2 span:last-child span') || g('[data-section="02-struggle"] h2 span:last-child'),
    struggleQuote: g('[data-section="02-struggle"] figcaption'),
    journeyWord: g('[data-section="04-journey"] h2 .hero-fade-up, [data-section="04-journey"] h2 span'),
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    vis: document.visibilityState,
  };
});

await p.evaluate(() => window.scrollTo(0, 0));
let last = null;
for (let i = 0; i < 22; i++) {
  const s = await readAll();
  const sig = `${s.struggleWord}|${s.struggleQuote}|${s.journeyWord}`;
  if (sig !== last) {
    console.log(`t=${(i * 0.6).toFixed(1)}s  struggle="${s.struggleWord}"  quote="${(s.struggleQuote || "").slice(0, 38)}"  journey="${(s.journeyWord || "").slice(0, 30)}"`);
    last = sig;
  }
  await new Promise((r) => setTimeout(r, 600));
}
console.log("reduced-motion:", (await readAll()).reduced, "| visibility:", (await readAll()).vis, "| errors:", errs.slice(0, 4));
await b.close();
