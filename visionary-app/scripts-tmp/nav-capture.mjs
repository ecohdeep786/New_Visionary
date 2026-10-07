import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

/* Apple-nav verification: rest state, frosted scroll, flyout sheet, local chapter nav. */
const BASE = "http://localhost:4173";
const OUT = "scripts-tmp/nav-shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-color-profile=srgb"],
});

const settle = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60000 });
await settle(2200);

// 1 · nav at rest over the hero
await page.screenshot({ path: `${OUT}/01-rest-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 320 } });

// 2 · frosted bar + hairline after scroll
await page.evaluate(() => window.scrollTo(0, 600));
await settle(900);
await page.screenshot({ path: `${OUT}/02-frosted-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 220 } });

// 3 · flyout sheet open (hover "Who you are")
await page.hover('button[aria-controls="mega-who"]').catch(() => {});
await settle(800);
await page.screenshot({ path: `${OUT}/03-flyout-1440.png` });
await page.mouse.move(720, 860);
await settle(600);

// 4 · local chapter nav after the hero
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
await settle(900);
await page.screenshot({ path: `${OUT}/04-localnav-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 200 } });

// 5 · persona page rest state (photo hero behind transparent bar)
await page.goto(`${BASE}/student`, { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: `${OUT}/05-student-rest-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 300 } });

// 6 · company page rest state
await page.goto(`${BASE}/about`, { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: `${OUT}/06-about-rest-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 300 } });

// 7 · About flyout (3-column sheet)
await page.evaluate(() => window.scrollTo(0, 400));
await settle(600);
await page.hover('button[aria-controls="mega-about"]').catch(() => {});
await settle(800);
await page.screenshot({ path: `${OUT}/07-about-flyout-1440.png` });

// 8 · mobile nav at rest + drawer
await page.setViewport({ width: 390, height: 844 });
await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: `${OUT}/08-mobile-rest.png`, clip: { x: 0, y: 0, width: 390, height: 300 } });

await browser.close();
console.log("nav captures done");
