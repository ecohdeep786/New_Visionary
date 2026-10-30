#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * FAP-F1 final production pass — policy-surface chapterize codemod
 * (2026-10-29, dependency-free, one-off + retained as the recorded step).
 *
 * Applies `data-section` stage tags to the six remaining public document
 * surfaces (privacy, terms, security, cookies, accessibility, /help) so the
 * canonical measured chapter law reaches them, and retags the three authored
 * strip bands on careers/download onto the established compact-band law.
 *
 * Per chapter section:
 *   - add `data-section="<NN>-<doc-id>"` (page-local stage names; "0N"-web
 *     style 01-hero stays authored)
 *   - drop hand-set block paddings (py-14/py-16/py-24/py-32/pb-24/py-12)
 *     so public-bridge.css's measured var(--public-section-py) law carries
 *     them (the page-scoped override adds Apple's live-measured document
 *     band: clamp(6rem, 12.5vw, 10rem), evidence per the F1 receipt)
 *   - keep horizontal gutters (px-6 sm:px-8 lg:px-10), authored mirrors,
 *     internal hairlines and scroll-mt offsets exactly as authored
 *   - add the page-* scope class the other converted pages already carry
 *
 * Every rule must apply EXACTLY once or the script fails loudly.
 * ────────────────────────────────────────────────────────────────────────── */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "pages", "landing");

const docRule = (stage, id) => ({
  find: `<section id="${id}" className="scroll-mt-24 py-14 sm:py-16">`,
  replace: `<section id="${id}" data-section="${stage}-${id}" className="scroll-mt-24">`,
  label: `chapter ${stage}-${id}`,
});
const keyTermsRule = stage => ({
  find: `<section aria-labelledby="key-terms-title" className="px-6 py-16 sm:px-8 lg:px-10 lg:py-20">`,
  replace: `<section data-section="${stage}-key-terms" aria-labelledby="key-terms-title" className="px-6 sm:px-8 lg:px-10">`,
  label: `chapter ${stage}-key-terms`,
});
const relatedRule = stage => ({
  find: `<section aria-label="Related policies" className="border-t border-[rgba(18,19,23,0.12)] px-6 py-20 sm:px-8 lg:px-10">`,
  replace: `<section data-section="${stage}-related" aria-label="Related policies" className="border-t border-[rgba(18,19,23,0.12)] px-6 sm:px-8 lg:px-10">`,
  label: `chapter ${stage}-related`,
});
const questionsRule = stage => ({
  find: `<section aria-label="Questions about this policy" className="border-t border-[rgba(18,19,23,0.12)] px-6 py-14 sm:px-8 lg:px-10">`,
  replace: `<section data-section="${stage}-questions" aria-label="Questions about this policy" className="border-t border-[rgba(18,19,23,0.12)] px-6 sm:px-8 lg:px-10">`,
  label: `chapter ${stage}-questions`,
});
const rootRule = (page, file) => ({
  find: `<div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>`,
  replace: `<div className="page-${page} min-h-screen bg-white" style={{ fontFamily: fontStack }}>`,
  label: `root page-${page}`,
});

/* Privacy / Terms / Security / Cookies share the whole layout skeleton; only
   the doc ids, stage numbers and scope class differ. */
const docPlans = [
  ["PrivacyPage.jsx", [
    ["privacy-summary-title", "02-summary"],
    ["what-we-collect", "03"], ["purpose", "04"], ["sharing", "05"],
    ["your-controls", "06"], ["security", "07"], ["data-requests", "08"],
    ["retention", "09"], ["younger-learners", "10"], ["explainers", "11"],
    ["grievance-officer", "12"],
  ], "privacy", 13],
  ["TermsPage.jsx", [
    ["terms-summary-title", "02-summary"],
    ["who-can-use", "03"], ["what-you-can-do", "04"], ["what-you-cannot-do", "05"],
    ["what-we-provide", "06"], ["your-content", "07"], ["your-account", "08"],
    ["plans-payments", "09"], ["changes", "10"], ["restriction", "11"],
    ["responsibility", "12"], ["disputes", "13"], ["contact", "14"],
  ], "terms", 15],
  ["SecurityPage.jsx", [
    ["security-summary-title", "02-summary"],
    ["your-information", "03"], ["protected-in-transit", "04"],
    ["protected-when-stored", "05"], ["access-controlled", "06"],
    ["your-control", "07"], ["security-over-time", "08"],
    ["report-security", "09"], ["commitments", "10"],
    ["sync-devices", "11"], ["contact", "12"],
  ], "security", 13],
  ["CookiesPage.jsx", [
    ["cookies-summary-title", "02-summary"],
    ["what-cookies-are", "03"], ["principles", "04"], ["types", "05"],
    ["preferences", "06"], ["managing", "07"], ["contact", "08"],
  ], "cookies", 9],
];

const rules = {};
for (const [file, chapters, page, tailStage] of docPlans) {
  const list = [rootRule(page, file)];
  for (const [id, stage] of chapters) list.push(docRule(stage, id));
  list.push(keyTermsRule(tailStage), relatedRule(tailStage + 1), questionsRule(tailStage + 2));
  rules[file] = list;
}

