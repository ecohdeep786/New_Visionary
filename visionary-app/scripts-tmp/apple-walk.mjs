/* Walk Apple product pages and measure their design/layout/space patterns:
   section rhythm (padding/background), heading scale, copy widths, media
   staging, gallery card sizes. Screenshots at key scroll depths for visual
   reference. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/shots/apple-walk";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { slug: "iphone", url: "https://www.apple.com/iphone-18-pro/" },
  { slug: "visionpro", url: "https://www.apple.com/vision-pro/" },
  { slug: "airpods", url: "https://www.apple.com/airpods-pro/" },
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const pg of PAGES) {
    const p = await browser.newPage();
    await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await p.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );
    try {
      await p.goto(pg.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    } catch (e) {
      console.log(pg.slug, "GOTO FAIL:", e.message.split("\n")[0]);
      await p.close();
      continue;
    }
    await new Promise((r) => setTimeout(r, 4000));
    // scroll through the page to trigger lazy content, then back to top
    const pageHeight = await p.evaluate(
      () => new Promise((resolve) => {
        let y = 0;
        const step = () => {
          y += 900;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight + 900) setTimeout(step, 250);
          else { window.scrollTo(0, 0); setTimeout(() => resolve(document.body.scrollHeight), 800); }
        };
        step();
      })
    );
    await new Promise((r) => setTimeout(r, 1500));

    const report = await p.evaluate(() => {
      const round = (x) => Math.round(x);
      const sections = [...document.querySelectorAll("main section, main > div[class*='section'], main > .unit-wrapper > section")];
      const heads = [...document.querySelectorAll("main h1, main h2, main h3")];
      const secs = sections.slice(0, 40).map((s) => {
        const r = s.getBoundingClientRect();
        const cs = getComputedStyle(s);
        const head = s.querySelector("h1,h2,h3");
        return {
          cls: (s.className || "").toString().slice(0, 50),
          bg: cs.backgroundColor,
          padTop: round(parseFloat(cs.paddingTop)),
          padBottom: round(parseFloat(cs.paddingBottom)),
          h: round(r.height),
          headText: head ? head.textContent.trim().replace(/\s+/g, " ").slice(0, 44) : null,
          headSize: head ? round(parseFloat(getComputedStyle(head).fontSize)) : null,
          headWeight: head ? getComputedStyle(head).fontWeight : null,
          headAlign: head ? getComputedStyle(head).textAlign : null,
          headColor: head ? getComputedStyle(head).color : null,
        };
      });
      // dedupe consecutive same-size rows into a compact rhythm map
      const rhythm = secs.filter((s) => s.h > 200);
      // copy measures: the widest text paragraphs
      const paras = [...document.querySelectorAll("main p")];
      const cap = paras
        .filter((el) => el.textContent.trim().length > 60 && el.getBoundingClientRect().width < 900)
        .slice(0, 12)
        .map((el) => ({ size: round(parseFloat(getComputedStyle(el).fontSize)), w: round(el.getBoundingClientRect().width) }));
      // gallery cards: any flex children inside a horizontal scroller
      const scrollers = [...document.querySelectorAll("main ul, main div")]
        .filter((el) => el.scrollWidth > el.clientWidth + 40 && el.clientWidth > 500)
        .slice(0, 5);
      const cards = scrollers.map((sc) => {
        const kid = sc.children[0];
        return kid ? { childW: round(kid.getBoundingClientRect().width), vw: window.innerWidth, gap: round(kid.getBoundingClientRect().left - sc.getBoundingClientRect().left) } : null;
      });
      return { height: round(document.body.scrollHeight), sections: rhythm, captionSizes: cap, scrollers: cards };
    });
    console.log("=== " + pg.slug + " ===");
    console.log(JSON.stringify(report, null, 1));

    // reference screenshots: top, an early chapter, a gallery area
    for (const [name, y] of [["top", 0], ["mid", Math.min(2600, pageHeight - 900)], ["deep", Math.min(5200, pageHeight - 900)]]) {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await new Promise((r) => setTimeout(r, 1200));
      await p.screenshot({ path: `${OUT}/${pg.slug}-${name}.png` });
    }
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("done");
