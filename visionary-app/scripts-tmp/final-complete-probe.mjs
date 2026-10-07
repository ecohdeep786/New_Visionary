import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const px = (n) => Math.round(n);
const VIEWPORTS = [[320, 700], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const report = {};

const probe = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const px = (n) => Math.round(n);
  const r = (el) => el ? el.getBoundingClientRect() : null;
  const cs = (el) => el ? getComputedStyle(el) : null;
  // section order + tops
  const order = ["01-hero","02-problem","03-promise","04-meet","06-journey","07-language","08-trust","09-cta"];
  const secs = order.map((k) => {
    const s = document.querySelector(`[data-section="${k}"]`);
    if (!s) return null;
    const cr = r(s); const c = cs(s);
    return { k, top: px(cr.top + window.scrollY), h: px(cr.height), bottom: px(cr.top + window.scrollY + cr.height) };
  }).filter(Boolean);
  // monotonic check (no overlap)
  let ordered = true; let prevBottom = 0;
  secs.forEach((s) => { if (s.top < prevBottom - 2) ordered = false; prevBottom = s.bottom; });
  // Meet single-panel
  const panels = [...document.querySelectorAll('[data-section="04-meet"] [data-step]')];
  const visiblePanels = panels.filter((p) => { const d = cs(p).display; return d !== "none" && p.offsetHeight > 0; });
  // overflows
  const overflows = [...document.querySelectorAll("section[data-section], main")].filter((s) => {
    const cr = r(s);
    return cr && (cr.left < -0.5 || cr.right > vw + 0.5);
  }).map((s) => ({ cls: s.className?.split(" ").slice(0,2).join(".") || s.tagName, left: px(r(s).left), right: px(r(s).right) }));
  // journey
  const j2 = document.querySelector('[data-section="06-journey"] h2');
  const j2r = r(j2); const j2c = cs(j2);
  return {
    viewport: vw, ordered, overflowCount: overflows.length,
    sections: secs,
    meet: { panelCount: panels.length, visiblePanelCount: visiblePanels.length },
    journey: { h2Fs: j2c ? px(parseFloat(j2c.fontSize)) : null, h2Track: j2c ? px(parseFloat(j2c.letterSpacing)*1000)/1000 : null, h2MaxW: j2 ? j2r.width : null },
    bodyH: px(r(document.body).height), docH: px(document.documentElement.scrollHeight),
  };
};

for (const [w, h] of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0", timeout: 120000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 600)));
  report[`w${w}`] = await page.evaluate(probe);
  const r2 = report[`w${w}`];
  console.log(`=== ${w}px === order:${r2.ordered ? "OK" : "BAD"} meets:${r2.meet.visiblePanelCount}/${r2.meet.panelCount} overflows:${r2.overflowCount} jH2:${r2.journey?.h2Fs}px`);
  await page.close();
}
writeFileSync("scripts-tmp/landing-audit/final-complete.json", JSON.stringify(report, null, 2));
await browser.close();
console.log("done");
