/* Verify hero scrim reduction + restored problem-section arrow on all five
   persona pages, desktop + one mobile hero. Run: node scripts-tmp/hero-smoke-arrow-check.mjs */
import puppeteer from "puppeteer";

const PAGES = [
  ["student", "/student"],
  ["teacher", "/teacher"],
  ["parent", "/parent"],
  ["professional", "/professional"],
  ["organization", "/organization"],
];

const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();

for (const [name, path] of PAGES) {
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(`http://localhost:5175${path}`, { waitUntil: "networkidle2", timeout: 90000 });
  await p.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 1500));
  await p.screenshot({ path: `scripts-tmp/apple-pass/fix-${name}-hero.png` });

  await p.evaluate(() => document.querySelector('[data-section="02-struggle"], main section:nth-of-type(2)')?.scrollIntoView({ behavior: "instant", block: "start" }));
  await new Promise((r) => setTimeout(r, 1100));
  await p.screenshot({ path: `scripts-tmp/apple-pass/fix-${name}-problem.png` });
  const arrow = await p.evaluate(() => !!document.querySelector('[data-section="02-struggle"] svg[aria-hidden="true"]'));
  console.log(`${name}: arrow=${arrow}`);
}

// mobile hero legibility check (scrim protects the text zone)
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await p.goto("http://localhost:5175/student", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: "scripts-tmp/apple-pass/fix-mobile-hero.png" });
console.log("mobile hero shot saved");
await b.close();
