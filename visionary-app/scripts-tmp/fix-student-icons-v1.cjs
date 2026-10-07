/* Restore JOURNEY_STAGE_ICONS to StudentPage.jsx — 10-journey-flow's
   JourneyCategoryCard consumes it (2 call sites), but the map is missing in
   the stashed 1.0.99 tree, so the student page throws on first render.
   Insert before STAGE_META; all referenced icons exist in the lucide import.
   Idempotent. */
const fs = require("node:fs");
const P = "src/pages/landing/StudentPage.jsx";
let s = fs.readFileSync(P, "utf8");

if (s.includes("const JOURNEY_STAGE_ICONS")) {
  console.log("already present — no change");
  process.exit(0);
}
const anchor = "const STAGE_META = {";
if (!s.includes(anchor)) { console.error("ANCHOR MISSING"); process.exit(1); }

const MAP = [
  "/* Icons per journey-flow card (10 · JOURNEY FLOW) */",
  "const JOURNEY_STAGE_ICONS = {",
  '  "Primary": Sparkles,',
  '  "Secondary": BookOpen,',
  '  "Secondary and higher secondary": BookOpen,',
  '  "Higher secondary": Layers3,',
  '  "Competitive exams": Target,',
  '  "Vocational and skills": RefreshCw,',
  '  "Higher education": Brain,',
  '  "Learning on your own": Clock,',
  '  "Independent learning": Clock,',
  "};",
  "",
  "",
].join("\n");

s = s.replace(anchor, MAP + anchor);
fs.writeFileSync(P, s);
console.log("JOURNEY_STAGE_ICONS restored before STAGE_META");
