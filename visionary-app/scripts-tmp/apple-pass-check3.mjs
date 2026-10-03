/* Weight-revert + animation spot check. Run: node scripts-tmp/apple-pass-check3.mjs */
import puppeteer from "puppeteer";

const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

// weights
await p.goto("http://localhost:5175/student", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
const w1 = await p.evaluate(() => {
  const h2 = document.querySelector('[data-section="04-journey"] h2, main h2');
  const hero = document.querySelector("main h1 span[aria-hidden] span");
  return {
    sectionH2: h2 ? getComputedStyle(h2).fontWeight : null,
    hero: hero ? getComputedStyle(hero).fontWeight : null,
    heroLs: hero ? getComputedStyle(hero).letterSpacing : null,
  };
});
console.log("student:", JSON.stringify(w1));

await p.goto("http://localhost:5175/community", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
const w2 = await p.evaluate(() => {
  const h1 = document.querySelector("main h1");
  return { communityH1: h1 ? getComputedStyle(h1).fontWeight : null };
});
console.log("community:", JSON.stringify(w2));

// organization cycle spot check
await p.goto("http://localhost:5175/organization", { waitUntil: "networkidle2", timeout: 60000 });
await p.evaluate(() => document.querySelector('[data-section="02-struggle"]')?.scrollIntoView({ behavior: "instant" }));
const words = new Set();
for (let i = 0; i < 10; i++) {
  const w = await p.evaluate(() => document.querySelector('[data-section="02-struggle"] h2 span:last-child')?.textContent.trim());
  words.add(w);
  await new Promise((r) => setTimeout(r, 1100));
}
console.log("organization struggle words seen:", [...words].join(" | "));

// screenshots for eyeball
await p.goto("http://localhost:5175/student", { waitUntil: "networkidle2", timeout: 60000 });
await p.evaluate(() => document.querySelector('[data-section="04-journey"]')?.scrollIntoView({ behavior: "instant" }));
await new Promise((r) => setTimeout(r, 1300));
await p.screenshot({ path: "scripts-tmp/apple-pass/check-weight-journey.png" });
await p.goto("http://localhost:5175/professional", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1400));
await p.screenshot({ path: "scripts-tmp/apple-pass/check-weight-pro-hero.png" });
console.log("shots saved");
await b.close();
