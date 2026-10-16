/* Slice full-page screenshots into readable chunks (720px wide). */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC = "C:/Users/Administrator/New_Visionary/shots";
const OUT = "C:/Users/Administrator/New_Visionary/shots/slices";
fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => f.endsWith("-full.png"));
const CHUNK = 2000;

for (const file of files) {
  const base = file.replace("-full.png", "");
  const img = sharp(path.join(SRC, file));
  const meta = await img.metadata();
  const total = Math.ceil(meta.height / CHUNK);
  for (let i = 0; i < total; i++) {
    const top = i * CHUNK;
    const height = Math.min(CHUNK, meta.height - top);
    await sharp(path.join(SRC, file))
      .extract({ left: 0, top, width: meta.width, height })
      .resize({ width: 720 })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, `${base}-${String(i).padStart(2, "0")}.png`));
  }
  console.log(`${base}: ${total} slices`);
}
