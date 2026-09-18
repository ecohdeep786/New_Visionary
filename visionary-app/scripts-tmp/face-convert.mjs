import { chromium } from "playwright-core";
import { writeFileSync, statSync } from "fs";

/* Wave L6 — PNG source cleanup: convert the last imported PNGs (face-main set) to webp q85. */
const NAMES = ["student-face-main", "teacher-face-main", "parent-face-main", "professional-face-main", "organization-face-main", "org-face-main"];

const html = `<!doctype html><html><body><script>
window.make = async (name) => {
  const img = new Image();
  img.src = name + ".png";
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext("2d").drawImage(img, 0, 0);
  return c.toDataURL("image/webp", 0.9);
};
</script></body></html>`;
writeFileSync("src/assets/conv-tool.html", html);

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server", "--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.goto("file:///C:/Users/Administrator/New_Visionary/visionary-app/src/assets/conv-tool.html");
for (const name of NAMES) {
  const dataUrl = await page.evaluate((n) => window.make(n), name);
  writeFileSync(`src/assets/${name}.webp`, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`${name}.webp: ${(statSync(`src/assets/${name}.webp`).size / 1024).toFixed(0)}KB`);
}
await browser.close();
