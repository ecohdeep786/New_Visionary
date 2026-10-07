import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

// map our sections to Apple roles for comparison
const m = await page.evaluate(() => {
  const px = (n) => Math.round(n);
  const r = (el) => el ? el.getBoundingClientRect() : null;
  const cs = (el) => el ? getComputedStyle(el) : null;
  const padBlock = (el) => { const c = cs(el); return { pt: px(parseFloat(c.paddingTop)), pb: px(parseFloat(c.paddingBottom)) }; };
  // our sections by data-section
  const order = ["01-hero","02-problem","03-promise","04-meet","06-journey","07-language","08-trust","09-cta"];
  const sections = [];
  order.forEach((k) => {
    const s = document.querySelector(`[data-section="${k}"]`);
    if (!s) return;
    const cr = r(s);
    const hdr = s.querySelector("h1,h2,h3");
    const copy = s.querySelector("p:not([class*='sr-only'])");
    const allCopy = [...s.querySelectorAll("p")].filter((p) => !p.classList.contains("sr-only"));
    const firstCopy = allCopy[0];
    const imgs = [...s.querySelectorAll("img")];
    const leadImg = imgs[0];
    sections.push({
      key: k,
      h: px(cr.height), top: px(cr.top + window.scrollY),
      padBlock: padBlock(s),
      hLeft: hdr ? px(r(hdr).left) : null, hFs: hdr ? px(parseFloat(cs(hdr).fontSize)) : null, hT: hdr ? px(parseFloat(cs(hdr).letterSpacing)*1000)/1000 : null,
      copyLeft: firstCopy ? px(r(firstCopy).left) : null, copyFs: firstCopy ? px(parseFloat(cs(firstCopy).fontSize)) : null,
      imgs: imgs.length,
    });
  });
  // localnav strip (meet) + journey track left edge
  const meetStrip = document.querySelector('[data-section="04-meet"] [role="tablist"]');
  const journeyHeader = document.querySelector('[data-section="06-journey"] h2');
  const journeyTrack = document.querySelector('[data-section="06-journey"] [role="group"]');
  return {
    sections,
    meetStrip: meetStrip ? { w: px(r(meetStrip).width), left: px(r(meetStrip).left) } : null,
    journeyHeaderLeft: journeyHeader ? px(r(journeyHeader).left) : null,
    journeyTrackLeft: journeyTrack ? px(r(journeyTrack).left) : null,
  };
});
writeFileSync("scripts-tmp/landing-audit/our-spec.json", JSON.stringify(m, null, 2));
console.log(JSON.stringify(m, null, 2));
await browser.close();
