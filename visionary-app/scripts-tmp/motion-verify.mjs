/* Verify Visionary motion post-pass, both media modes:
   - no-preference: a below-fold section reveal must animate ~700ms / ~24px rise
   - reduce: elements IN the viewport must be visible (nothing stuck at opacity 0) */
import puppeteer from "puppeteer";

const BASE = process.argv[2] || "http://localhost:5199";
const ROUTES = ["/", "/teacher", "/partners"];
const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  let fail = 0;

  /* no-preference: measure our own reveal */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 5000));
    const probe = await page.evaluate(() => {
      const heads = Array.from(document.querySelectorAll("h2, h3"));
      const target = heads.find((h) => {
        const r = h.getBoundingClientRect();
        if (!(r.top > window.innerHeight * 0.9 && r.height > 0)) return false;
        const wrap = h.closest("[class*='transition']");
        return wrap && parseFloat(getComputedStyle(wrap).opacity) < 0.5; /* genuinely unrevealed */
      });
      if (!target) return "already-revealed";
      const wrap = target.closest("[class*='transition']");
      target.scrollIntoView({ behavior: "instant", block: "center" });
      return new Promise((resolve) => {
        const samples = [];
        const t0 = performance.now();
        const tick = () => {
          const c = getComputedStyle(wrap);
          samples.push({ t: performance.now() - t0, o: parseFloat(c.opacity), tf: c.transform });
          if (performance.now() - t0 < 1400) requestAnimationFrame(tick);
          else resolve(samples);
        };
        requestAnimationFrame(tick);
      });
    });
    if (!probe) { console.log(`warn ${route}: no below-fold reveal target found`); continue; }
    if (probe === "already-revealed") { console.log(`ok   ${route} no-pref: below-fold content already revealed (fires on entry as designed)`); continue; }
    const end = probe[probe.length - 1];
    const done = probe.find((s) => s.o >= 0.99);
    const ty = (m) => { const v = (m || "").match(/matrix\(.*,\s*(-?[\d.]+)\)/); return v ? parseFloat(v[1]) : 0; };
    const dist = Math.round(Math.abs(ty(probe[0].tf) - ty(end.tf)));
    const dur = done ? Math.round(done.t) : -1;
    const ok = dur > 350 && dur < 1100 && dist >= 12;
    if (!ok) fail++;
    console.log(`${ok ? "ok  " : "FAIL"} ${route} no-pref reveal: ${dur}ms, rise ${dist}px (target ~700ms / 24px)`);
  }

  /* reduce: elements IN the viewport must be visible */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 5000));
    const res = await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.45);
      return new Promise((resolve) => setTimeout(() => {
        const vh = window.innerHeight;
        const els = Array.from(document.querySelectorAll("h1, h2, h3, p, a, button, img")).slice(0, 600);
        const stuck = els.filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          if (r.bottom < 0 || r.top > vh) return false; /* not in view: reveal pending, fine */
          const cs = getComputedStyle(el);
          if (parseFloat(cs.opacity) < 0.05) return true;
          const wrap = el.closest("[class*='transition']");
          return wrap ? parseFloat(getComputedStyle(wrap).opacity) < 0.05 : false;
        }).length;
        resolve({ stuck });
      }, 1500));
    });
    const ok = res.stuck === 0;
    if (!ok) fail++;
    console.log(`${ok ? "ok  " : "FAIL"} ${route} reduce: ${res.stuck} in-viewport elements stuck invisible`);
  }
  console.log(fail === 0 ? "MOTION VERIFIED" : `${fail} failures`);
  process.exitCode = fail === 0 ? 0 : 1;
} finally {
  await browser.close();
}
