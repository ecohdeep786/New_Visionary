/* Cutout anatomy sweep: every corner cutout must match the surface behind
   its card, and pocket buttons must keep breath (pocket >= button + air). */
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
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 200));
        }
        window.scrollTo(0, 0);
      });
      await new Promise((r) => setTimeout(r, 600));
      const report = await page.evaluate(() => {
        const parse = (s) => (s.match(/\d+/g) || [255, 255, 255, 1]).map(Number);
        const rgbEq = (a, b) => { const x = parse(a), y = parse(b); return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]) < 10; };
        const out = [];
        for (const cut of document.querySelectorAll('div[aria-hidden="true"][class*="rounded-tl"], span[aria-hidden="true"][class*="rounded-tl"]')) {
          const cs = getComputedStyle(cut);
          const r = cut.getBoundingClientRect();
          if (r.width === 0) continue;
          /* the card = nearest positioned ancestor */
          let card = cut.parentElement;
          while (card && getComputedStyle(card).position === "static") card = card.parentElement;
          if (!card) continue;
          /* the band = first ancestor of the card with a non-transparent bg */
          let band = card.parentElement, bandBg = getComputedStyle(document.body).backgroundColor;
          while (band && band !== document.body) {
            const b = getComputedStyle(band).backgroundColor;
            if (b && b !== "rgba(0, 0, 0, 0)") { bandBg = b; break; }
            band = band.parentElement;
          }
          const cardBg = getComputedStyle(card).backgroundColor;
          const cutBg = cs.backgroundColor;
          const colorOk = rgbEq(cutBg, bandBg) || rgbEq(cutBg, cardBg);
          /* pocket breath: any pill button or arrow inside the same card near the cutout */
          const pr = card.getBoundingClientRect();
          const pocket = { w: Math.round(r.width), h: Math.round(r.height) };
          let btn = null;
          for (const el of card.querySelectorAll("a, button, span")) {
            const er = el.getBoundingClientRect();
            if (er.width === 0) continue;
            /* sits in the cutout zone? */
            if (er.right > pr.right - pocket.w - 4 && er.bottom > pr.bottom - pocket.h - 4 && el !== cut && !el.contains(cut)) {
              const ecs = getComputedStyle(el);
              if (ecs.borderRadius.includes("9999") || ecs.borderRadius.includes("px") && parseFloat(ecs.borderTopLeftRadius) > 100) {
                btn = { w: Math.round(er.width), h: Math.round(er.height), text: (el.innerText || "").trim().slice(0, 14) };
              }
            }
          }
          const breath = btn ? (pocket.w - btn.w >= 30 && pocket.h - btn.h >= 20) : true;
          if (!colorOk || !breath) {
            out.push({
              cutBg, bandBg, cardBg: cardBg.slice(0, 30), pocket,
              btn, breath, colorOk,
              text: (card.innerText || "").replace(/\s+/g, " ").slice(0, 44),
            });
          }
        }
        return out;
      });
      if (report.length) {
        console.log(`\n${route}: ${report.length} cutout issues`);
        report.forEach((x) => console.log(`   cut=${x.cutBg} band=${x.bandBg} colorOk=${x.colorOk} pocket=${x.pocket.w}x${x.pocket.h} btn=${x.btn ? x.btn.w + "x" + x.btn.h + ' "' + x.btn.text + '"' : "arrow"} breath=${x.breath} :: "${x.text}"`));
      } else console.log(`ok   ${route}`);
    } catch (e) { console.log(`ERR  ${route}: ${e.message.slice(0, 60)}`); }
  }
} finally { await browser.close(); }
console.log("\ncutout sweep done");
