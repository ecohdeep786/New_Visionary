import { chromium } from "playwright-core";
import { writeFileSync, statSync, readFileSync } from "fs";

/* Wave L6-IMG — convert new problem imagery: webp q85 at ORIGINAL dimensions,
   + 1600w content variant where master >1600w (content-slot rule). */
const JOBS = [
  ...[1, 2, 3, 4].map((n) => ({ src: `Teacher_Problem_${n}.png`, out: `teacher-problem-${n}.webp`, variant: false })),
  ...[1, 2, 3, 4, 5].map((n) => ({ src: `organization-problem-${n}.jpeg`, out: `organization-problem-${n}.webp`, out1600: `organization-problem-${n}-1600w.webp`, variant: true })),
  ...[1, 2, 3, 4].map((n) => ({ src: `professional-problem-${n}.jpeg`, out: `professional-problem-${n}.webp`, out1600: `professional-problem-${n}-1600w.webp`, variant: true })),
];

const html = `<!doctype html><html><body><script>
window.make = async (src, w) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const scale = w ? Math.min(1, w / img.naturalWidth) : 1;
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/webp", 0.85);
};
</script></body></html>`;
writeFileSync("src/assets/conv.html", html);

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server", "--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.goto("file:///" + process.cwd().replace(/\\/g, "/") + "/src/assets/conv.html");
for (const j of JOBS) {
  const full = await page.evaluate(async ([src]) => window.make(src, null), [j.src]);
  writeFileSync(`src/assets/${j.out}`, Buffer.from(full.split(",")[1], "base64"));
  let line = `${j.out}: ${(statSync(`src/assets/${j.out}`).size / 1024).toFixed(0)}KB`;
  if (j.variant) {
    const v = await page.evaluate(async ([src]) => window.make(src, 1600), [j.src]);
    writeFileSync(`src/assets/${j.out1600}`, Buffer.from(v.split(",")[1], "base64"));
    line += ` | ${j.out1600}: ${(statSync(`src/assets/${j.out1600}`).size / 1024).toFixed(0)}KB`;
  }
  console.log(line);
}
await browser.close();
