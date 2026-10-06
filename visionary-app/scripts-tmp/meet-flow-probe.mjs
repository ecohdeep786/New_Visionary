/* Meet flow check: band pins under nav, left copy swaps with active chapter. */
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
  await p.evaluate(() => document.querySelector('[data-section="04-meet"]').scrollIntoView({ block: "start" }));
  await new Promise((r) => setTimeout(r, 2000));
  // scroll to the second chapter (index 1) the way the tab click does
  await p.evaluate(() => {
    const rows = document.querySelectorAll('[data-section="04-meet"] [data-step]');
    rows[1].scrollIntoView({ behavior: "instant", block: "center" });
  });
  await new Promise((r) => setTimeout(r, 2200));
  const state = await p.evaluate(() => {
    const sec = document.querySelector('[data-section="04-meet"]');
    const band = sec.querySelector(".glass");
    const copy = sec.querySelector('[class*="max-w-[560px]"]');
    const r = (el) => el.getBoundingClientRect();
    const activeTab = [...sec.querySelectorAll("[role='tab']")].find((t) => t.getAttribute("aria-selected") === "true");
    const img1 = sec.querySelectorAll("figure img")[1];
    return {
      bandPinnedAt: Math.round(r(band).top),
      activeTab: activeTab ? activeTab.textContent.trim() : null,
      copyHeading: copy ? copy.querySelector("h3").textContent.trim().slice(0, 40) : null,
      copyHasButton: !!copy.querySelector("a"),
      copyButtonLabel: copy?.querySelector("a")?.textContent.trim() || null,
      gutter: Math.round(r(img1).left - r(copy).right),
      img1CenterOffset: Math.round(
        (r(img1).left + r(img1).right) / 2 -
          (r(img1.parentElement.parentElement).left + r(img1.parentElement.parentElement).right) / 2
      ),
    };
  });
  console.log(JSON.stringify(state, null, 1));
  await p.screenshot({ path: `${OUT}/meet-chapter2-desktop-1440.png` });
  await browser.close();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
