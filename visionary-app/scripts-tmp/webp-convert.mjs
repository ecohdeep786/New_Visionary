import { chromium } from "playwright-core";
import { statSync, readFileSync, writeFileSync } from "fs";

/* Wave L1b — 07-perf: re-encode oversized landing PNGs to WebP (q85) at natural
   size. Landing-pack assets only; internal product images untouched. */
const IMAGES = [
  "parent-hero-main", "student-hero-main", "org-face-main", "teacher-hero-main",
  "pro-face-main", "achivenment-build", "achievenment-achieve", "student-higher",
  "student-competitive", "student-secondary", "problem-exam", "problem-revision",
  "problem-practice", "student-vocational", "student-primary", "Remembering",
  "problem-understanding",
];

/* PNG dims come from the IHDR header — no image library needed. */
const pngSize = (buf) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
let totalBefore = 0, totalAfter = 0;
for (const name of IMAGES) {
  const png = `src/assets/${name}.png`;
  const webp = `src/assets/${name}.webp`;
  const buf = readFileSync(png);
  const { w, h } = pngSize(buf);
  const html = `<!doctype html><html><head><style>*{margin:0;padding:0}img{display:block}</style></head>
    <body><img id="i" src="${name}.png?${Date.now()}"></body></html>`;
  writeFileSync("src/assets/webp-wrapper.html", html);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto("file:///" + process.cwd().replace(/\\/g, "/") + "/src/assets/webp-wrapper.html");
  await page.waitForFunction(() => { const i = document.getElementById("i"); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 });
  await page.waitForTimeout(200); // paint settle
  const img = await page.$("#i");
  await img.screenshot({ path: "src/assets/" + name + ".webp", type: "webp", quality: 85 });
  await page.close();
  const b = statSync(png).size, a = statSync("src/assets/" + name + ".webp").size;
  totalBefore += b; totalAfter += a;
  console.log(`${name}: ${(b / 1048576).toFixed(1)}MB -> ${(a / 1024).toFixed(0)}KB (${w}x${h})`);
}
await browser.close();
console.log(`TOTAL: ${(totalBefore / 1048576).toFixed(1)}MB -> ${(totalAfter / 1048576).toFixed(1)}MB (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`);
