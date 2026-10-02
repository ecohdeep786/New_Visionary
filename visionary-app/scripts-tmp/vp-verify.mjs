/**
 * Final combined verification: scrub sequences on all five pages, dot-jump
 * accuracy, hero parallax travel, and visual screenshots.
 */
import puppeteer from "puppeteer";
import fs from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "scripts-tmp/scroll-verify";
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { route: "/student", name: "student" },
  { route: "/teacher", name: "teacher" },
  { route: "/parent", name: "parent" },
  { route: "/professional", name: "professional" },
  { route: "/organization", name: "organization" },
];

const browser = await puppeteer.launch({ headless: "new" });
const summary = [];

for (const { route, name } of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 800));

  /* Scrub word counts across each section's visible lifetime */
  const counts = await page.evaluate(async () => {
    const res = {};
    for (const id of ["04-journey", "06-closing", "07-language", "10-journey-flow"]) {
      const s = document.querySelector(`section[data-section="${id}"]`);
      if (!s) { res[id] = "missing"; continue; }
      const cs = getComputedStyle(s);
      const ty = cs.transform && cs.transform !== "none" ? new DOMMatrix(cs.transform).m42 : 0;
      const naturalTop = s.getBoundingClientRect().top + window.scrollY - ty;
      const h = s.getBoundingClientRect().height;
      const seen = new Set();
      for (let y = naturalTop - 900; y <= naturalTop + h + 50; y += 130) {
        window.scrollTo(0, Math.max(0, y));
        await new Promise((r) => setTimeout(r, 170));
        const el = id === "10-journey-flow" ? null : s.querySelector("span.hero-fade-up");
        const t = el
          ? el.textContent.trim()
          : Array.from(s.querySelectorAll("span"))
              .map((c) => c.textContent.trim())
              .filter((x) => x.length > 6)
              .slice(0, 2)
              .join("|");
        if (t) seen.add(t);
      }
      res[id] = seen.size;
    }
    return res;
  });

  /* Stage: dot jump accuracy (settle fully before measuring) */
  const dotJump = await page.evaluate(async () => {
    const section = document.querySelector('section[data-section="02-struggle"]');
    const dots = Array.from(section.querySelectorAll('[role="group"] button'));
    const before = window.scrollY;
    dots[dots.length - 1]?.click();
    await new Promise((r) => setTimeout(r, 1600));
    const after = window.scrollY;
    const active = dots.findIndex((d) => d.getAttribute("aria-pressed") === "true");
    return { moved: Math.round(after - before), active };
  });

  /* Hero parallax: img transform at rest vs scrolled */
  const parallax = await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
    const img = document.querySelector("main > section:first-child img");
    const t0 = getComputedStyle(img).transform;
    window.scrollTo(0, 600);
    await new Promise((r) => setTimeout(r, 600));
    const t1 = getComputedStyle(img).transform;
    return { atRest: t0, scrolled: t1 };
  });

  /* Screenshot: stage mid-pin */
  const stageMid = await page.evaluate(() => {
    const s = document.querySelector('section[data-section="02-struggle"]');
    const cs = getComputedStyle(s);
    const ty = cs.transform && cs.transform !== "none" ? new DOMMatrix(cs.transform).m42 : 0;
    return s.getBoundingClientRect().top + window.scrollY - ty + s.getBoundingClientRect().height * 0.5;
  });
  await page.evaluate((y) => window.scrollTo(0, y), stageMid);
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `${OUT}/${name}-stage.png` });

  summary.push({ route, counts, dotJump, parallax, errors });
  await page.close();
}

/* Mobile + reduced-motion shot on student */
const m = await browser.newPage();
await m.setViewport({ width: 390, height: 844 });
await m.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await m.goto(BASE + "/student", { waitUntil: "networkidle2", timeout: 45000 });
await new Promise((r) => setTimeout(r, 900));
const stacked = await m.evaluate(() => {
  const s = document.querySelector('section[data-section="02-struggle"]');
  const sticky = Array.from(s.querySelectorAll("div")).find((d) => getComputedStyle(d).position === "sticky");
  return { sticky: !!sticky, clusters: s.querySelectorAll("figure").length };
});
await m.evaluate(() => {
  const s = document.querySelector('section[data-section="02-struggle"]');
  window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 200);
});
await new Promise((r) => setTimeout(r, 600));
await m.screenshot({ path: `${OUT}/mobile-reduced-struggle.png` });
await browser.close();

fs.writeFileSync(`${OUT}/final-report.json`, JSON.stringify({ summary, stacked }, null, 2));
for (const s of summary) {
  console.log(`\n${s.route}  scrubCounts=${JSON.stringify(s.counts)}  dotJump=${JSON.stringify(s.dotJump)}  parallax=${JSON.stringify(s.parallax)}`);
  if (s.errors.length) console.log("  ERRORS:", s.errors.join(" | "));
}
console.log("\nmobile-reduced:", JSON.stringify(stacked));
