import { chromium } from "playwright-core";

/* In-page transition timing: click, then poll at 10ms inside the page.
   Measures click -> (route changed AND route h1 present). */
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const measure = async (target) => {
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000); // idle prefetch settles
  return await page.evaluate((target) => new Promise((resolve) => {
    const t0 = performance.now();
    const a = [...document.querySelectorAll("a")].find((x) => x.getAttribute("href") === target);
    a.click();
    const iv = setInterval(() => {
      if (location.pathname === target && document.querySelector("h1")) {
        clearInterval(iv);
        resolve(Math.round(performance.now() - t0));
      } else if (performance.now() - t0 > 15000) {
        clearInterval(iv);
        resolve(-1);
      }
    }, 10);
  }), target);
};

for (const t of ["/careers", "/student", "/pricing", "/privacy", "/teacher"]) {
  console.log("click", t, "-> mounted:", await measure(t) + "ms");
}
await browser.close();
