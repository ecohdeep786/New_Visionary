// Design-parity pass: remove soft/pastel fills, consolidate stray blues to #4285F4.
// Each edit = [file, [search, replace] pairs]; aborts if a search string is not found exactly once
// (unless :ALL flag) so partial application is impossible.
import { readFileSync, writeFileSync } from "node:fs";

const P = "src/pages/landing/";
const TILE_ERR_OLD = `<div className="flex h-12 w-12 items-center justify-center rounded-[16px]" style={{ backgroundColor: "#FCE8E6" }}>`;
const TILE_NEW = `<div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist }}>`;
const TILE_OK_OLD = `<div className="flex h-12 w-12 items-center justify-center rounded-[16px]" style={{ backgroundColor: COLORS.blueSoft }}>`;

const edits = [
  // ── ContactPage: one blue only, tiles lose pastel fills ──
  [P + "ContactPage.jsx", [
    ["#1a73e8", "#4285F4", ":ALL"],
    ['style={{ backgroundColor: COLORS.darkblue }}', 'style={{ backgroundColor: COLORS.blue }}', ":ALL"],
    ['  darkblue: "#4285F4",\n', "", ":ALL"], // decl line (hex already unified by pass 1)
    [TILE_ERR_OLD, TILE_NEW],
    [TILE_OK_OLD, TILE_NEW],
    ['  blueSoft: "#D2E3FC",\n', ""],
  ]],
  // ── PartnersPage / ReferralPage: tiles lose pastel fills ──
  [P + "PartnersPage.jsx", [
    [TILE_ERR_OLD, TILE_NEW],
    [TILE_OK_OLD, TILE_NEW],
    ['  blueSoft: "#D2E3FC",\n', ""],
  ]],
  [P + "ReferralPage.jsx", [
    [TILE_ERR_OLD, TILE_NEW],
    [TILE_OK_OLD, TILE_NEW],
    ['  blueSoft: "#D2E3FC",\n', ""],
  ]],
  // ── CareersPage: success banner pastel → hairline bordered, ink text ──
  [P + "CareersPage.jsx", [
    ['className="mt-6 rounded-[14px] px-5 py-4 text-[14px] leading-[1.6]" style={{ backgroundColor: "#E6F4EA", color: "#137333" }}',
     'className="mt-6 rounded-[14px] border px-5 py-4 text-[14px] leading-[1.6]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}'],
    ['  chipBg: "#D2E3FC",\n', ""],
  ]],
  // ── ResearchPage: success banner + Recommended badge ──
  [P + "ResearchPage.jsx", [
    ['className="mt-6 w-full rounded-[14px] px-5 py-4 font-normal tracking-[0] text-[14px]" style={{ backgroundColor: "#E6F4EA", color: "#137333" }}',
     'className="mt-6 w-full rounded-[14px] border px-5 py-4 font-normal tracking-[0] text-[14px]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}'],
    ['style={{ backgroundColor: COLORS.chipBg, color: COLORS.ink }}',
     'style={{ backgroundColor: COLORS.blue, color: "#ffffff" }}'],
    ['  chipBg: "#D2E3FC",\n', ""],
  ]],
  // ── AILearningPage (pricing): badges go solid blue/white; toggle chip loses pastel ──
  [P + "AILearningPage.jsx", [
    ['style={{ backgroundColor: billing === "annual" ? COLORS.chipBg : COLORS.surface, color: COLORS.ink }}',
     'style={{ backgroundColor: billing === "annual" ? "#ffffff" : COLORS.surface, color: COLORS.ink }}'],
    ['style={{ backgroundColor: COLORS.chipBg, color: COLORS.ink }}',
     'style={{ backgroundColor: COLORS.blue, color: "#ffffff" }}'],
    ['  chipBg: "#D2E3FC",\n', ""],
  ]],
  // ── CoachingPage: mock-UI pastels → neutral/blue ──
  [P + "CoachingPage.jsx", [
    ['<span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.chipBg }} />',
     '<span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />'],
    ['backgroundColor: isActive ? COLORS.chipBg : "transparent"',
     'backgroundColor: isActive ? COLORS.soft : "transparent"'],
    ['<span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.chipBg }}>',
     '<span className="flex h-10 w-10 items-center justify-center rounded-full border bg-white" style={{ borderColor: COLORS.mist }}>'],
    ['  chipBg: "#D2E3FC",\n', ""],
  ]],
  // ── Dead pastel declarations in already-clean pages ──
  [P + "SchoolPage.jsx", [[' chipBg: "#D2E3FC",', ""]]],
  [P + "CompetitiveExamsPage.jsx", [['  chipBg: "#D2E3FC",\n', ""]]],
  [P + "AccessibilityPage.jsx", [['  chipBg: "#D2E3FC",\n', ""]]],
  [P + "PrivacyPage.jsx", [['  chipBg: "#D2E3FC",\n', ""]]],
  [P + "ResearchNewsPage.jsx", [['  chipBg: "#D2E3FC",\n', ""]]],
  ["src/components/landing/AboutPageShared.jsx", [['  chipBg: "#D2E3FC",\n', ""]]],
];

let applied = 0, failed = [];
for (const [file, pairs] of edits) {
  let src = readFileSync(file, "utf8");
  for (const [search, replace, flag] of pairs) {
    const count = src.split(search).length - 1;
    if (flag === ":ALL") {
      if (count === 0) { failed.push(`${file} :: ${search.slice(0, 60)}`); continue; }
      src = src.split(search).join(replace);
      applied += count;
    } else {
      if (count !== 1) { failed.push(`${file} :: [${count}x] ${search.slice(0, 60)}`); continue; }
      src = src.replace(search, replace);
      applied += 1;
    }
  }
  writeFileSync(file, src);
}
console.log(`applied: ${applied}`);
if (failed.length) { console.log("FAILED:"); failed.forEach((f) => console.log("  " + f)); process.exit(1); }
console.log("all edits applied cleanly");
