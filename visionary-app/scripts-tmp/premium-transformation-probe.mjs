import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0");
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });

const measure = async (url, label) => {
  await page.goto(url, { waitUntil: "networkidle0", timeout: 180000 });
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 2500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1000));
  });
  return page.evaluate(() => {
    const px = (n) => Math.round(n);
    const r = (el) => el ? el.getBoundingClientRect() : null;
    const cs = (el) => el ? getComputedStyle(el) : null;
    const padBlock = (el) => { const c = cs(el); return { pt: px(parseFloat(c.paddingTop)), pb: px(parseFloat(c.paddingBottom)) }; };
    const sections = [...document.querySelectorAll("section, [class*='section-'], [class*='chapter'], .cmp-section, main > div")].map((s) => {
      const cr = r(s); if (!cr || cr.height < 120 || cr.width < 200) return null;
      const hdr = s.querySelector("h1,h2,h3,h4");
      const copies = [...s.querySelectorAll("p, span")].filter((e) => e.textContent.trim());
      const imgs = [...s.querySelectorAll("img,video")];
      return {
        tag: s.tagName.toLowerCase(), cls: String(s.className).split(" ").slice(0,3).join("."),
        h: px(cr.height), top: px(cr.top),
        padBlock: padBlock(s),
        hdrLeft: hdr ? px(r(hdr).left) : null, hdrW: hdr ? px(r(hdr).width) : null, hdrH: hdr ? px(r(hdr).height) : null,
        hdrFs: hdr ? px(parseFloat(cs(hdr).fontSize)) : null, hdrT: hdr ? px(parseFloat(cs(hdr).letterSpacing)*1000)/1000 : null, hdrL: hdr ? px(parseFloat(cs(hdr).lineHeight)) : null,
        imgCount: imgs.length, bgColor: cs(s).backgroundColor,
      };
    }).filter(Boolean);
    // find transformation-like sections (look for long centered statement headlines, or 64-80px headlines)
    const trans = sections.filter((s) => {
      if (!s.hdrFs) return false;
      // Apple's transformation sections: large headline (44+px) OR centered, often minimal
      return s.hdrFs >= 44 || (s.hdrLeft && s.hdrW && s.hdrW > 500 && s.hdrW < 1100);
    });
    return { sections: sections.slice(0, 14), transformationCandidates: trans.slice(0, 6) };
  });
};

for (const [name, url] of [["vision-pro", "https://www.apple.com/apple-vision-pro/"], ["iphone-15-pro-max", "https://www.apple.com/iphone-15-pro-max/"]]) {
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(await measure(url, name), null, 2));
}
await browser.close();
