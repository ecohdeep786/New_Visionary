/* Positional repair for the 4 category pages + AILearning useRef prune. */
import { readFileSync, writeFileSync } from "fs";

for (const f of ["TeacherPage", "ParentPage", "CollegePage", "OrganizationPage"]) {
  const p = `src/pages/landing/${f}.jsx`;
  let c = readFileSync(p, "utf8");
  const marker = c.indexOf("── DESIGN TOKENS + CONTROLLERS");
  const end = c.indexOf("function UseStageIndex(total) {");
  if (marker < 0 || end < 0) { console.log(f, "markers missing"); continue; }
  const lineStart = c.lastIndexOf("/*", marker);
  if (lineStart < 0 || lineStart > end) { console.log(f, "unexpected layout"); continue; }
  c = c.slice(0, lineStart) +
    `/* ── DESIGN TOKENS + CONTROLLERS (from the shared landing system) ── */
const COLORS = { ...colorTokens, grey: colorTokens.slate };

` +
    c.slice(end);
  writeFileSync(p, c);
  console.log(f, "positionally repaired");
}

{
  const p = "src/pages/landing/AILearningPage.jsx";
  let c = readFileSync(p, "utf8");
  const m = c.match(/import (React, )?\{([^}]+)\} from ["']react["'];/);
  if (m) {
    const kept = m[2].split(",").map((s) => s.trim()).filter((n) => n !== "useRef");
    c = c.replace(m[0], `import React${kept.length ? `, { ${kept.join(", ")} }` : ""} from "react";`);
    writeFileSync(p, c);
    console.log("AILearningPage useRef pruned");
  }
}
