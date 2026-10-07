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
    for (let y = 0; y < H; y += 2500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1200));
  });
  return page.evaluate(() => {
    const px = (n) => Math.round(n);
    const r = (el) => el ? el.getBoundingClientRect() : null;
    const cs = (el) => el ? getComputedStyle(el) : null;
    // find the closing transformation statement — search for phrases
    const allHdrs = [...document.querySelectorAll("h1,h2,h3,h4")];
    const matches = allHdrs.filter((h) => {
      const t = h.textContent.toLowerCase();
      return t.includes("ready") || t.includes("transform") || t.includes("built for") || t.includes("who you") || t.includes("who become") || t.includes("learning") && (t.includes("changes") || t.includes("transformed") || t.includes("better"));
    });
    return matches.map((h) => {
      const cr = r(h); const c = cs(h);
      const parent = h.closest("section, [class*='section'], [class*='band'], header");
      const pcr = parent ? r(parent) : null;
      const csb = parent ? cs(parent) : null;
      return {
        text: h.textContent.slice(0, 60),
        hdrFs: px(parseFloat(c.fontSize)), hdrT: px(parseFloat(c.letterSpacing)*1000)/1000, hdrL: px(parseFloat(c.lineHeight)),
        hdrW: px(cr.width), hdrLeft: px(cr.left), hdrCentered: c.textAlign === "center",
        parentCls: parent ? String(parent.className).split(" ").slice(0,3).join(".") : null,
        parentW: pcr ? px(pcr.width) : null, parentH: pcr ? px(pcr.height) : null,
        parentPad: pcr ? { pt: px(parseFloat(csb.paddingTop)), pb: px(parseFloat(csb.paddingBottom)) } : null,
      };
    }).slice(0, 4);
  });
};

for (const [name, url] of [["macbook-pro", "https://www.apple.com/macbook-pro-14-and-16/"], ["education-initiative", "https://www.apple.com/in/education-initiative/"]]) {
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(await measure(url, name), null, 2));
}
await browser.close();
