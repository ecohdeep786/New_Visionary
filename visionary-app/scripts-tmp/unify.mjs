/*
 * Re-applies the landing-system unification after the parallel-work revert:
 * category pages get aliased system imports (PascalCase hook names preserved),
 * info pages get token/font dedupe + duplicate-hook stripping, and every
 * touched file gets the radius/rhythm sweep. Idempotent: files already
 * converted are skipped.
 */
import { readFileSync, writeFileSync } from "fs";

const CATEGORY_PAGES = ["TeacherPage", "ParentPage", "CollegePage", "OrganizationPage"];
const INFO_PAGES = [
  "AILearningPage", "CoachingPage", "CareersPage", "CookiesPage", "DownloadPage",
  "SecurityPage", "PrivacyPage", "ResearchNewsPage", "SchoolPage", "TermsPage",
];
const SYSTEM_KEYS = ["ink", "slate", "lightGrey", "blue", "deepBlue", "chipBg", "track", "mist", "surface", "cardSurface", "cardSurfaceAlt", "white", "grey"];

const stripFn = (src, name) => {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return src;
  const open = src.indexOf("{", start);
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) break; }
  }
  return src.slice(0, start) + src.slice(i + 1).replace(/^\n+/, "\n");
};

for (const f of CATEGORY_PAGES) {
  const p = `src/pages/landing/${f}.jsx`;
  let c = readFileSync(p, "utf8");
  if (c.includes("system/hooks")) { console.log(f, "already converted"); continue; }
  const personaLine = 'import PersonaHero from "@/components/landing/NewPersona";';
  const m1 = c.indexOf("/* ── DESIGN TOKENS ── */");
  const m2 = c.indexOf("function UseStageIndex(total) {");
  if (!c.includes(personaLine) || m1 < 0 || m2 < 0) { console.log(f, "MARKERS MISSING"); continue; }
  c = c.replace(
    personaLine,
    personaLine + `
import {
  color as colorTokens,
  fontStack as FONT_FAMILY,
} from "@/components/landing/system/tokens";
import {
  useCycleIndex as UseCycleIndex,
  useRevealOnce as UseRevealOnce,
  useRevealContinuous as UseRevealContinuous,
  useActiveStep as UseActiveStep,
  useHorizontalTrack as UseScrollTrack,
} from "@/components/landing/system/hooks";`
  );
  c =
    c.slice(0, m1) +
    `/* ── DESIGN TOKENS + CONTROLLERS (from the shared landing system) ── */
const COLORS = { ...colorTokens, grey: colorTokens.slate };

` +
    c.slice(m2);
  c = c
    .split("rounded-[50px]").join("rounded-[28px]")
    .split("COLORS.grey").join("COLORS.slate")
    .split("py-24 lg:py-32").join("py-20 lg:py-28");
  writeFileSync(p, c);
  console.log(f, "converted");
}

for (const f of INFO_PAGES) {
  const p = `src/pages/landing/${f}.jsx`;
  let c = readFileSync(p, "utf8");
  if (c.includes("system/hooks")) { console.log(f, "already converted"); continue; }
  const changes = [];

  const cStart = c.indexOf("const COLORS = {");
  if (cStart >= 0) {
    const cOpen = c.indexOf("{", cStart);
    let depth = 0, i = cOpen, end = -1;
    for (; i < c.length; i++) {
      if (c[i] === "{") depth++;
      else if (c[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    const body = c.slice(cOpen + 1, end);
    const kept = body
      .split("\n")
      .filter((l) => {
        const m = l.match(/^  (\w+):/);
        return m && !SYSTEM_KEYS.includes(m[1]) && l.trim();
      });
    c =
      c.slice(0, cStart) +
      "const COLORS = {\n  ...colorTokens," +
      (kept.length ? "\n" + kept.join("\n") : "") +
      "\n};" +
      c.slice(end + 1);
    changes.push(`colors(${kept.length} kept)`);
  }

  c = c.replace(/const FONT_FAMILY = ['"].*['"];\r?\n?/, "");
  changes.push("font");

  const stripped = [];
  for (const h of ["useRevealOnce", "useCycleIndex", "useActiveStep"]) {
    if (c.includes(`function ${h}(`)) {
      c = stripFn(c, h);
      stripped.push(h);
    }
  }
  if (stripped.length) changes.push(`hooks: ${stripped.join(",")}`);

  const needsTokens = c.includes("colorTokens") || c.includes("FONT_FAMILY");
  if (needsTokens || stripped.length) {
    const imports = [];
    if (needsTokens) imports.push('import { color as colorTokens, fontStack as FONT_FAMILY } from "@/components/landing/system/tokens";');
    if (stripped.length) imports.push(`import { ${stripped.join(", ")} } from "@/components/landing/system/hooks";`);
    const anchor = 'import LandingFooter from "@/components/landing/LandingFooter";';
    if (c.includes(anchor)) c = c.replace(anchor, anchor + "\n" + imports.join("\n"));
    else {
      const lastImport = c.lastIndexOf("import ");
      const lineEnd = c.indexOf("\n", lastImport);
      c = c.slice(0, lineEnd + 1) + imports.join("\n") + "\n" + c.slice(lineEnd + 1);
    }
  }

  /* prune React named imports that lost their only user */
  const m = c.match(/import \{([^}]+)\} from ["']react["'];/);
  if (m) {
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    const used = names.filter((n) =>
      new RegExp(`[^\\w."]${n}\\b`).test(c.replace(m[0], 'import { } from "react";'))
    );
    if (used.length !== names.length) {
      c = c.replace(m[0], used.length ? `import { ${used.join(", ")} } from "react";` : "");
      changes.push(`react pruned: ${names.filter((n) => !used.includes(n)).join(",")}`);
    }
  }

  writeFileSync(p, c);
  console.log(f, "|", changes.join(", ") || "no changes");
}
