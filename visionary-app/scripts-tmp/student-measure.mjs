import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", protocolTimeout: 180000 });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:4173/student", { waitUntil: "networkidle2", timeout: 90000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 2000));
  const data = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const pick = (el) => {
      const cs = getComputedStyle(el);
      const heads = [...el.querySelectorAll("h1,h2,h3")].slice(0, 3).map(h => {
        const c = getComputedStyle(h);
        return { tag: h.tagName.toLowerCase(), size: c.fontSize, weight: c.fontWeight, lh: Math.round(parseFloat(c.lineHeight) / parseFloat(c.fontSize) * 100) / 100, text: (h.textContent || "").trim().slice(0, 36) };
      });
      return { id: el.dataset.section || "(none)", padT: cs.paddingTop, padB: cs.paddingBottom, bg: cs.backgroundColor, h: Math.round(el.getBoundingClientRect().height), heads };
    };
    const chapters = [...document.querySelectorAll("main > section, main > div")].filter(el => el.querySelector("section[data-section], h2") && el.getBoundingClientRect().height > 250);
    const sections = [...document.querySelectorAll("main section")].filter(el => el.getBoundingClientRect().height > 200).map(pick);
    const ramp = {};
    [...document.querySelectorAll("h1,h2,h3,p")].forEach(h => {
      const c = getComputedStyle(h);
      if (parseFloat(c.fontSize) >= 20) {
        const k = `${h.tagName} ${c.fontSize}/${c.fontWeight}`;
        ramp[k] = (ramp[k] || 0) + 1;
      }
    });
    return { vw, sections, ramp: Object.entries(ramp).sort((a, b) => parseFloat(b[0].split(" ")[1]) - parseFloat(a[0].split(" ")[1])).slice(0, 16) };
  });
  console.log(JSON.stringify(data, null, 1));
} finally {
  await browser.close();
}
