/* Why does the meet band pin at 157 instead of top-[56px]? Measure nav + band. */
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: "new" });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForSelector('[data-section="04-meet"]', { timeout: 30000 });
  // nav at rest
  const nav = await p.evaluate(() => {
    const candidates = [...document.querySelectorAll("header, nav, [class*='sticky'], [class*='fixed']")]
      .filter((el) => el.textContent.includes("Who you are"));
    const el = candidates[0];
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { tag: el.tagName, pos: cs.position, top: cs.top, h: Math.round(r.height), cls: el.className.slice(0, 120) };
  });
  await p.evaluate(() => {
    const rows = document.querySelectorAll('[data-section="04-meet"] [data-step]');
    rows[1].scrollIntoView({ behavior: "instant", block: "center" });
  });
  await new Promise((r) => setTimeout(r, 2000));
  const band = await p.evaluate(() => {
    const b = document.querySelector('[data-section="04-meet"] .glass');
    const cs = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    const navEl = [...document.querySelectorAll("header, nav, [class*='sticky'], [class*='fixed']")]
      .filter((el) => el.textContent.includes("Who you are"))[0];
    return {
      bandTop: Math.round(r.top),
      bandStickyTop: cs.top,
      bandPosition: cs.position,
      navBottom: navEl ? Math.round(navEl.getBoundingClientRect().bottom) : null,
      navVisible: navEl ? getComputedStyle(navEl).visibility : null,
    };
  });
  console.log(JSON.stringify({ nav, band }, null, 1));
  await browser.close();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
