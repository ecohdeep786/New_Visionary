import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await page.goto("http://localhost:5173/student", { waitUntil: "networkidle2", timeout: 45000 });
await new Promise((r) => setTimeout(r, 800));

const out = await page.evaluate(async () => {
  const res = {};
  const sweep = async (id) => {
    const s = document.querySelector(`section[data-section="${id}"]`);
    // natural top from a fresh page state: rect.top + scrollY - current translate
    const cs = getComputedStyle(s);
    const ty = cs.transform && cs.transform !== "none" ? new DOMMatrix(cs.transform).m42 : 0;
    const naturalTop = s.getBoundingClientRect().top + window.scrollY - ty;
    const h = s.getBoundingClientRect().height;
    const words = [];
    let last = null;
    for (let y = naturalTop - 900; y <= naturalTop + h + 50; y += 120) {
      window.scrollTo(0, Math.max(0, y));
      await new Promise((r) => setTimeout(r, 260));
      const w = s.querySelector("span.hero-fade-up")?.textContent.trim().slice(0, 24);
      if (w && w !== last) {
        words.push(`${w} @y=${Math.round(y)}`);
        last = w;
      }
    }
    return words;
  };
  res.journey = await sweep("04-journey");
  res.closing = await sweep("06-closing");
  res.language = await sweep("07-language");
  res.flow = await sweep("10-journey-flow");
  return res;
});
await browser.close();
for (const [k, v] of Object.entries(out)) console.log(`\n${k}: ${v.length} distinct words\n  ${v.join("\n  ")}`);
