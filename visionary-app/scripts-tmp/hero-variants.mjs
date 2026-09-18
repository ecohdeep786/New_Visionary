import { chromium } from "playwright-core";
import { writeFileSync, statSync } from "fs";

/* Wave L2 — 07-perf: responsive hero variants (800w/1600w/2400w) via canvas downscale, q85. */
const HEROES = ["student-hero-main", "teacher-hero-main", "parent-hero-main", "pro-face-main", "org-face-main"];
const WIDTHS = [800, 1600, 2400];

const html = `<!doctype html><html><body><script>
window.make = async (name, w) => {
  const img = new Image();
  img.src = name + ".webp";
  await img.decode();
  const scale = w / img.naturalWidth;
  const c = document.createElement("canvas");
  c.width = w; c.height = Math.round(img.naturalHeight * scale);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/webp", 0.85);
  return url;
};
</script></body></html>`;
writeFileSync("src/assets/variant-tool.html", html);

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server", "--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.goto("file:///C:/Users/Administrator/New_Visionary/visionary-app/src/assets/variant-tool.html");

for (const name of HEROES) {
  for (const w of WIDTHS) {
    const dataUrl = await page.evaluate(async ([name, w]) => window.make(name, w), [name, w]);
    const out = `src/assets/${name}-${w}w.webp`;
    writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
    console.log(`${name}-${w}w: ${(statSync(out).size / 1024).toFixed(0)}KB`);
  }
}
await browser.close();
console.log("done");
