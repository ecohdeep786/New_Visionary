import { chromium } from "playwright-core";

/* Parity check: rendered WebP (left) vs original PNG (right) side by side. */
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1000, height: 520 } });
const html = `<!doctype html><html><body style="margin:0;display:flex;background:#ddd">
<img src="file:///${process.cwd().replace(/\\/g, "/")}/src/assets/parent-hero-main.webp" height="500">
<img src="file:///${process.cwd().replace(/\\/g, "/")}/src/assets/parent-hero-main.png" height="500"></body></html>`;
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "scripts-tmp/webp-parity.png" });
await browser.close();
console.log("parity shot written");
