/* Meet section live geometry: (1) intro gaps post-reveal at section top,
   (2) pinned band state at chapter 2 with nav rect for context.
   NOTE: all rounding happens INSIDE evaluate (browser scope). */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const OUT = "scripts-tmp/shots/meet-audit";
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new" });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForSelector('[data-section="04-meet"]', { timeout: 30000 });

  // phase 1 — section top, revealed + settled
  await p.evaluate(() => {
    document.querySelector('[data-section="04-meet"]').scrollIntoView({ block: "start", behavior: "instant" });
  });
  await new Promise((r) => setTimeout(r, 2500));
  const top = await p.evaluate(() => {
    const round = (x) => Math.round(x);
    const sec = document.querySelector('[data-section="04-meet"]');
    const rect = (el) => el.getBoundingClientRect();
    const kicker = sec.querySelector("p");
    const h2 = sec.querySelector("h2");
    const sub = [...sec.querySelectorAll("p")].find((el) => el.textContent.includes("continues your journey"));
    const band = sec.querySelector(".glass");
    const fig0 = sec.querySelector("figure");
    const copy = sec.querySelector('[class*="max-w-\\[560px\\]"]');
    const img0 = sec.querySelector("figure img");
    const ks = getComputedStyle(kicker);
    const header = document.querySelector("header");
    return {
      kickerToH2: round(rect(h2).top - rect(kicker).bottom),
      h2ToSub: round(rect(sub).top - rect(h2).bottom),
      subToBand: round(rect(band).top - rect(sub).bottom),
      bandToFigure: round(rect(fig0).top - rect(band).bottom),
      copyLeft: copy ? round(rect(copy).left) : null,
      gutterTextToImage: copy ? round(rect(img0).left - rect(copy).right) : null,
      kickerOpacity: ks.opacity,
      kickerTransform: ks.transform,
      navBottom: header ? round(rect(header).bottom) : null,
      bandTopAtSectionTop: round(rect(band).top),
    };
  });
  console.log("TOP ", JSON.stringify(top));

  // phase 2 — chapter 2 centered: pinned band + swapped copy
  await p.evaluate(() => {
    const rows = document.querySelectorAll('[data-section="04-meet"] [data-step]');
    rows[1].scrollIntoView({ block: "center", behavior: "instant" });
  });
  await new Promise((r) => setTimeout(r, 2200));
  const mid = await p.evaluate(() => {
    const round = (x) => Math.round(x);
    const sec = document.querySelector('[data-section="04-meet"]');
    const rect = (el) => el.getBoundingClientRect();
    const band = sec.querySelector(".glass");
    const copy = sec.querySelector('[class*="max-w-\\[560px\\]"]');
    const img1 = sec.querySelectorAll("figure img")[1];
    const bs = getComputedStyle(band);
    const active = [...sec.querySelectorAll("[role='tab']")].find((t) => t.getAttribute("aria-selected") === "true");
    const header = document.querySelector("header");
    return {
      navBottom: header ? round(rect(header).bottom) : null,
      navPosition: header ? getComputedStyle(header).position : null,
      bandViewportTop: round(rect(band).top),
      bandComputedTop: bs.top,
      bandPosition: bs.position,
      activeTab: active ? active.textContent.trim() : null,
      copyHeading: copy ? copy.querySelector("h3").textContent.trim() : null,
      copyBtn: copy && copy.querySelector("a") ? copy.querySelector("a").textContent.trim() : null,
      gutter: copy ? round(rect(img1).left - rect(copy).right) : null,
      img1CenterOffsetInCol: round(
        (rect(img1).left + rect(img1).right) / 2 -
          (rect(img1.closest("[data-step]").parentElement).left + rect(img1.closest("[data-step]").parentElement).right) / 2
      ),
    };
  });
  console.log("MID ", JSON.stringify(mid));
  await p.screenshot({ path: `${OUT}/meet-chapter2-desktop-1440.png` });
  await browser.close();
} catch (e) {
  console.error("PROBE FAIL:", e.message);
  process.exit(1);
}
