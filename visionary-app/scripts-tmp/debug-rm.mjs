import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await p.emulateMedia({ reducedMotion: "reduce" });
await p.goto("http://localhost:4173/", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await p.waitForTimeout(600);
const found = await p.evaluate(() =>
  [...document.querySelectorAll("main *")]
    .filter((el) => {
      const s = getComputedStyle(el);
      return s.opacity === "0" && s.animationName !== "none";
    })
    .slice(0, 4)
    .map((el) => ({
      tag: el.tagName,
      cls: String(el.className).slice(0, 44),
      anim: getComputedStyle(el).animationName,
      delay: getComputedStyle(el).animationDelay,
      dur: getComputedStyle(el).animationDuration,
      inline: (el.getAttribute("style") || "").slice(0, 140),
    }))
);
console.log(JSON.stringify(found, null, 1));
await browser.close();
