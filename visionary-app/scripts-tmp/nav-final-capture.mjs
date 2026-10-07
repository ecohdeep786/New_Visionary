import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const settle = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: "scripts-tmp/nav-shots/g1-rest.png" });

await page.mouse.move(720, 500);
await page.mouse.wheel({ deltaY: 500 });
await settle(900);
await page.hover('button[aria-controls="mega-who"]').catch(() => {});
await settle(900);
await page.screenshot({ path: "scripts-tmp/nav-shots/g2-flyout.png" });
await page.mouse.move(720, 880);
await settle(500);

await page.goto("http://localhost:4173/student", { waitUntil: "networkidle0", timeout: 60000 });
await settle(2000);
await page.screenshot({ path: "scripts-tmp/nav-shots/g3-student.png" });

await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0", timeout: 60000 });
await settle(1800);
await page.tap('button[aria-label="Open menu"]').catch(() => {});
await settle(800);
await page.screenshot({ path: "scripts-tmp/nav-shots/g4-mobile-drawer.png" });

await browser.close();
console.log("final captures done");
