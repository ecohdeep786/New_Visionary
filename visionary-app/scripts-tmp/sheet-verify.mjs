/* Sheet-stack verification v2 (transform-driven pinning via useSheetStack):
   statics (isolate/opaque/rounded), pin behavior (previous sheet frozen with
   bottom at viewport bottom + top above viewport while the next overlaps),
   hero frozen at top, reduced-motion = no transforms. */
import puppeteer from "puppeteer";

const BASE = process.argv[2] || "http://localhost:5199";
const PAGES = ["/student", "/teacher", "/parent", "/professional", "/organization"];
const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  let fail = 0;

  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  for (const route of PAGES) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForSelector('[data-section]', { timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
    const res = await page.evaluate(() => {
      const secs = Array.from(document.querySelectorAll("[data-section]"));
      const notIsolated = secs.filter((s) => !/isolate/.test(s.className.toString())).length;
      const opaque = secs.filter((s) => getComputedStyle(s).backgroundColor === "rgba(0, 0, 0, 0)").length;
      const rounded = secs.filter((s) => s.dataset.section !== "01-hero" && !getComputedStyle(s).borderTopLeftRadius.includes("32")).length;
      return { total: secs.length, notIsolated, opaque, rounded };
    });
    const ok = res.notIsolated === 0 && res.opaque === 0 && res.rounded === 0;
    if (!ok) fail++;
    console.log(`${ok ? "ok  " : "FAIL"} ${route}: ${res.total} sheets, not-isolated=${res.notIsolated}, transparent=${res.opaque}, unrounded=${res.rounded}`);
  }

  /* behavior proof on /student at the continuity -> achievement transition.
     Instant scrolling (the page's global smooth scroll would race the probe).
     "Pinned" = the covered sheet's rect is UNCHANGED while the next sheet
     moves; that is the honest test of the page-over-page mechanic. */
  await page.goto(BASE + "/student", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector('[data-section="09-achievement"]', { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
  const proof = await page.evaluate(() => {
    const vh = window.innerHeight;
    const covered = document.querySelector('[data-section="08-continuity"]');
    const incoming = document.querySelector('[data-section="09-achievement"]');
    const hero = document.querySelector('[data-section="01-hero"]');
    const jump = (y) => window.scrollTo({ top: y, behavior: "instant" });
    const incomingTop = incoming.getBoundingClientRect().top + window.scrollY;
    jump(incomingTop - vh * 0.55);
    return new Promise((resolve) => setTimeout(() => {
      const c1 = covered.getBoundingClientRect();
      const h1 = hero.getBoundingClientRect();
      const a1 = incoming.getBoundingClientRect();
      jump(incomingTop - vh * 0.55 + 300);
      return setTimeout(() => {
        const c2 = covered.getBoundingClientRect();
        const h2 = hero.getBoundingClientRect();
        const a2 = incoming.getBoundingClientRect();
        resolve({
          coveredAbove: c1.top < -50,
          coveredPinned: Math.abs(c1.top - c2.top) < 2 && Math.abs(c1.bottom - c2.bottom) < 2,
          incomingMoved: Math.abs(a1.top - a2.top) > 250,
          incomingOverlapping: a1.top < c1.bottom,
          heroPinned: Math.abs(h1.top - h2.top) < 2 && h1.top > -2 && h1.top < 120,
          incomingRadius: getComputedStyle(incoming).borderTopLeftRadius,
        });
      }, 500);
    }, 600));
  });
  const behaviorOk = proof.coveredAbove && proof.coveredPinned && proof.incomingMoved && proof.incomingOverlapping && proof.heroPinned && proof.incomingRadius === "32px";
  if (!behaviorOk) fail++;
  console.log(`${behaviorOk ? "ok  " : "FAIL"} /student sheet-over-sheet: covered=${proof.coveredAbove} pinned(stable)=${proof.coveredPinned} incoming moved=${proof.incomingMoved} overlaps=${proof.incomingOverlapping} hero pinned(stable)=${proof.heroPinned} radius=${proof.incomingRadius}`);

  /* screenshots */
  await page.screenshot({ path: "scripts-tmp/vision-shots/sheet-transition.png" });
  await page.evaluate(() => {
    const ach = document.querySelector('[data-section="10-journey-flow"]');
    window.scrollTo(0, ach.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5);
  });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: "scripts-tmp/vision-shots/sheet-deep.png" });

  /* reduced motion: controller off, no transforms anywhere */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(BASE + "/student", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector('[data-section="09-achievement"]', { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
  const reduce = await page.evaluate(() => {
    const incomingTop = document.querySelector('[data-section="09-achievement"]').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, incomingTop - window.innerHeight * 0.55);
    return new Promise((resolve) => setTimeout(() => {
      const transforms = Array.from(document.querySelectorAll("[data-section]"))
        .filter((s) => s.style.transform && s.style.transform !== "none").length;
      resolve({ transforms });
    }, 600));
  });
  const reduceOk = reduce.transforms === 0;
  if (!reduceOk) fail++;
  console.log(`${reduceOk ? "ok  " : "FAIL"} reduce: transformed sections=${reduce.transforms} (expect 0)`);

  console.log(fail === 0 ? "SHEET STACK VERIFIED" : `${fail} failures`);
  process.exitCode = fail === 0 ? 0 : 1;
} finally { await browser.close(); }