rules["AccessibilityPage.jsx"] = [
  rootRule("accessibility", "AccessibilityPage.jsx"),
  {
    find: `<section className="border-y border-[rgba(18,19,23,0.12)] px-6 py-24 sm:px-8 lg:px-10 lg:py-32">`,
    replace: `<section data-section="03-statement" className="border-y border-[rgba(18,19,23,0.12)] px-6 sm:px-8 lg:px-10">`,
    label: "chapter 03-statement",
  },
  {
    find: "          <section\n            key={category.id}\n            id={category.id}\n            aria-labelledby={`${category.id}-title`}\n            className={`scroll-mt-28 px-6 py-16 sm:px-8 lg:px-10 lg:py-24 ${category.band}`}\n          >",
    replace: "          <section\n            key={category.id}\n            data-section={`04-${category.id}`}\n            id={category.id}\n            aria-labelledby={`${category.id}-title`}\n            className={`scroll-mt-28 px-6 sm:px-8 lg:px-10 ${category.band}`}\n          >",
    label: "chapters 04-<category>",
  },
  {
    find: `<section id="sync" aria-labelledby="sync-title" className="scroll-mt-28 px-6 py-16 sm:px-8 lg:px-10 lg:py-24">`,
    replace: `<section id="sync" data-section="05-sync" aria-labelledby="sync-title" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">`,
    label: "chapter 05-sync",
  },
  {
    find: `<section id="resources" aria-labelledby="resources-title" className="scroll-mt-28 border-t border-[rgba(18,19,23,0.12)] px-6 py-16 sm:px-8 lg:px-10 lg:py-24">`,
    replace: `<section id="resources" data-section="06-resources" aria-labelledby="resources-title" className="scroll-mt-28 border-t border-[rgba(18,19,23,0.12)] px-6 sm:px-8 lg:px-10">`,
    label: "chapter 06-resources",
  },
  {
    find: `<section aria-labelledby="commitment-title" className="border-t border-[rgba(18,19,23,0.12)] px-6 py-16 sm:px-8 lg:px-10 lg:py-24">`,
    replace: `<section data-section="07-commitment" aria-labelledby="commitment-title" className="border-t border-[rgba(18,19,23,0.12)] px-6 sm:px-8 lg:px-10">`,
    label: "chapter 07-commitment",
  },
  {
    find: `<section aria-labelledby="closing-title" className="px-6 pb-24 sm:px-8 lg:px-10">`,
    replace: `<section data-section="08-closing" aria-labelledby="closing-title" className="px-6 sm:px-8 lg:px-10">`,
    label: "chapter 08-closing",
  },
];

rules["SchoolPage.jsx"] = [
  rootRule("school", "SchoolPage.jsx"),
  {
    find: `<section className="relative bg-white px-6 py-24 lg:py-32">`,
    replace: `<section data-section="02-discover" className="relative bg-white px-6">`,
    label: "chapter 02-discover",
  },
  {
    find: `<section className="relative px-6 py-24" style={{ backgroundColor: COLORS.surface }}>`,
    replace: `<section data-section="03-contact" className="relative px-6" style={{ backgroundColor: COLORS.surface }}>`,
    label: "chapter 03-contact",
  },
];

rules["CareersPage.jsx"] = [
  {
    find: `<section aria-label="Life at Visionary" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">`,
    replace: `<section data-section="01b-life" aria-label="Life at Visionary" className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">`,
    label: "strip 01b-life",
  },
];

rules["DownloadPage.jsx"] = [
  {
    find: `<section ref={ref} className="relative bg-white px-6 pb-24" style={{ fontFamily: fontStack }}>`,
    replace: `<section ref={ref} data-section="02b-tray" className="relative bg-white px-6" style={{ fontFamily: fontStack }}>`,
    label: "strip 02b-tray",
  },
  {
    find: `<section ref={ref} className="relative px-6 py-12" style={{ backgroundColor: COLORS.white, fontFamily: fontStack }}>`,
    replace: `<section ref={ref} data-section="04b-strip" className="relative px-6" style={{ backgroundColor: COLORS.white, fontFamily: fontStack }}>`,
    label: "strip 04b-strip",
  },
];

let failed = false;
const report = [];
for (const [file, list] of Object.entries(rules)) {
  const full = path.join(root, file);
  let text = fs.readFileSync(full, "utf8");
  for (const rule of list) {
    const count = text.split(rule.find).length - 1;
    if (count !== 1) {
      report.push(`FAIL ${file} :: ${rule.label} :: matches=${count}`);
      failed = true;
      continue;
    }
    text = text.replace(rule.find, rule.replace);
    report.push(`ok   ${file} :: ${rule.label}`);
  }
  fs.writeFileSync(full, text, "utf8");
}
console.log(report.join("\n"));
if (failed) { console.error("codemod aborted: rules must apply exactly once"); process.exit(1); }
console.log(`done: ${Object.keys(rules).length} files chapterized`);
