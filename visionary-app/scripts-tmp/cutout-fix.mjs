/* Cutout fix: every corner cutout takes the color of the surface behind its
   card (white on white sections, #f8f9fa on the grey band). Pocket pill
   buttons enlarged to the ROLES spec (min-h-[44px] px-6 text-[14px]). */
import fs from "node:fs";

const EDITS = [
  /* tint-colored cutouts -> band color (rounded-tl- prefixes only exist on cutouts) */
  ["src/pages/landing/AILearningPage.jsx", 'rounded-tl-[20px]" style={{ backgroundColor: "#e8f0fe" }}', 'rounded-tl-[20px] bg-white" ', true],
  ["src/pages/landing/CareersPage.jsx", "rounded-tl-[16px] bg-[#e8f0fe]", "rounded-tl-[16px] bg-white", true],
  ["src/pages/landing/ContactPage.jsx", "rounded-tl-[20px] bg-[#e8f0fe]", "rounded-tl-[20px] bg-white", true],
  ["src/pages/landing/DownloadPage.jsx", "rounded-tl-[24px] bg-[#e8f0fe]", "rounded-tl-[24px] bg-white", true],
  ["src/pages/landing/CookiesPage.jsx", "rounded-tl-[20px] bg-[#e8f0fe]", "rounded-tl-[20px] bg-white", true],
  ["src/pages/landing/CookiesPage.jsx", "rounded-tl-[14px] bg-[#e8f0fe]", "rounded-tl-[14px] bg-white", true],
  ["src/pages/landing/SafetyPage.jsx", "rounded-tl-[20px] bg-[#e8f0fe]", "rounded-tl-[20px] bg-white", true],
  ["src/pages/landing/SecurityPage.jsx", "rounded-tl-[20px] bg-[#e8f0fe]", "rounded-tl-[20px] bg-white", true],
  ["src/pages/landing/SecurityPage.jsx", "rounded-tl-[14px] bg-[#e8f0fe]", "rounded-tl-[14px] bg-white", true],
  ["src/pages/landing/TermsPage.jsx", "rounded-tl-[20px] bg-[#e8f0fe]", "rounded-tl-[20px] bg-white", true],
  ["src/pages/landing/TermsPage.jsx", "rounded-tl-[14px] bg-[#e8f0fe]", "rounded-tl-[14px] bg-white", true],
  ["src/pages/landing/CommunityPage.jsx", 'rounded-tl-[20px]" style={{ backgroundColor: card.tint }}', 'rounded-tl-[20px] bg-white"', true],
  ["src/pages/landing/CommunityPage.jsx", 'rounded-tl-[20px]" style={{ backgroundColor: item.tint }}', 'rounded-tl-[20px] bg-[#f8f9fa]"', true],
  /* Research: white cutouts + enlarged Explore pills (same spec as About ROLES) */
  ["src/pages/landing/ResearchNewsPage.jsx", "rounded-tl-[20px] bg-[#e8f0fe]", "rounded-tl-[24px] bg-white", true],
  ["src/pages/landing/ResearchNewsPage.jsx",
    'className="absolute bottom-0 right-0 h-[64px] w-[160px]',
    'className="absolute bottom-0 right-0 h-[72px] w-[192px]', true],
  ["src/pages/landing/ResearchNewsPage.jsx",
    'min-h-[40px] items-center gap-1.5 rounded-full bg-[#0b57d0] px-4 text-[13px]',
    'min-h-[44px] items-center gap-1.5 rounded-full bg-[#0b57d0] px-6 text-[14px]', true],
  ["src/pages/landing/ResearchNewsPage.jsx",
    "google.com card curve — tint sweeps into the white corner and the card's action floats in it with breath",
    "google.com card curve — a page-background cutout sweeps into the bottom-right corner and the card's action floats in it with breath", true],
];

let applied = 0, missed = [];
for (const [file, from, to, g] of EDITS) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes(from)) { missed.push([file, from.slice(0, 55)]); continue; }
  fs.writeFileSync(file, g ? src.split(from).join(to) : src.replace(from, to));
  applied++;
}
console.log(`applied: ${applied}/${EDITS.length}`);
if (missed.length) { console.log("MISSED:"); missed.forEach((m) => console.log("  " + m.join(" :: "))); process.exitCode = 1; }
