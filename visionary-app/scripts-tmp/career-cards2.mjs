/* Google careers home: systematic card capture + corner-cutout probe. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/career-card-study";
mkdirSync(OUT, { recursive: true });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.setUserAgent(UA);
  await page.goto("https://www.google.com/about/careers/applications/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 6000));
  console.log("URL:", page.url());

  for (const [i, y] of [0, 0.8, 1.6, 2.4, 3.2].entries()) {
    await page.evaluate((yy) => window.scrollTo(0, document.body.scrollHeight * yy / 4), y);
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: `${OUT}/careers-${i}.png` });
  }

  /* cards with a link/button near bottom + full anatomy */
  const data = await page.evaluate(() => {
    const out = { cards: [], cutouts: [] };
    const inEl = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, text: (el.innerText || "").replace(/\s+/g, " ").slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), pos: cs.position, radius: cs.borderRadius, bg: cs.backgroundColor };
    };
    for (const el of Array.from(document.querySelectorAll("article,li,section,div")).slice(0, 4000)) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width < 260 || r.width > 960 || r.height < 160 || r.height > 1000) continue;
      const radius = parseFloat(cs.borderTopLeftRadius) || 0;
      if (radius < 12) continue;
      const hasCta = Array.from(el.querySelectorAll("a,button")).some((b) => {
        const br = b.getBoundingClientRect();
        return br.top > r.bottom - 110 && br.width > 60;
      });
      if (!hasCta) continue;
      out.cards.push({
        w: Math.round(r.width), h: Math.round(r.height),
        bg: cs.backgroundColor, radius: cs.borderTopLeftRadius,
        shadow: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 90),
        border: `${cs.borderTopWidth} ${cs.borderTopColor}`,
        snippet: (el.innerText || "").replace(/\s+/g, " ").slice(0, 50),
        cta: Array.from(el.querySelectorAll("a,button")).map(inEl).slice(0, 2),
      });
      if (out.cards.length >= 10) break;
    }
    /* cutout pattern: absolutely-positioned corner el with only TL radius large (the inverse-corner bite) */
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const cs = getComputedStyle(el);
      if (cs.position !== "absolute") continue;
      const tl = parseFloat(cs.borderTopLeftRadius) || 0;
      const tr = parseFloat(cs.borderTopRightRadius) || 0;
      if (tl >= 10 && tr === 0) {
        const r = el.getBoundingClientRect();
        if (r.width < 320 && r.height < 160) out.cutouts.push(inEl(el));
        if (out.cutouts.length >= 6) break;
      }
    }
    return out;
  });
  data.cards.forEach((c, i) => console.log(`card${i}: ${c.w}x${c.h} bg=${c.bg} radius=${c.radius} shadow=${c.shadow} border=${c.border}\n   "${c.snippet}"\n   cta: ${JSON.stringify(c.cta)}`));
  console.log("cutout-pattern elements:", JSON.stringify(data.cutouts, null, 1));
} finally {
  await browser.close();
}
console.log("done");
