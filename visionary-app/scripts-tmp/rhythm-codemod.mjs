/* Council day-3 — hat 03 codemod: ratio-lock every heading-own / heading→sub
   fixed gap using the heading's own clamp expression. Desktop-pixel-identical:
   R = desktopGap / fontAt1440, gap becomes calc(clamp*R) → ratio constant. */
import { readFileSync, writeFileSync } from "fs";

const FILES = [
  "AILearningPage", "CoachingPage", "CollegePage", "CompetitiveExamsPage", "OrganizationPage",
  "ParentPage", "ResearchPage", "TeacherPage", "StudentPage", "CareersPage", "CommunityPage",
  "ContactPage", "PartnersPage", "ReferralPage", "SafetyPage", "SecurityPage",
  "AccessibilityPage", "CookiesPage", "UpdatesPage", "PrivacyPage",
].map((f) => `src/pages/landing/${f}.jsx`).concat(["src/pages/Landing.jsx", "src/components/landing/AboutPageShared.jsx"]);

const px1440 = (clamp) => {
  const m = clamp.match(/clamp\(([\d.]+)px,\s*([\d.]+)vw,\s*([\d.]+)px\)/);
  if (!m) return parseFloat(clamp); // fixed px
  return Math.min(parseFloat(m[3]), (parseFloat(m[2]) * 1440) / 100);
};

let fixed = 0, skipped = 0;
for (const file of FILES) {
  let src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    // find a heading opening tag (may span lines: capture className across the tag)
    if (!/<h[123][\s>]/.test(lines[i])) continue;
    // collect the full tag
    let tag = lines[i], j = i;
    while (!tag.includes(">") && j < i + 6) { j++; tag += "\n" + lines[j]; }
    const clsM = tag.match(/className="([^"]*)"/);
    if (!clsM) continue;
    const clampM = clsM[1].match(/clamp\(([\d.]+px,\s*[\d.]+vw,\s*[\d.]+px)\)/);
    if (!clampM) { continue; }
    const clamp = clampM[1].replace(/\s+/g, ""); // clamp(36px,5vw,72px)
    const base = px1440(clamp);

    const lockGap = (gapPx, cls) => {
      const m = cls.match(/mt-(\d+)((?:\s+(?:sm|md|lg|xl|2xl):mt-\d+)*)/);
      if (!m) return null;
      const R = (parseInt(m[1]) * 4) / base;
      if (R <= 0 || R > 2.0) return null;
      const repl = `mt-[calc(${clamp}*${Math.round(R * 1000) / 1000})]${m[2] || ""}`;
      return { cls: cls.replace(m[0], repl), R };
    };

    // case 1: heading's OWN mt-N (eyebrow→heading gap)
    if (/mt-\d+/.test(clsM[1])) {
      const res = lockGap(null, clsM[1]);
      if (res) {
        const newTag = tag.replace(clsM[1], res.cls);
        if (newTag !== tag) {
          const parts = newTag.split("\n");
          for (let k = 0; k < parts.length; k++) lines[i + k] = parts[k];
          src = lines.join("\n");
          // re-sync lines var
          const reSplit = src.split("\n");
          for (let k = 0; k < lines.length; k++) lines[k] = reSplit[k];
          changed = true; fixed++;
        }
      }
    }

    // case 2: heading→sub — the next <p> with mt-N within 4 lines after the heading closes
    const closeIdx = i + tag.split("\n").length - 1;
    for (let k = closeIdx + 1; k < Math.min(closeIdx + 5, lines.length); k++) {
      if (!/<p[\s>]/.test(lines[k])) { if (/<(div|section|ul|table|figure|img|svg|h[123])/.test(lines[k])) break; continue; }
      const pClsM = lines[k].match(/className="([^"]*)"/);
      if (pClsM && /mt-\d+/.test(pClsM[1])) {
        const res = lockGap(null, pClsM[1]);
        if (res) {
          lines[k] = lines[k].replace(pClsM[1], res.cls);
          src = lines.join("\n");
          changed = true; fixed++;
        }
      }
      break;
    }
  }
  if (changed) { writeFileSync(file, src); console.log(file.split("/").pop(), "updated"); }
  else skipped++;
}
console.log(`gap pairs ratio-locked: ${fixed} · files untouched: ${skipped}`);
