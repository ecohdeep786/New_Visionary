/* Measure the non-white subject bounding box of each problem-slide image. */
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
      const S = 100;
      const c = document.createElement("canvas");
      c.width = S; c.height = S;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, S, S);
      const d = ctx.getImageData(0, 0, S, S).data;
      let minX = S, minY = S, maxX = -1, maxY = -1;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const i = (y * S + x) * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          // non-white = any channel dips below 246
          if (r < 246 || g < 246 || b < 246) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      out.push({
        src: src.split("/").pop(),
        subjectBoxPct: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
      });
    }
    return out;
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
