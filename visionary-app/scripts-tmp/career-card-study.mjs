/* Study Google careers page card anatomy: shadows, borders, radius,
   corner curve treatment, and link/button placement. Saves screenshots. */
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
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  const urls = [
    ["careers-home", "https://about.google/"],
    ["careers-jobs", "https://www.google.com/about/careers/applications/jobs/results/"],
  ];
  for (const [name, url] of urls) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 6000));
      console.log(`\n===== ${name}: ${url} -> ${page.url()} =====`);

      /* full page top screenshot */
      await page.screenshot({ path: `${OUT}/${name}-top.png` });
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
      await new Promise((r) => setTimeout(r, 2500));
      await page.screenshot({ path: `${OUT}/${name}-mid.png` });

      /* extract card anatomy: any element that looks like a card (radius + surface) */
      const cards = await page.evaluate(() => {
        const out = [];
        const els = Array.from(document.querySelectorAll("div,section,article,li"));
        for (const el of els) {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (r.width < 220 || r.width > 900 || r.height < 140 || r.height > 900) continue;
          const radius = parseFloat(cs.borderTopLeftRadius) || 0;
          if (radius < 8) continue;
          const hasSurface = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== "none";
          if (!hasSurface) continue;
          /* must contain a heading to be a content card, not a wrapper */
          if (!el.querySelector("h1,h2,h3,h4,strong,b")) continue;
          out.push({
            w: Math.round(r.width), h: Math.round(r.height),
            bg: cs.backgroundColor,
            border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
            radiusTL: cs.borderTopLeftRadius, radiusBR: cs.borderBottomRightRadius,
            shadow: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 120),
            snippet: (el.innerText || "").replace(/\s+/g, " ").slice(0, 60),
          });
          if (out.length >= 14) break;
        }
        return out;
      });
      cards.forEach((c, i) => console.log(`card${i}: ${c.w}x${c.h} bg=${c.bg} border="${c.border}" rTL=${c.radiusTL} rBR=${c.radiusBR}\n        shadow=${c.shadow}\n        text="${c.snippet}"`));

      /* look for corner-curve / cutout pattern: an absolutely-positioned element
         at a corner of a parent card, plus links/buttons near card bottoms */
      const corners = await page.evaluate(() => {
        const out = [];
        for (const el of Array.from(document.querySelectorAll("a,button,div"))) {
          const cs = getComputedStyle(el);
          if (cs.position !== "absolute") continue;
          const p = el.parentElement ? getComputedStyle(el.parentElement) : null;
          if (!p || p.position !== "relative") continue;
          const r = el.getBoundingClientRect();
          const pr = el.parentElement.getBoundingClientRect();
          const atBR = r.right > pr.right - 120 && r.bottom > pr.bottom - 120;
          if (atBR && r.width > 30 && r.width < 300 && r.height > 30 && r.height < 120) {
            out.push({
              tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height),
              radius: cs.borderRadius, bg: cs.backgroundColor,
              parentRadius: p.borderBottomRightRadius,
              text: (el.innerText || "").replace(/\s+/g, " ").slice(0, 40),
            });
          }
          if (out.length >= 8) break;
        }
        return out;
      });
      if (corners.length) {
        console.log("corner-anchored elements (possible curve/cutout):");
        corners.forEach((c, i) => console.log(`  corner${i}: <${c.tag}> ${c.w}x${c.h} radius=${c.radius} bg=${c.bg} parentBRradius=${c.parentRadius} text="${c.text}"`));
      } else console.log("corner-anchored elements: none found");
    } catch (e) {
      console.log(`${name} ERROR: ${e.message.slice(0, 140)}`);
    }
  }
} finally {
  await browser.close();
}
console.log("\ndone");
