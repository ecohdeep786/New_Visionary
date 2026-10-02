/* Fixes the two unify.mjs defects: the stale-offset slice corruption in the
 * category pages, and the React-import prune that missed `import React, {…}`. */
import { readFileSync, writeFileSync } from "fs";

/* 1. Category pages: remove the orphaned UseScrollTrack tail + merged comment */
const corrupted = `/* ══════════════════════════════════════════════════════════════════/* ── DESIGN TOKENS + CONTROLLERS (from the shared landing system) ── */
const COLORS = { ...colorTokens, grey: colorTokens.slate };

current;
    if (!t) return;
    const card = t.querySelector("[data-card]");
    if (!card) return;
    const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
    t.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: "smooth" });
  }, []);
  return { trackRef, canPrev, canNext, scrollByCard, update };
}

`;
const clean = `/* ── DESIGN TOKENS + CONTROLLERS (from the shared landing system) ── */
const COLORS = { ...colorTokens, grey: colorTokens.slate };

`;
for (const f of ["TeacherPage", "ParentPage", "CollegePage", "OrganizationPage"]) {
  const p = `src/pages/landing/${f}.jsx`;
  let c = readFileSync(p, "utf8");
  if (!c.includes(corrupted)) { console.log(f, "corrupt block not found — check manually"); continue; }
  c = c.replace(corrupted, clean);
  writeFileSync(p, c);
  console.log(f, "repaired");
}

/* 2. Info pages: prune the exact unused React names ESLint flagged */
const flagged = {
  AILearningPage: ["useEffect"],
  CoachingPage: ["useRef"],
  CookiesPage: ["useRef"],
  DownloadPage: ["useRef"],
  SecurityPage: ["useRef"],
  PrivacyPage: ["useRef"],
  SchoolPage: ["useRef"],
  TermsPage: ["useRef"],
};
for (const [f, unused] of Object.entries(flagged)) {
  const p = `src/pages/landing/${f}.jsx`;
  let c = readFileSync(p, "utf8");
  const m = c.match(/import (React, )?\{([^}]+)\} from ["']react["'];/);
  if (!m) { console.log(f, "react import not found"); continue; }
  const names = m[2].split(",").map((s) => s.trim()).filter(Boolean);
  const kept = names.filter((n) => !unused.includes(n));
  const replacement = m[1]
    ? `import React${kept.length ? `, { ${kept.join(", ")} }` : ""} from "react";`
    : `import { ${kept.join(", ")} } from "react";`;
  c = c.replace(m[0], replacement);
  writeFileSync(p, c);
  console.log(f, "pruned", unused.join(","));
}
