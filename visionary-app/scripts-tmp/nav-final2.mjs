import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const settle = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

// 1 · active state: /pricing → "Pricing" must be black
await page.goto("http://localhost:4173/pricing", { waitUntil: "networkidle0", timeout: 60000 });
await settle(1800);
await page.screenshot({ path: "scripts-tmp/nav-shots/h1-pricing-active.png" });

// 2 · active state: /student → "Student" trigger must be black
await page.goto("http://localhost:4173/student", { waitUntil: "networkidle0", timeout: 60000 });
await settle(1800);
await page.screenshot({ path: "scripts-tmp/nav-shots/h2-student-active.png" });

// 3 · scrolled capsule (white/80) on landing
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await settle(1600);
await page.mouse.move(720, 500);
await page.mouse.wheel({ deltaY: 600 });
await settle(900);
await page.screenshot({ path: "scripts-tmp/nav-shots/h3-scrolled.png" });

// 4 · flyout panel under the tighter capsule
await page.hover('button[aria-controls="mega-who"]').catch(() => {});
await settle(900);
await page.screenshot({ path: "scripts-tmp/nav-shots/h4-flyout.png" });

await browser.close();
console.log("done");
