/* Slice capture jpgs into readable chunks (720px wide) for viewing. */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC = "C:/Users/Administrator/New_Visionary/visionary-app/artifacts/research/landing-redesign-2026-10-16/captures";
const OUT = path.join(SRC, "slices");
fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => f.endsWith("-full.jpg"));
const CHUNK = 1800;

for (const file of files) {
  const base = file.replace("-full.jpg", "");
  const img = sharp(path.join(SRC, file));
  const meta = await img.metadata();
  const total = Math.ceil(meta.height / CHUNK);
  for (let i = 0; i < total; i++) {
    const top = i * CHUNK;
    const height = Math.min(CHUNK, meta.height - top);
    await sharp(path.join(SRC, file))
      .extract({ left: 0, top, width: meta.width, height })
      .resize({ width: 720 })
      .jpeg({ quality: 78 })
      .toFile(path.join(OUT, `${base}-${String(i).padStart(2, "0")}.jpg`));
  }
  console.log(`${base}: ${total} slices`);
}
