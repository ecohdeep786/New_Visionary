import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "scripts-tmp/shots/landing-choreo";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

async function shot(page, path) {
  await new Promise((r) => setTimeout(r, 950));
  await page.screenshot({ path: `${OUT}/${path}.png` });
  console.log("shot", path);
}

{
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await shot(p, "d-01-hero");

  /* enter state: problem section top just inside the band */
  await p.evaluate(() => {
    const el = document.querySelector('section[data-section="02-problem"]');
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - 750, behavior: "instant" });
  });
  await shot(p, "d-02-problem");

  /* exit-wipe: scroll so the problem bottom is above the 40% line — content mid-fade */
  await p.evaluate(() => {
    const el = document.querySelector('section[data-section="02-problem"]');
    const bottom = el.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: bottom - 260, behavior: "instant" });
  });
  await shot(p, "d-03-problem-exit");

  await p.evaluate(() => {
    document.querySelector('section[data-section="03-promise"]')?.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await shot(p, "d-04-promise");

  await p.evaluate(() => {
    const rows = document.querySelectorAll('section[data-section="04-meet"] [data-step]');
    rows[2]?.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await shot(p, "d-05-meet-sticky");

  await p.evaluate(() => {
    document.querySelector('section[data-section="08-trust"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "d-06-trust");

  const overflow = await p.evaluate(() => document.scrollingElement.scrollWidth > document.documentElement.clientWidth);
  /* verify the sticky copy column still pins inside the FadeSoft wrapper */
  const stickyOk = await p.evaluate(() => {
    const col = document.querySelector('section[data-section="04-meet"] .sticky');
    return col ? getComputedStyle(col).position : "missing";
  });
  console.log("desktop overflow:", overflow, "| meet sticky:", stickyOk);
  await p.close();
}

{
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await shot(p, "m-01-hero");
  await p.evaluate(() => {
    document.querySelector('section[data-section="02-problem"]')?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -56);
  });
  await shot(p, "m-02-problem");
  const overflow = await p.evaluate(() => document.scrollingElement.scrollWidth > document.documentElement.clientWidth);
  console.log("mobile overflow:", overflow);
  await p.close();
}

await browser.close();
console.log("done");
