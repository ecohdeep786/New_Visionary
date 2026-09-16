import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

/* Wave L1 — 08-seo: renders public/og-image.png (1200×630) from branded markup. */
const html = `<!doctype html><html><head><style>
  @font-face { font-family: sys; src: local("Segoe UI"); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden;
    background: linear-gradient(135deg, #ffffff 0%, #E9EFFA 62%, #D2E3FC 100%);
    font-family: "Google Sans", "Segoe UI", system-ui, sans-serif;
    display: flex; align-items: center; justify-content: space-between; padding: 0 96px; }
  .left { flex-shrink: 0; max-width: 640px; } .left h1 { font-size: 84px; font-weight: 500; color: #121317; letter-spacing: -0.02em; }
  .left p { margin-top: 20px; font-size: 30px; color: #5f6368; max-width: 560px; line-height: 1.5; }
  .badge { display: inline-block; margin-bottom: 28px; padding: 8px 22px; border-radius: 999px;
    border: 1px solid #dadce0; background: #fff; color: #1a73e8; font-size: 22px; }
  .circle { flex-shrink: 0; width: 340px; height: 340px; border-radius: 50%; background: #4285F4;
    display: flex; align-items: center; justify-content: center; box-shadow: 0 24px 70px rgba(66,133,244,.35); }
  .circle span { color: #fff; font-size: 150px; font-weight: 500; }
</style></head><body>
  <div class="left">
    <div class="badge">Visionary</div>
    <h1>Learn, ask, practice, and build.</h1>
    <p>One intelligence that helps anyone learn, teach, support, and build.</p>
  </div>
  <div class="circle"><span>V</span></div>
</body></html>`;

writeFileSync("scripts-tmp/og-image-src.html", html);
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto("file://" + process.cwd().replace(/\\/g, "/") + "/scripts-tmp/og-image-src.html");
await page.waitForTimeout(300);
await page.screenshot({ path: "public/og-image.png" });
await browser.close();
console.log("og-image.png written");
