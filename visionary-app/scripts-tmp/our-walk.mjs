/* Walk OUR landing sections 02→07 with the same lens as apple-walk:
   per-section padding/background/heading scale + viewport screenshots. */
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
    await new Promise((r) => setTimeout(r, 4500));

    // geometry of every chapter between hero and journey
    const geo = await p.evaluate((names) => {
      const round = (x) => Math.round(x);
      return names.map((name) => {
        const sec = document.querySelector(`[data-section="${name}"]`);
        if (!sec) return { name, missing: true };
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
          padBottom: round(parseFloat(cs.paddingBottom)),
          h2Size: h2 ? round(parseFloat(getComputedStyle(h2).fontSize)) : null,
          h2Color: h2 ? getComputedStyle(h2).color : null,
          kickerSize: kicker ? round(parseFloat(getComputedStyle(kicker).fontSize)) : null,
          kickerColor: kicker ? getComputedStyle(kicker).color : null,
          imgW: img ? round(img.getBoundingClientRect().width) : null,
        };
      });
    }, SECTIONS);
    console.log(vp.name, JSON.stringify(geo, null, 1));

    // per-section viewport screenshots (scroll to each; promise at hold phase)
    for (const name of SECTIONS) {
      await p.evaluate((n) => {
        const sec = document.querySelector(`[data-section="${n}"]`);
        sec.scrollIntoView({ block: "start", behavior: "instant" });
      }, name);
      await new Promise((r) => setTimeout(r, 1800));
      if (name === "03-promise") {
        // hold phase of the 200vh scroll-linked statement
        await p.evaluate(() => {
          const sec = document.querySelector('[data-section="03-promise"]');
          window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.9);
        });
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (name === "06-journey") {
        // the card mid-view
        await p.evaluate(() => {
          const sec = document.querySelector('[data-section="06-journey"]');
          window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.35);
        });
        await new Promise((r) => setTimeout(r, 1200));
      }
      await p.screenshot({ path: `${OUT}/our-${name}-${vp.name}.png` });
    }
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("done");
