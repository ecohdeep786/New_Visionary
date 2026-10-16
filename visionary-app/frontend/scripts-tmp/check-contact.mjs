import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5173/contact", { waitUntil: "load", timeout: 120000 });
await page.waitForSelector("#main h1", { timeout: 30000 });
await page.waitForTimeout(800);
const out = await page.evaluate(() => {
  const d = (label, el) => {
    if (!el) return { label, missing: true };
    const c = getComputedStyle(el);
    return { label, tag: el.tagName.toLowerCase(), fs: c.fontSize, fw: c.fontWeight, bg: c.backgroundColor, radius: c.borderTopLeftRadius, h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width), txt: (el.textContent || "").trim().slice(0, 30) };
  };
  const spans = document.querySelectorAll("#resources a.group > span");
  const gName = document.querySelector("#grievance h3");
  return { d: [
    d("res-label", spans[1]),
    d("g-card", gName.parentElement),
    d("g-label", gName.previousElementSibling),
  ] };
});
console.log(JSON.stringify(out));
await browser.close();
