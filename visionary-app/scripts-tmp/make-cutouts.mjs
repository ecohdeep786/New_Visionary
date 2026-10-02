/*
 * Generates transparent-background cutouts of the five hero portraits.
 * Method: border-connected flood fill against the studio's near-white
 * seamless background (border-connected = white clothing inside the figure
 * is never removed), 1px alpha feather, then a baked "mist fade" — the
 * bottom ~30% of alpha eases to 0 so figures stand in light on ANY backdrop.
 * Output: src/assets/hero-cutouts/{name}-800w.webp and -480w.webp (alpha webp).
 * Also writes scripts-tmp/cutout-check/*.png — each cutout composited on the
 * hero's pastel wash for visual inspection.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";

const SRC = "src/assets";
const OUT = "src/assets/hero-cutouts";
const CHECK = "scripts-tmp/cutout-check";
mkdirSync(OUT, { recursive: true });
mkdirSync(CHECK, { recursive: true });

/* per-figure tuning: tolerance for joining the background region */
const FIGURES = [
  { name: "professional", file: "pro-face-main-800w.webp", tol: 24 },
  { name: "teacher", file: "teacher-hero-main-800w.webp", tol: 30 },
  { name: "student", file: "student-hero-main-800w.webp", tol: 30 },
  { name: "parent", file: "parent-hero-main-800w.webp", tol: 46 },
  { name: "organization", file: "org-face-main-800w.webp", tol: 32 },
];

const dist = (r, g, b, br, bg, bb) =>
  Math.max(Math.abs(r - br), Math.abs(g - bg), Math.abs(b - bb));

for (const f of FIGURES) {
  const input = path.join(SRC, f.file);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  /* background reference = median of all border pixels (robust to vignette) */
  const border = [];
  for (let x = 0; x < W; x++) { border.push(x); border.push((H - 1) * W + x); }
  for (let y = 1; y < H - 1; y++) { border.push(y * W); border.push(y * W + W - 1); }
  const chan = border.map((p) => { const i = p * C; return [data[i], data[i + 1], data[i + 2]]; });
  const med = (arr, k) => arr.map((v) => v[k]).sort((a, b) => a - b)[arr.length >> 1];
  const br = med(chan, 0), bg = med(chan, 1), bb = med(chan, 2);

  /* border-connected flood fill: everything reachable from the image border
     within tolerance of the background becomes transparent */
  const bgMask = new Uint8Array(W * H);
  const queue = [];
  const pushIfBg = (x, y) => {
    const p = y * W + x;
    if (bgMask[p]) return;
    const i = p * C;
    if (dist(data[i], data[i + 1], data[i + 2], br, bg, bb) <= f.tol) {
      bgMask[p] = 1;
      queue.push(p);
    }
  };
  for (let x = 0; x < W; x++) { pushIfBg(x, 0); pushIfBg(x, H - 1); }
  for (let y = 0; y < H; y++) { pushIfBg(0, y); pushIfBg(W - 1, y); }
  while (queue.length) {
    const p = queue.pop();
    const x = p % W, y = (p / W) | 0;
    if (x > 0) pushIfBg(x - 1, y);
    if (x < W - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < H - 1) pushIfBg(x, y + 1);
  }

  /* alpha: transparent where bg, plus baked mist fade over the bottom 30% */
  const alpha = Buffer.alloc(W * H, 255);
  for (let p = 0; p < W * H; p++) if (bgMask[p]) alpha[p] = 0;

  /* heal pinholes: a bg pixel whose 4 neighbours are all figure pixels is a
     leak inside the figure, not background */
  const isBg = (x, y) => bgMask[y * W + x] === 1;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (isBg(x, y) && !isBg(x - 1, y) && !isBg(x + 1, y) && !isBg(x, y - 1) && !isBg(x, y + 1)) {
        alpha[y * W + x] = 255;
      }
    }
  }
  const fadeStart = 0.7;
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    if (t > fadeStart) {
      const k = (t - fadeStart) / (1 - fadeStart);
      const damp = 1 - Math.pow(k, 1.5); /* ease-in fade to 0 at the bottom edge */
      for (let x = 0; x < W; x++) alpha[y * W + x] = Math.round(alpha[y * W + x] * damp);
    }
  }

  const rgba = Buffer.from(data);
  for (let p = 0; p < W * H; p++) rgba[p * C + 3] = alpha[p];

  /* 1px feather on the matte edge: blur alpha, keep interior solid */
  const feathered = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extractChannel(3).blur(0.8).raw().toBuffer();
  for (let p = 0; p < W * H; p++) {
    if (!bgMask[p]) {
      const a = feathered[p];
      rgba[p * C + 3] = Math.max(a, 8); /* never fully ghost interior pixels */
    }
  }

  const base = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
  await base.clone().resize(800).webp({ alphaQuality: 90, quality: 84 }).toFile(path.join(OUT, `${f.name}-800w.webp`));
  await base.clone().resize(480).webp({ alphaQuality: 90, quality: 84 }).toFile(path.join(OUT, `${f.name}-480w.webp`));

  /* inspection composite on the hero pastel wash */
  const wash = {
    create: {
      width: 900, height: 900, channels: 4,
      background: { r: 236, g: 241, b: 253, alpha: 1 },
    },
  };
  const washPng = await sharp(wash)
    .composite([
      {
        input: Buffer.from(
          `<svg width="900" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f0fe"/><stop offset="0.45" stop-color="#f3e8fd"/><stop offset="1" stop-color="#fdeee9"/></linearGradient></defs><rect width="900" height="900" fill="url(#g)"/></svg>`
        ),
      },
    ])
    .png().toBuffer();
  await sharp(washPng)
    .composite([{ input: await base.clone().resize(760).png().toBuffer(), gravity: "south" }])
    .png().toFile(path.join(CHECK, `${f.name}-on-wash.png`));

  console.log(`cutout ${f.name} done`);
}
console.log("ALL DONE");
