import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const settle = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

// 1 · landing rest (full frame, top of page)
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: "scripts-tmp/nav-shots/f1-rest.png" });

// 2 · flyout sheet (scrolled + hover who)
await page.mouse.move(720, 500);
await page.mouse.wheel({ deltaY: 500 });
await settle(800);
await page.hover('button[aria-controls="mega-who"]').catch(() => {});
await settle(900);
await page.screenshot({ path: "scripts-tmp/nav-shots/f2-flyout.png" });
await page.mouse.move(720, 880);
await settle(500);

// 3 · about flyout
await page.hover('button[aria-controls="mega-about"]').catch(() => {});
await settle(900);
await page.screenshot({ path: "scripts-tmp/nav-shots/f3-about-flyout.png" });
await page.mouse.move(720, 880);
await settle(500);

// 4 · persona page top
await page.goto("http://localhost:4173/student", { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: "scripts-tmp/nav-shots/f4-student.png" });

// 5 · company page top
await page.goto("http://localhost:4173/about", { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: "scripts-tmp/nav-shots/f5-about.png" });

// 6 · mobile
await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: "scripts-tmp/nav-shots/f6-mobile.png" });

await browser.close();
console.log("full captures done");
