// CRLF-tolerant cleanup: drop now-dead pastel color declarations.
import { readFileSync, writeFileSync } from "node:fs";

const targets = [
  "src/pages/landing/ContactPage.jsx",
  "src/pages/landing/PartnersPage.jsx",
  "src/pages/landing/ReferralPage.jsx",
  "src/pages/landing/CareersPage.jsx",
  "src/pages/landing/ResearchPage.jsx",
  "src/pages/landing/AILearningPage.jsx",
  "src/pages/landing/CoachingPage.jsx",
  "src/pages/landing/CompetitiveExamsPage.jsx",
  "src/pages/landing/AccessibilityPage.jsx",
  "src/pages/landing/PrivacyPage.jsx",
  "src/pages/landing/ResearchNewsPage.jsx",
  "src/pages/landing/SchoolPage.jsx",
  "src/components/landing/AboutPageShared.jsx",
];
let removed = 0;
for (const file of targets) {
  let src = readFileSync(file, "utf8");
  for (const key of ["blueSoft", "chipBg", "darkblue"]) {
    const re = new RegExp(`^[ \\t]*${key}: "#(?:4285F4|D2E3FC)",\\r?\\n`, "m");
    if (re.test(src)) {
      src = src.replace(re, "");
      removed += 1;
      console.log(`${file}: removed ${key}`);
    }
  }
  // collapse any resulting double blank line inside the COLORS object
  src = src.replace(/\{\r?\n\r?\n/g, "{\n");
  writeFileSync(file, src);
}
console.log(`removed ${removed} dead declarations`);
