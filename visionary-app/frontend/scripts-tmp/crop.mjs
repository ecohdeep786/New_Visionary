/* Crop 1:1 regions from a capture for close inspection. */
import sharp from "sharp";
import fs from "node:fs";

const SRC = "C:/Users/Administrator/New_Visionary/visionary-app/artifacts/research/landing-redesign-2026-10-16/captures";
const OUT = `${SRC}/crops`;
fs.mkdirSync(OUT, { recursive: true });

const jobs = [
  // [file, left, top, width, height, name]
  ["our-landing-1440-full.jpg", 0, 500, 1440, 900, "landing-hero-stage"],
  ["our-landing-1440-full.jpg", 60, 3050, 1320, 420, "landing-category-cards-row1"],
  ["our-landing-1440-full.jpg", 60, 3470, 1320, 420, "landing-category-cards-row2"],
  ["our-landing-1440-full.jpg", 0, 4230, 1440, 700, "landing-journey-cards"],
  ["our-landing-390-full.jpg", 0, 0, 390, 1600, "landing-mobile-hero"],
];

for (const [file, left, top, width, height, name] of jobs) {
  await sharp(`${SRC}/${file}`)
    .extract({ left, top, width, height })
    .jpeg({ quality: 85 })
    .toFile(`${OUT}/${name}.jpg`);
  console.log(name);
}
