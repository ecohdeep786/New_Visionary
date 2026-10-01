/* Card contrast sweep: every .g-card must contrast with its section surface.
   Flags cards whose computed background matches the enclosing band. */
import puppeteer from "puppeteer";

const BASE = process.argv[2] || "http://localhost:5199";
const ROUTES = [
  "/", "/student", "/teacher", "/parent", "/professional", "/organization",
  "/how-it-works", "/help", "/about", "/pricing", "/careers", "/research",
  "/community", "/contact", "/partners", "/updates", "/referral",
  "/safety", "/privacy", "/terms", "/security", "/accessibility", "/cookies", "/download",
];
const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  for (const route of ROUTES) {
    try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 4000));
    /* scroll through so lazy sections mount */
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 250));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 800));
    const bad = await page.evaluate(() => {
      const parse = (s) => (s.match(/\d+/g) || [255, 255, 255]).slice(0, 3).map(Number);
      const same = (a, b) => {
        const [r1, g1, b1] = parse(a), [r2, g2, b2] = parse(b);
        return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) < 12;
      };
      const out = [];
      for (const card of document.querySelectorAll(".g-card")) {
        const cs = getComputedStyle(card);
        const r = card.getBoundingClientRect();
        if (r.width === 0) continue;
        let band = card.parentElement;
        let bandBg = "rgba(0, 0, 0, 0)";
        while (band && band !== document.body) {
          const b = getComputedStyle(band).backgroundColor;
          if (b && b !== "rgba(0, 0, 0, 0)") { bandBg = b; break; }
          band = band.parentElement;
        }
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        const effective = bandBg === "rgba(0, 0, 0, 0)" ? bodyBg : bandBg;
        const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopColor !== "rgba(0, 0, 0, 0)";
        if (same(cs.backgroundColor, effective) && !hasBorder) {
          out.push({
            cls: (card.className || "").toString().slice(0, 70),
            bg: cs.backgroundColor, bandBg: effective,
            text: (card.innerText || "").replace(/\s+/g, " ").slice(0, 40),
          });
        }
      }
      return out;
    });
    if (bad.length) {
      console.log(`\n${route}: ${bad.length} contrast failures`);
      bad.forEach((b) => console.log(`   bg=${b.bg} band=${b.bandBg} "${b.text}" :: ${b.cls}`));
    } else console.log(`ok   ${route}`);
    } catch (e) { console.log(`ERR  ${route}: ${e.message.slice(0, 60)}`); }
  }
} finally {
  await browser.close();
}
console.log("\nsweep done");
