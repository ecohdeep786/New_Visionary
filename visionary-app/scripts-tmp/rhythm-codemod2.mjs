/* Council day-3 — hat 03 codemod #2: per-unit fix driven by drift-queue.json.
   For each drift row: find the heading by text fragment, read its font expression
   (clamp(...) or fixed px), and replace the sub's fixed mt-N with
   mt-[calc(<fontExpr>*<ratio@1440>)] — desktop-identical, fluid everywhere. */
import { readFileSync, writeFileSync } from "fs";

const ROUTE_FILE = {
  "/": "src/pages/Landing.jsx",
  "/student": "src/pages/landing/StudentPage.jsx",
  "/teacher": "src/pages/landing/TeacherPage.jsx",
  "/parent": "src/pages/landing/ParentPage.jsx",
  "/professional": "src/pages/landing/CollegePage.jsx",
  "/organization": "src/pages/landing/OrganizationPage.jsx",
  "/about": "src/pages/landing/CompetitiveExamsPage.jsx",
  "/pricing": "src/pages/landing/AILearningPage.jsx",
  "/download": "src/pages/landing/ResearchPage.jsx",
  "/research": "src/pages/landing/ResearchNewsPage.jsx",
  "/careers": "src/pages/landing/CareersPage.jsx",
  "/community": "src/pages/landing/CommunityPage.jsx",
  "/contact": "src/pages/landing/ContactPage.jsx",
  "/partners": "src/pages/landing/PartnersPage.jsx",
  "/updates": "src/pages/landing/UpdatesPage.jsx",
  "/referral": "src/pages/landing/ReferralPage.jsx",
  "/safety": "src/pages/landing/SafetyPage.jsx",
  "/privacy": "src/pages/landing/PrivacyPage.jsx",
  "/terms": "src/pages/landing/TermsPage.jsx",
  "/security": "src/pages/landing/SecurityPage.jsx",
  "/accessibility": "src/pages/landing/AccessibilityPage.jsx",
  "/cookies": "src/pages/landing/CookiesPage.jsx",
};

const queue = JSON.parse(readFileSync("scripts-tmp/drift-queue.json", "utf8")).filter((r) => !/^(Learning,|Teaching\.|Parenting\.|Building\.|Leading\.)/.test(r.unit));
const HERO_EXEMPT = queue.filter((r) => /^(Learning,|Teaching\.|Parenting\.|Building\.|Leading\.)/.test(r.unit));
console.log(`hero-exempt rows: ${HERO_EXEMPT.length} · per-unit rows: ${queue.length}`);

let done = 0, failed = [];
for (const row of queue) {
  const file = ROUTE_FILE[row.route];
  if (!file) { failed.push(row.route + " no-file"); continue; }
  let src = readFileSync(file, "utf8");
  const kind = row.unit.includes("[eyebrow]") ? "eyebrow" : "sub";
  const clean = row.unit.replace(" [eyebrow]", "").replace(/\s+/g, " ").trim();
  let frag = clean.slice(0, 14);
  const fragTry = [frag, clean.slice(0, 10), clean.slice(0, 7), clean.slice(0, 5)];
  const lines = src.split("\n");
  // find the line containing the heading text fragment
  let textLine = -1;
  for (const f of fragTry) {
    for (let i = 0; i < lines.length; i++) {
      if (f && lines[i].includes(f)) { textLine = i; break; }
    }
    if (textLine >= 0) break;
  }
  if (textLine < 0) { failed.push(row.route + " frag-not-found: " + frag); continue; }
  // walk back to the heading opening tag
  let open = textLine;
  while (open > 0 && !/<h[123][\s>]/.test(lines[open])) open--;
  if (open < 0 || !/<h[123]/.test(lines[open])) { failed.push(row.route + " open-not-found"); continue; }
  // collect the heading tag
  let tagEnd = open;
  while (!lines[tagEnd].includes(">") && tagEnd < open + 8) tagEnd++;
  const tagStr = lines.slice(open, tagEnd + 1).join("\n");
  // font expression: clamp(...) or text-[Npx]
  const clampM = tagStr.match(/clamp\(([\d.]+px,\s*[\d.]+vw,\s*[\d.]+px)\)/);
  const fixedM = tagStr.match(/text-\[([\d.]+px)\]/);
  const stepped = tagStr.match(/text-\[([\d.]+px)\]([^\]]*)sm:text-\[([\d.]+px)\]/);
  let fontExpr = null;
  if (clampM) fontExpr = `clamp(${clampM[1].replace(/\s+/g, "")})`;
  else if (fixedM) fontExpr = fixedM[1];
  else if (stepped) fontExpr = null; // stepped fonts handled separately below
  if (!fontExpr) { failed.push(row.route + " no-font-expr"); continue; }

  const r1440 = row.ratios["1440"] ?? row.ratios["1920"];
  if (!r1440) { failed.push(row.route + " no-ratio"); continue; }

  if (kind === "eyebrow") {
    // the heading's own mt-N (gap to the eyebrow above it)
    const m = tagStr.match(/mt-(\d+)((?:\s+(?:sm|md|lg|xl):mt-[\d.]+px)*)/);
    if (!m) { failed.push(row.route + " no-own-mt"); continue; }
    const repl = `mt-[calc(${fontExpr}*${r1440})]${m[2] || ""}`;
    const newTag = tagStr.replace(m[0], repl);
    src = src.replace(tagStr, newTag);
    writeFileSync(file, src);
    done++;
    continue;
  }
  // sub: the first <p ...> with mt-N within 4 lines after the heading close
  for (let k = tagEnd + 1; k < Math.min(tagEnd + 6, lines.length); k++) {
    if (!/<p[\s>]/.test(lines[k])) { if (/<(div|section|ul|table|figure|img|svg|h[123])/.test(lines[k])) break; continue; }
    const m = lines[k].match(/mt-(\d+)((?:\s+(?:sm|md|lg|xl):mt-[\d.]+px)*)/);
    if (!m) break;
    const repl = `mt-[calc(${fontExpr}*${r1440})]${m[2] || ""}`;
    lines[k] = lines[k].replace(m[0], repl);
    src = lines.join("\n");
    writeFileSync(file, src);
    done++;
    break;
  }
}
console.log(`per-unit fixed: ${done} · failed: ${failed.length}`);
failed.forEach((f) => console.log("  FAIL", f));
