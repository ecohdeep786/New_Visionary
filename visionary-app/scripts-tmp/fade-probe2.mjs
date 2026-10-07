import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });

/* fresh observer, same margins, on both a tall (problem) and short (promise) section */
await p.evaluate(() => {
  window.__ioLog = [];
  const mk = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => window.__ioLog.push({ sel, t: Math.round(performance.now()), isI: entries[0].isIntersecting, ratio: entries[0].intersectionRatio.toFixed(2) }),
      { threshold: 0, rootMargin: "-40% 0px -10% 0px" }
    );
    io.observe(el);
  };
  mk('section[data-section="02-problem"]');
  mk('section[data-section="03-promise"]');
});

await p.evaluate(() => {
  const el = document.querySelector('section[data-section="02-problem"]');
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 600));

await p.evaluate(() => {
  const el = document.querySelector('section[data-section="02-problem"]');
  const bottom = el.getBoundingClientRect().bottom + window.scrollY;
  window.scrollTo({ top: bottom - 260, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 600));

const log = await p.evaluate(() => window.__ioLog);
console.log(JSON.stringify(log, null, 1));
await browser.close();
