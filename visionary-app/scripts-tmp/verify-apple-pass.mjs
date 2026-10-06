/* Verify the Apple-match pass: chapter padding 144, statement tier 56, and
   the problem section's ONE-VIEWPORT law intact at the three critical sizes. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/shots/our-walk";
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const vp of [
    { name: "1440x900", width: 1440, height: 900 },
    { name: "1366x768", width: 1366, height: 768 },
    { name: "390x844", width: 390, height: 844, mobile: true },
  ]) {
    const p = await browser.newPage();
    await p.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.mobile ? 2 : 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForSelector('[data-section="06-journey"]', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3500));
    await p.evaluate(() => new Promise((resolve) => {
      let y = 0;
      const step = () => {
        y += Math.round(window.innerHeight * 0.8);
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight + window.innerHeight) setTimeout(step, 160);
        else setTimeout(resolve, 500);
      };
      step();
    }));
    await p.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 1200));

    const geo = await p.evaluate(() => {
      const round = (x) => Math.round(x);
      const out = {};
      const sec = (n) => document.querySelector(`[data-section="${n}"]`);
      const probe = (n) => {
        const s = sec(n);
        const cs = getComputedStyle(s);
        const h2 = s.querySelector("h2");
        return { padTop: round(parseFloat(cs.paddingTop)), h: round(s.getBoundingClientRect().height), h2: h2 ? round(parseFloat(getComputedStyle(h2).fontSize)) : null };
      };
      out.problem = probe("02-problem");
      out.meet = probe("04-meet");
      out.language = probe("07-language");
      out.journey = probe("06-journey");
      // one-viewport law: at problem-section top, the quote + dots must sit
      // inside the first viewport
      const prob = sec("02-problem");
      prob.scrollIntoView({ block: "start", behavior: "instant" });
      const pr = prob.getBoundingClientRect();
      const dots = prob.querySelector(".mt-6.flex, [class*='CarouselDots']") || prob.lastElementChild;
      const quote = [...prob.querySelectorAll("p")].find((el) => el.textContent.includes("still") || el.textContent.includes("report card"));
      out.oneViewport = {
        viewportH: window.innerHeight,
        secTop: round(pr.top),
        quoteBottom: quote ? round(quote.getBoundingClientRect().bottom) : null,
        sectionBottom: round(pr.bottom),
        fits: quote ? quote.getBoundingClientRect().bottom <= window.innerHeight : null,
      };
      return out;
    });
    console.log(vp.name, JSON.stringify(geo));
    await p.evaluate(() => document.querySelector('[data-section="02-problem"]').scrollIntoView({ block: "start", behavior: "instant" }));
    await new Promise((r) => setTimeout(r, 1500));
    await p.screenshot({ path: `${OUT}/verify-problem-${vp.name}.png` });
    await p.close();
  }
} finally {
  await browser.close();
}
console.log("done");
