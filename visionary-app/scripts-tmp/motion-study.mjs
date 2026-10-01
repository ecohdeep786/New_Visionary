/* Motion study: probe live Apple/Google pages for real motion metrics.
   - transition/animation vocabulary from computed styles
   - scroll-reveal duration + translate distance (rAF sampling)
   - hover transition on a primary CTA
   - reduced-motion behavior (content visible immediately?)
   Usage: node scripts-tmp/motion-study.mjs   (writes scripts-tmp/motion-study/) */
import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "scripts-tmp/motion-study";
mkdirSync(OUT, { recursive: true });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const SITES = [
  ["apple-home", "https://www.apple.com/"],
  ["apple-iphone", "https://www.apple.com/iphone-18-pro/", "https://www.apple.com/iphone-17-pro/"],
  ["apple-visionpro", "https://www.apple.com/apple-vision-pro/"],
  ["workspace", "https://workspace.google.com/"],
  ["edu", "https://edu.google.com/"],
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.setUserAgent(UA);

  for (const [name, url, fallback] of SITES) {
    const log = [];
    const p = (s) => { log.push(s); console.log(`[${name}] ${s}`); };
    try {
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 5000));

      /* 1. Transition + animation vocabulary from computed styles */
      const vocab = await page.evaluate(() => {
        const seen = {};
        const els = Array.from(document.querySelectorAll("a,button,h1,h2,h3,p,li,section,div,img,[class]")).slice(0, 2500);
        for (const el of els) {
          const cs = getComputedStyle(el);
          const dur = (cs.transitionDuration || "").split(",").map(parseFloat).filter((n) => n > 0 && n < 3);
          const prop = (cs.transitionProperty || "").split(",").slice(0, dur.length);
          const ease = (cs.transitionTimingFunction || "").split("),").slice(0, dur.length);
          dur.forEach((d, i) => {
            const key = `${d}s|${(prop[i] || "?").trim()}|${(ease[i] || cs.transitionTimingFunction).trim()}`;
            seen[key] = (seen[key] || 0) + 1;
          });
          if (cs.animationName && cs.animationName !== "none") {
            const key = `ANIM ${cs.animationName}|${cs.animationDuration}|${cs.animationIterationCount}`;
            seen[key] = (seen[key] || 0) + 1;
          }
        }
        return Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 24);
      });
      p("transition/animation vocabulary (top patterns):");
      vocab.forEach(([k, n]) => p(`   ${String(n).padStart(4)}x  ${k}`));

      /* 2. Scroll-reveal probe: find a below-fold heading, scroll it in, sample opacity/transform */
      const probe = await page.evaluate(() => {
        const heads = Array.from(document.querySelectorAll("h2, h3"));
        const target = heads.find((h) => {
          const r = h.getBoundingClientRect();
          return r.top > window.innerHeight * 0.9 && r.height > 0;
        });
        if (!target) return null;
        target.scrollIntoView({ behavior: "instant", block: "center" });
        const cs = getComputedStyle(target);
        return new Promise((resolve) => {
          const samples = [];
          const t0 = performance.now();
          const tick = () => {
            const c = getComputedStyle(target);
            samples.push({ t: performance.now() - t0, opacity: c.opacity, transform: c.transform });
            if (performance.now() - t0 < 1600) requestAnimationFrame(tick);
            else resolve({ tag: target.tagName, text: (target.innerText || "").slice(0, 40), samples });
          };
          requestAnimationFrame(tick);
        });
      });
      if (probe) {
        const s = probe.samples;
        const first = s[0], last = s[s.length - 1];
        const op0 = parseFloat(first.opacity), op1 = parseFloat(last.opacity);
        let revealEnd = s.findIndex((x) => parseFloat(x.opacity) >= Math.min(op1, 0.999));
        const revealMs = revealEnd > 0 ? Math.round(s[revealEnd].t) : 0;
        const ty = (m) => { const v = (m || "").match(/matrix\(.*,\s*(-?[\d.]+)\)/); return v ? parseFloat(v[1]) : 0; };
        const dist = Math.round(Math.abs(ty(first.transform) - ty(last.transform)));
        p(`scroll-reveal: <${probe.tag}> "${probe.text}" -> opacity ${op0}->${op1} in ${revealMs}ms, translateY ${dist}px`);
        /* easing shape: opacity at 25/50/75% of reveal window */
        if (revealMs > 150) {
          [0.25, 0.5, 0.75].forEach((f) => {
            const near = s.reduce((a, b) => (Math.abs(b.t - revealMs * f) < Math.abs(a.t - revealMs * f) ? b : a));
            p(`   ease-shape ${(f * 100) | 0}%: opacity=${near.opacity} t=${Math.round(near.t)}ms`);
          });
        }
      } else p("scroll-reveal: no below-fold heading found (page may be lazy) — retry after scroll");
      if (!probe) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.2));
        await new Promise((r) => setTimeout(r, 2500));
      }

      /* 3. Hover probe on a primary pill/CTA */
      const hover = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('a[class*="rounded-full"], button[class*="rounded-full"]'))
          .find((b) => /learn more|get started|buy|shop|sign/i.test(b.innerText) && b.getBoundingClientRect().width > 80);
        if (!btn) return null;
        const before = getComputedStyle(btn);
        const bg0 = before.backgroundColor, c0 = before.color, d = before.transitionDuration;
        return { text: btn.innerText.slice(0, 24), bg0, c0, d };
      });
      if (hover) {
        const btn = await page.evaluateHandle((t) => {
          return Array.from(document.querySelectorAll('a[class*="rounded-full"], button[class*="rounded-full"]'))
            .find((b) => b.innerText.slice(0, 24) === t);
        }, hover.text);
        await btn.asElement().hover();
        await new Promise((r) => setTimeout(r, 500));
        const after = await page.evaluate((t) => {
          const b = Array.from(document.querySelectorAll('a[class*="rounded-full"], button[class*="rounded-full"]'))
            .find((x) => x.innerText.slice(0, 24) === t);
          const cs = getComputedStyle(b);
          return { bg1: cs.backgroundColor, c1: cs.color, transform: cs.transform };
        }, hover.text);
        p(`hover "${hover.text}": bg ${hover.bg0} -> ${after.bg1}, color ${hover.c0} -> ${after.c1}, transitionDur ${hover.d}, transform ${after.transform}`);
      } else p("hover: no matching pill CTA found");

      /* 4. Reduced-motion behavior: reload with reduce, check content visibility immediately */
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 1200));
      const reduce = await page.evaluate(() => {
        const h = document.querySelector("h1");
        const below = Array.from(document.querySelectorAll("h2, p")).find((el) => el.getBoundingClientRect().top > window.innerHeight);
        return {
          h1: h ? getComputedStyle(h).opacity : "none",
          belowFoldOpacity: below ? getComputedStyle(below).opacity : "n/a",
          h1Anim: h ? getComputedStyle(h).animationName : "none",
        };
      });
      p(`reduce-mode: h1 opacity=${reduce.h1} animation=${reduce.h1Anim}, below-fold opacity=${reduce.belowFoldOpacity}`);
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    } catch (e) {
      p(`SITE ERROR: ${e.message.slice(0, 120)}${fallback ? " (trying fallback)" : ""}`);
      if (fallback) {
        try {
          await page.goto(fallback, { waitUntil: "domcontentloaded", timeout: 45000 });
          await new Promise((r) => setTimeout(r, 4000));
          p(`fallback loaded: ${fallback}`);
        } catch (e2) { p(`fallback failed: ${e2.message.slice(0, 80)}`); }
      }
    }
    writeFileSync(`${OUT}/${name}.txt`, log.join("\n") + "\n");
  }
} finally {
  await browser.close();
}
console.log("done");
