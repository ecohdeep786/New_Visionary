/* Extract Apple's computed type + spacing metrics from live pages. */
import puppeteer from "puppeteer";

const PAGES = [
  ["iphone", "https://www.apple.com/iphone/"],
  ["edu-hub", "https://www.apple.com/education/"],
  ["airpods", "https://www.apple.com/airpods-pro/"],
  ["watch", "https://www.apple.com/watch/"],
];

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
);

for (const [name, url] of PAGES) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 1500));
    const data = await page.evaluate(() => {
      const out = { headings: [], body: [], sections: [], nav: null };
      // headings
      document.querySelectorAll("h1, h2, h3, [class*='headline']").forEach((h) => {
        const t = (h.innerText || "").trim().split("\n")[0];
        if (!t || t.length < 2) return;
        const cs = getComputedStyle(h);
        const size = parseFloat(cs.fontSize);
        if (size < 20) return; // skip small links
        out.headings.push({ t: t.slice(0, 42), size: Math.round(size), w: cs.fontWeight, ls: cs.letterSpacing, lh: cs.lineHeight, fam: cs.fontFamily.split(",")[0].replace(/"/g, "") });
      });
      // body copy samples
      document.querySelectorAll("p, li").forEach((p) => {
        const t = (p.innerText || "").trim();
        if (t.length < 40 || t.length > 300) return;
        const cs = getComputedStyle(p);
        const size = parseFloat(cs.fontSize);
        if (size < 15 || size > 30) return;
        out.body.push({ t: t.slice(0, 50), size: Math.round(size * 10) / 10, lh: Math.round(parseFloat(cs.lineHeight) / size * 100) / 100, color: cs.color });
      });
      // section rhythm: big sectioned wrappers
      document.querySelectorAll("section, .unit-wrapper, [class*='section']").forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.height < 400) return;
        const cs = getComputedStyle(s);
        out.sections.push({ padT: cs.paddingTop, padB: cs.paddingBottom, h: Math.round(r.height), bg: cs.backgroundColor });
      });
      out.nav = (() => {
        const n = document.querySelector("nav") || document.querySelector("header");
        return n ? { h: Math.round(n.getBoundingClientRect().height), bg: getComputedStyle(n).backgroundColor, blur: getComputedStyle(n).backdropFilter } : null;
      })();
      // dedupe + caps
      out.headings = out.headings.slice(0, 24);
      out.body = out.body.slice(0, 14);
      out.sections = out.sections.slice(0, 16);
      return out;
    });
    console.log(`\n===== ${name} =====`);
    console.log("NAV:", JSON.stringify(data.nav));
    console.log("HEADINGS:");
    const seen = new Set();
    data.headings.forEach((h) => { const k = `${h.size}/${h.w}`; if (!seen.has(h.t)) { seen.add(h.t); console.log(`  ${h.size}px w${h.w} ls:${h.ls} lh:${h.lh} ${h.fam} — "${h.t}"`); } });
    console.log("BODY:");
    const bseen = new Set();
    data.body.forEach((b) => { if (!bseen.has(b.t)) { bseen.add(b.t); console.log(`  ${b.size}px lh:${b.lh} ${b.color} — "${b.t}"`); } });
    console.log("SECTIONS (padT/padB/height/bg):");
    data.sections.forEach((s) => console.log(`  ${s.padT} / ${s.padB} / h=${s.h} / ${s.bg}`));
  } catch (e) {
    console.log(`${name} FAILED: ${String(e).slice(0, 120)}`);
  }
}
await browser.close();
