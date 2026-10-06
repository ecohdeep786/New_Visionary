import puppeteer from "puppeteer";

/* Measure Apple premium pages: per-section space, breath, type, layout. */
const PAGES = [
  ["vision-pro", "https://www.apple.com/vision-pro/"],
  ["iphone-pro", "https://www.apple.com/iphone-pro/"],
  ["airpods-pro", "https://www.apple.com/airpods-pro/"],
];

const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 180000 });
try {
  for (const [name, url] of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    } catch { /* some pages are heavy; continue with what loaded */ }
    await new Promise(r => setTimeout(r, 6000));
    // walk to the bottom so lazy content mounts, then back
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 2500));
    const data = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const pick = (el) => {
        const cs = getComputedStyle(el);
        const head = [...el.querySelectorAll("h1,h2,h3,p")].slice(0, 4).map(h => {
          const c = getComputedStyle(h);
          return { tag: h.tagName.toLowerCase(), size: c.fontSize, weight: c.fontWeight, ls: c.letterSpacing, lh: Math.round(parseFloat(c.lineHeight) / parseFloat(c.fontSize) * 100) / 100, color: c.color, text: (h.textContent || "").trim().slice(0, 40) };
        });
        const media = [...el.querySelectorAll("img,video")].map(m => {
          const r = m.getBoundingClientRect();
          return Math.round(r.width / vw * 100);
        });
        return {
          cls: (el.className || "").toString().slice(0, 50),
          padTop: cs.paddingTop, padBottom: cs.paddingBottom,
          bg: cs.backgroundColor,
          h: Math.round(el.getBoundingClientRect().height),
          heads: head, mediaPctVW: media.slice(0, 3),
        };
      };
      // top-level chapters: sections + named divs that occupy real height
      const chapters = [...document.querySelectorAll("main > section, main > div[class*='section'], main section[class*='chapter']")]
        .filter(el => el.getBoundingClientRect().height > 300)
        .slice(0, 14)
        .map(pick);
      // global type ramp: unique heading sizes across the page
      const ramp = {};
      [...document.querySelectorAll("h1,h2,h3,h4,p")].forEach(h => {
        const c = getComputedStyle(h);
        if (parseFloat(c.fontSize) >= 20) {
          const k = `${h.tagName} ${c.fontSize}/${c.fontWeight}`;
          ramp[k] = (ramp[k] || 0) + 1;
        }
      });
      return { vw, chapters, ramp: Object.entries(ramp).sort((a, b) => parseFloat(b[0].split(" ")[1]) - parseFloat(a[0].split(" ")[1])).slice(0, 14) };
    });
    console.log(`\n===== ${name} (${url}) =====`);
    console.log(JSON.stringify(data, null, 1));
    await page.close();
  }
} finally {
  await browser.close();
}
