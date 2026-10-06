/* Walk OUR landing sections 02→07 — v2: pre-scroll the full page first so
   lazy content loads and layout settles, THEN measure + screenshot. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/shots/our-walk";
mkdirSync(OUT, { recursive: true });
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900, dsf: 1 },
  { name: "390", width: 390, height: 844, dsf: 2, mobile: true },
];
const SECTIONS = ["02-problem", "03-promise", "04-meet", "07-language", "06-journey"];

const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const vp of VIEWPORTS) {
    const p = await browser.newPage();
    await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForSelector('[data-section="06-journey"]', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3500));

    // pre-scroll the whole page so every lazy image loads; wait for decode
    await p.evaluate(() => new Promise((resolve) => {
      let y = 0;
      const step = () => {
        y += Math.round(window.innerHeight * 0.8);
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight + window.innerHeight) setTimeout(step, 180);
        else setTimeout(resolve, 600);
      };
      step();
    }));
    await p.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 1500));

    const geo = await p.evaluate((names) => {
      const round = (x) => Math.round(x);
      return names.map((name) => {
        const sec = document.querySelector(`[data-section="${name}"]`);
        const r = sec.getBoundingClientRect();
        const cs = getComputedStyle(sec);
        const h2 = sec.querySelector("h2");
        const kicker = sec.querySelector("p");
        const img = sec.querySelector("img");
        return {
          name,
          absTop: round(r.top + window.scrollY),
          h: round(r.height),
          bg: cs.backgroundColor,
          padTop: round(parseFloat(cs.paddingTop)),
          h2Size: h2 ? round(parseFloat(getComputedStyle(h2).fontSize)) : null,
          imgW: img ? round(img.getBoundingClientRect().width) : null,
        };
      });
    }, SECTIONS);
    console.log(vp.name, JSON.stringify(geo));

    for (const name of SECTIONS) {
      await p.evaluate((n) => {
        document.querySelector(`[data-section="${n}"]`).scrollIntoView({ block: "start", behavior: "instant" });
      }, name);
      await new Promise((r) => setTimeout(r, 1500));
      if (name === "03-promise") {
        await p.evaluate(() => {
          const sec = document.querySelector('[data-section="03-promise"]');
          window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.9);
        });
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (name === "06-journey") {
        await p.evaluate(() => {
          const sec = document.querySelector('[data-section="06-journey"]');
          window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.3);
        });
        await new Promise((r) => setTimeout(r, 1000));
      }
      await p.screenshot({ path: `${OUT}/our-${name}-${vp.name}.png` });
    }
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("done");
