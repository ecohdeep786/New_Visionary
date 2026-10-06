import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
const page = await browser.newPage();
await page.setUserAgent(UA);

const measure = async (url) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 1200));
  // scroll full height
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 1500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 800));
  return page.evaluate(() => {
    // major sections: section.role === region, or .section-large, or full-width band divs
    const bands = [...document.querySelectorAll("section, div[class*='section']")];
    const rows = [];
    let prevBottom = 0;
    bands.forEach((b, i) => {
      const r = b.getBoundingClientRect();
      if (r.width < 120 || r.height < 40) return;
      const top = Math.round(r.top + window.scrollY);
      const bottom = Math.round(r.bottom + window.scrollY);
      const tag = b.tagName.toLowerCase();
      const cls = b.className ? String(b.className).slice(0, 40) : "";
      rows.push({ i, tag, cls: cls.replace(/\s+/g, "."), h: Math.round(r.height), top, bottom });
    });
    // localnav
    const ln = document.querySelector('[class*="localnav"]') || [...document.querySelectorAll("nav")].find((n) => n.getBoundingClientRect().height < 120);
    const lnRect = ln ? ln.getBoundingClientRect() : null;
    const headline = [...document.querySelectorAll("h1,h2")]
      .map((h) => ({ t: (h.innerText || "").trim().split("\n")[0].slice(0, 30), left: Math.round(h.getBoundingClientRect().left), w: Math.round(h.getBoundingClientRect().width) }))
      .filter((h) => h.w > 120 && h.left > 0).slice(0, 6);
    return { ln: lnRect ? { h: Math.round(lnRect.height), w: Math.round(lnRect.width), left: Math.round(lnRect.left) } : null, headline, bands: rows.slice(0, 10) };
  });
};

console.log("=== AIRPODS PRO ===");
console.log(JSON.stringify(await measure("https://www.apple.com/airpods-pro/"), null, 2));
console.log("=== IPHONE 15 PRO MAX ===");
console.log(JSON.stringify(await measure("https://www.apple.com/iphone-15-pro-max/"), null, 2));
await browser.close();
