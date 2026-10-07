import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0");
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
await page.goto("https://www.apple.com/in/education-initiative/", { waitUntil: "networkidle0", timeout: 180000 });
// scroll to load lazy content
await page.evaluate(async () => {
  const H = document.documentElement.scrollHeight;
  for (let y = 0; y < H; y += 2000) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 1500));
});
const m = await page.evaluate(() => {
  const px = (n) => Math.round(n);
  const r = (el) => el ? el.getBoundingClientRect() : null;
  const cs = (el) => el ? getComputedStyle(el) : null;
  // find the highlight cards — Apple uses .tile or grid cards
  const cards = [...document.querySelectorAll('[class*="tile"], [class*="card"], .cmp-columns-item, section > div > div[class*="grid"] > div')].filter((c) => { const b=r(c); return b && b.width>150 && b.height>150; });
  const cardSpecs = cards.slice(0, 4).map((c, i) => {
    const cr = r(c);
    const img = c.querySelector("img, video");
    const hdr = c.querySelector("h1,h2,h3,h4,p");
    const paras = c.querySelectorAll("p");
    const leadP = paras[0];
    const imgR = img ? r(img) : null;
    return {
      i, cls: String(c.className).slice(0,45),
      w: px(cr.width), h: px(cr.height), radius: cs(c).borderRadius,
      bg: cs(c).backgroundColor,
      imgW: imgR ? px(imgR.width) : null, imgH: imgR ? px(imgR.height) : null,
      hdrFs: hdr ? px(parseFloat(cs(hdr).fontSize)) : null, hdrT: hdr ? px(parseFloat(cs(hdr).letterSpacing)*1000)/1000 : null,
      leadFs: leadP ? px(parseFloat(cs(leadP).fontSize)) : null,
      pad: { pl: px(parseFloat(cs(c).paddingLeft)), pr: px(parseFloat(cs(c).paddingRight)), pt: px(parseFloat(cs(c).paddingTop)), pb: px(parseFloat(cs(c).paddingBottom)) },
    };
  });
  // section padding ladder + content frame
  const sections = [...document.querySelectorAll("section")].map((s, i) => {
    const cr = r(s); if (!cr || cr.width < 300 || cr.height < 80) return null;
    const hdr = s.querySelector("h1,h2,h3");
    const paras = [...s.querySelectorAll("p")].filter((p) => p.textContent.trim());
    const firstP = paras[0];
    return {
      i, cls: String(s.className).split(" ").slice(0,2).join("."),
      h: px(cr.height),
      pad: { pt: px(parseFloat(cs(s).paddingTop)), pb: px(parseFloat(cs(s).paddingBottom)) },
      hdrLeft: hdr ? px(r(hdr).left) : null, hdrFs: hdr ? px(parseFloat(cs(hdr).fontSize)) : null,
      copyLeft: firstP ? px(r(firstP).left) : null,
      contentW: px(cr.width),
    };
  }).filter(Boolean);
  // the main content frame (nav + content area)
  const body = document.body;
  return { cards: cardSpecs, sections, bodyW: px(r(body).width) };
});
console.log(JSON.stringify(m, null, 2));
await browser.close();
