#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * FAP-F1 chapterize — completion pass (2026-10-29).
 *
 * Run after f1-policy-chapterize.mjs; completes the two rule sets the first
 * pass left unapplied (logged as matches=0):
 *   1. the per-page summary chapter ("The essentials, at a glance" plates)
 *      — the first pass built these with the chapter-id rule shape they
 *      don't carry (openers use aria-labelledby, not id)
 *   2. the Accessibility feature-category loop opener — multi-line block;
 *      the first pass's literal \n pattern missed the file's CRLF endings.
 * Every rule must apply EXACTLY once or the script fails loudly; the CRLF
 * sequences below are the recorded file encoding.
 * ────────────────────────────────────────────────────────────────────────── */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "pages", "landing");

const summaryRule = (file, label, stage) => ({
  file,
  find: `<section className="py-12" aria-labelledby="${label}">`,
  replace: `<section data-section="${stage}" aria-labelledby="${label}">`,
  label: `chapter ${stage}`,
});

const rules = [
  summaryRule("PrivacyPage.jsx", "privacy-summary-title", "02-summary"),
  summaryRule("TermsPage.jsx", "terms-summary-title", "02-summary"),
  summaryRule("SecurityPage.jsx", "security-summary-title", "02-summary"),
  summaryRule("CookiesPage.jsx", "cookies-summary-title", "02-summary"),
  {
    file: "AccessibilityPage.jsx",
    find: "          <section\r\n            key={category.id}\r\n            id={category.id}\r\n            aria-labelledby={`${category.id}-title`}\r\n            className={`scroll-mt-28 px-6 py-16 sm:px-8 lg:px-10 lg:py-24 ${category.band}`}\r\n          >",
    replace: "          <section\r\n            key={category.id}\r\n            data-section={`04-${category.id}`}\r\n            id={category.id}\r\n            aria-labelledby={`${category.id}-title`}\r\n            className={`scroll-mt-28 px-6 sm:px-8 lg:px-10 ${category.band}`}\r\n          >",
    label: "chapters 04-<category>",
  },
];

let failed = false;
for (const rule of rules) {
  const full = path.join(root, rule.file);
  const text = fs.readFileSync(full, "utf8");
  const count = text.split(rule.find).length - 1;
  if (count !== 1) {
    console.log(`FAIL ${rule.file} :: ${rule.label} :: matches=${count}`);
    failed = true;
    continue;
  }
  fs.writeFileSync(full, text.replace(rule.find, rule.replace), "utf8");
  console.log(`ok   ${rule.file} :: ${rule.label}`);
}
if (failed) process.exit(1);
console.log("completion pass done");
