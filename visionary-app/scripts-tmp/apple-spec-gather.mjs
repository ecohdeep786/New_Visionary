import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });

const measure = async (url) => {
  await page.goto(url, { waitUntil: "networkidle0", timeout: 180000 });
  // scroll to bottom to load lazy sections, then back to top
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 2000) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 1500));
  return page.evaluate(() => {
    const px = (n) => Math.round(n);
    const r = (el) => el ? el.getBoundingClientRect() : null;
    const cs = (el) => el ? getComputedStyle(el) : null;
    const padBlock = (el) => { const c = cs(el); return { pt: px(parseFloat(c.paddingTop)), pb: px(parseFloat(c.paddingBottom)) }; };
    // Major sections — Apple uses <section class="section ...">
    const sections = [...document.querySelectorAll('section[class*="section-"]')].map((s, i) => {
      const cr = r(s); if (!cr || cr.height < 60) return null;
      const hdr = s.querySelector("h1,h2,h3");
      const copy = s.querySelector("p");
      const media = s.querySelector("img,video");
      const ln = s.closest('[class*="localnav"], nav');
      return {
        i, cls: String(s.className).split(" ").slice(0,2).join(" "),
        h: px(cr.height), top: px(cr.top + window.scrollY),
        padBlock: padBlock(s),
        hLeft: hdr ? px(r(hdr).left) : null, hW: hdr ? px(r(hdr).width) : null,
        hFs: hdr ? px(parseFloat(cs(hdr).fontSize)) : null, hT: hdr ? px(parseFloat(cs(hdr).letterSpacing)*1000)/1000 : null,
        copyLeft: copy ? px(r(copy).left) : null, copyW: copy ? px(r(copy).width) : null,
        copyFs: copy ? px(parseFloat(cs(copy).fontSize)) : null,
        copyToMediaGap: hdr && media ? px(r(media).left - (r(copy).right || r(hdr).right)) : null,
      };
    }).filter(Boolean);
    // localnav strip
    const ln = document.querySelector('[class*="ac-ln"], [class*="localnav"]') || [...document.querySelectorAll("nav")].find((n) => { const b = r(n); return b && b.height < 120 && b.width > 300; });
    const lnRect = ln ? r(ln) : null;
    const lnTop = ln ? sections.find((s) => { const lb = s.top + s.padBlock.pt; return Math.abs(lb - (r(ln).top + window.scrollY)) < 120; }) : null;
    return { sections, localnav: lnRect ? { h: px(lnRect.height), w: px(lnRect.width), left: px(lnRect.left) } : null };
  });
};

for (const [name, url] of [["airpods-pro", "https://www.apple.com/airpods-pro/"], ["iphone-15-pro-max", "https://www.apple.com/iphone-15-pro-max/"]]) {
  console.log(`=== ${name} @1440 ===`);
  console.log(JSON.stringify(await measure(url), null, 2));
}
await browser.close();
