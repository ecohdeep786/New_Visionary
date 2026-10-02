/* Extract shared persona components from the five persona pages, normalize
   page-specific names/strings, and diff to find true styling variance. */
import { readFileSync } from "node:fs";

const PAGES = ["StudentPage", "TeacherPage", "ParentPage", "CollegePage", "OrganizationPage"];
const PREFIX = { StudentPage: "Student", TeacherPage: "Teacher", ParentPage: "Parent", CollegePage: "Pro", OrganizationPage: "Org" };

const SHARED = [
  "StruggleHeading",
  "StruggleCluster",
  "CarouselDots",
  "JourneyCarousel",
  "JourneyModal",
  "IntelligenceCopy",
  "IntelligenceVisual",
  "LanguageChips",
  "StageDropdown",
  "ContinuityCard",
  "AchievementAccordion",
  "JourneyCategoryCard",
  "TrustCard",
  "ExploreCard",
  "ChevronIcon",
  "VoiceIcon",
  "FadeReveal",
];

function extractComponent(src, name) {
  const start = src.search(new RegExp(`(const|function) ${name} = |(const|function) ${name}\\(`));
  if (start === -1) return null;
  const from = src.indexOf("\n", start) + 1;
  // components end with `});` on its own line (memo) or `}` for function
  const endMemo = src.indexOf("\n});", start);
  const endFn = src.indexOf("\n}", start);
  let end;
  if (endMemo !== -1 && (endFn === -1 || endMemo < endFn)) end = endMemo + 4;
  else if (endFn !== -1) end = endFn + 2;
  else return null;
  return src.slice(start, end);
}

function normalize(name, text, page) {
  const p = PREFIX[page];
  let t = text;
  // normalize the page prefix in identifiers and aria strings
  t = t.split(p + name).join("X" + name);
  t = t.split(p).join("PX");
  // normalize page-specific struggle words inside StruggleHeading
  if (name === "StruggleHeading") {
    t = t.replace(/<span className="block">[^<]*<\/span>/g, '<span className="block">W</span>');
  }
  return t;
}

const comps = {};
for (const page of PAGES) {
  const src = readFileSync(new URL(`../src/pages/landing/${page}.jsx`, import.meta.url), "utf8");
  comps[page] = {};
  for (const name of SHARED) {
    const raw = extractComponent(src, name);
    comps[page][name] = raw ? normalize(name, raw, page) : null;
  }
}

for (const name of SHARED) {
  const present = PAGES.filter((p) => comps[p][name] !== null);
  if (present.length === 0) { console.log(`\n### ${name}: NOT FOUND`); continue; }
  const ref = comps[present[0]][name];
  const identical = present.every((p) => comps[p][name] === ref);
  console.log(`\n### ${name}: ${identical ? "IDENTICAL (normalized)" : "VARIES"}`);
  if (!identical) {
    for (const p of present) {
      const same = comps[p][name] === ref;
      if (same) { console.log(`  ${p}: same as ${present[0]}`); continue; }
      // first differing line
      const a = ref.split("\n");
      const b = comps[p][name].split("\n");
      let i = 0;
      while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
      console.log(`  ${p}: differs from ${present[0]} at line ${i + 1}:`);
      console.log(`    ref: ${JSON.stringify(a[i]?.slice(0, 160))}`);
      console.log(`    got: ${JSON.stringify(b[i]?.slice(0, 160))}`);
    }
  }
}
