/* After-shots: new universal landing hero vs category hero — visual + geometry parity. */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/hero-shots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5173";

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  const readHeroGeometry = () =>
    page.evaluate(() => {
      const h1 = document.querySelector('[data-section="01-hero"] h1 span[aria-hidden="true"]');
      const section = document.querySelector('[data-section="01-hero"]');
      const img = document.querySelector('[data-section="01-hero"] img');
      const cs = h1 ? getComputedStyle(h1) : null;
      const ss = section ? getComputedStyle(section) : null;
      return {
        word: h1 ? h1.textContent.trim() : null,
        fontPx: cs ? cs.fontSize : null,
        fontWeight: cs ? cs.fontWeight : null,
        letterSpacing: cs ? cs.letterSpacing : null,
        sectionH: ss ? ss.height : null,
        sectionMT: ss ? ss.marginTop : null,
        imgFit: img ? getComputedStyle(img).objectFit : null,
        imgPos: img ? getComputedStyle(img).objectPosition : null,
      };
    });

  /* ── landing at 1440 ── */
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: `${OUT}/after-landing-1440-a.png` });
  console.log("landing A", JSON.stringify(await readHeroGeometry()));

  /* wait for a later slide to prove word↔photo cycling */
  await page.waitForFunction(
    () => { const s = document.querySelector('[data-section="01-hero"] h1 span[aria-hidden="true"]'); return s && /Teaching|Parenting|Building|Leading/.test(s.textContent); },
    { timeout: 25000 }
  ).catch(() => console.log("WARN: cycle word never changed"));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: `${OUT}/after-landing-1440-b.png` });
  console.log("landing B", JSON.stringify(await readHeroGeometry()));

  /* ── student category page (the reference dialect) ── */
  await page.goto(BASE + "/student", { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: `${OUT}/after-student-1440.png` });
  console.log("student  ", JSON.stringify(await readHeroGeometry()));

  /* ── organization category page ── */
  await page.goto(BASE + "/organization", { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: `${OUT}/after-org-1440.png` });
  console.log("org     ", JSON.stringify(await readHeroGeometry()));

  /* ── landing at 390 mobile ── */
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: `${OUT}/after-landing-390.png` });
  console.log("mobile  ", JSON.stringify(await readHeroGeometry()));

  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "NO JS ERRORS");
} finally {
  await browser.close();
}
