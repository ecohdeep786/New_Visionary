/* Probe cutout canvases: alpha bounding box at a hard threshold (128) plus
   alpha-weighted horizontal centroid — tight subject extents for layout. */
import sharp from "sharp";
import { resolve } from "node:path";

const files = [
  "student-800w.webp", "teacher-800w.webp", "parent-800w.webp",
  "professional-800w.webp", "organization-800w.webp",
];

for (const f of files) {
  const p = resolve("src/assets/hero-cutouts", f);
  const img = sharp(p);
  const meta = await img.metadata();
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  let sum = 0, sumX = 0;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const a = data[(y * W + x) * C + 3];
      if (a > 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (a > 40) { sum += a; sumX += a * x; }
    }
  }
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const cx = sumX / sum / W;
  console.log(
    f, JSON.stringify({
      box: `${minX},${minY} ${bw}x${bh}`,
      subjectAspect: +(bw / bh).toFixed(3),
      cx: +cx.toFixed(4),
      pad: { l: minX, r: W - maxX - 1, t: minY, b: H - maxY - 1 },
    })
  );
}
