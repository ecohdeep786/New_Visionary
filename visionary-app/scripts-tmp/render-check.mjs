/* Post-writing-pass render sweep: every rewritten landing route at 1440 + 390.
   Checks: page renders (no AppErrorBoundary), no horizontal overflow. */
import puppeteer from "puppeteer";

const BASE = process.argv[2] || "http://localhost:5173";
const ROUTES = [
  "/", "/student", "/teacher", "/parent", "/professional", "/organization",
  "/how-it-works", "/help", "/about", "/pricing", "/careers", "/research",
  "/community", "/contact", "/partners", "/updates", "/referral",
  "/safety", "/privacy", "/terms", "/security", "/accessibility", "/cookies", "/download",
];
const WIDTHS = [[1440, 900], [390, 844]];

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  let failures = 0;
  for (const [w, h] of WIDTHS) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    for (const route of ROUTES) {
      try {
        await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 1500));
        const result = await page.evaluate(() => {
          const text = document.body.innerText || "";
          const crashed = text.includes("Something went wrong");
          const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          return { crashed, overflow };
        });
        if (result.crashed || result.overflow > 1) {
          failures++;
          console.log(`FAIL ${route} @${w} crashed=${result.crashed} overflowPx=${result.overflow}`);
        } else {
          console.log(`ok   ${route} @${w}`);
        }
      } catch (e) {
        failures++;
        console.log(`FAIL ${route} @${w} :: ${e.message.slice(0, 80)}`);
      }
    }
  }
  console.log(failures === 0 ? "ALL ROUTES RENDER CLEAN" : `${failures} failures`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  await browser.close();
}
