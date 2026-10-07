/* Probe problem-slide images: natural dims + corner/center bg samples. */
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: "new" });
try {
  const p = await browser.newPage();
  await p.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  const result = await p.evaluate(async () => {
    const imgs = [
      "/src/assets/teacher-hero-main-1600w.webp",
      "/src/assets/parent-hero-main-1600w.webp",
      "/src/assets/problem-understanding.webp",
      "/src/assets/pro-face-main-1600w.webp",
    ];
    const out = [];
    for (const src of imgs) {
      const img = new Image();
      img.src = src;
      await img.decode().catch(() => {});
      const c = document.createElement("canvas");
      const w = (c.width = Math.min(img.naturalWidth || 10, 64));
      const h = (c.height = Math.min(img.naturalHeight || 10, 64));
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const px = (x, y) => {
        const d = ctx.getImageData(x, y, 1, 1).data;
        return `${d[0]},${d[1]},${d[2]},${d[3]}`;
      };
      out.push({
        src: src.split("/").pop(),
        dims: `${img.naturalWidth}x${img.naturalHeight}`,
        corners: [px(1, 1), px(w - 2, 1), px(1, h - 2), px(w - 2, h - 2)],
        centerTop: px(Math.floor(w / 2), 2),
      });
    }
    return out;
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
