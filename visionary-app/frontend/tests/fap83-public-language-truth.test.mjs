/** FAP-83 — the public language showcase must state the served set (en/hi/bn).
 *
 *  Defect at beta f8321b8d: all five persona pages shipped a voice dial that
 *  advertised six languages — LANGUAGE_CHIPS carried ta/kn/pa entries and the
 *  question rows carried native-script questions for Tamil, Kannada, and
 *  Punjabi — while the deployed product serves exactly English, Hindi, and
 *  Bengali (the voice engine maps en/hi/bn to en-IN/hi-IN/bn-IN; the mentor
 *  intent router covers en/hi/bn). The shared small print claimed "understood
 *  in every language" on every persona page, the section eyebrow defaulted to
 *  "Every language", and /organization carried the headline "Your
 *  organization. In every language." plus a feature card "In every language."
 *
 *  Why it matters: a Tamil, Kannada, or Punjabi-speaking visitor is promised a
 *  working product in their language at the strongest moment of the marketing
 *  journey, registers, and then finds English, Hindi, and Bengali only — a
 *  broken promise at the conversion step, contradicting the site's own honest
 *  statements (/accessibility "Three languages today", /updates, /partners).
 *  (Apple reference: availability stated concretely next to aspirational
 *  headlines — the "Available in U.S. English" pattern.)
 *
 *  The law (PremiumLanguageSection.jsx + the five persona pages): the dial
 *  carries exactly the served set {en, hi, bn}; question rows are keyed by
 *  served codes only; the small print names the three languages and carries
 *  the roadmap line; no "every language" claim appears in the section copy or
 *  its callers. The in-app onboarding list is FAP-72's separate surface.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const PAGES = ["StudentPage", "TeacherPage", "ParentPage", "CollegePage", "OrganizationPage"];
const pagePaths = PAGES.map((p) => join(root, "src/pages/landing", `${p}.jsx`));
const sectionPath = join(root, "src/components/landing/persona/premium/PremiumLanguageSection.jsx");

const read = (p) => readFileSync(p, "utf8");

/** Strip JS block comments, line comments and JSX comment wrappers so the
 *  "every language" scan only sees real copy (the law comment itself states
 *  the prohibition). */
function withoutComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1");
}

function chipsBlock(text) {
  const m = text.match(/const\s+(?:\w+_)?LANGUAGE_CHIPS\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(m, "LANGUAGE_CHIPS array found");
  return m[1];
}

const codesIn = (block) => [...block.matchAll(/code:\s*"([a-z]+)"/g)].map((m) => m[1]);

test("FAP-83: every persona voice dial carries exactly the served language set (en/hi/bn)", () => {
  for (const path of pagePaths) {
    const codes = codesIn(chipsBlock(read(path)));
    assert.deepEqual(
      [...codes].sort(),
      ["bn", "en", "hi"],
      `${path}: chips must be exactly en/hi/bn (served set)`
    );
  }
});

test("FAP-83: no unserved ta/kn/pa codes or question keys remain in the persona pages", () => {
  for (const path of pagePaths) {
    const src = read(path);
    assert.ok(!/code:\s*"(ta|kn|pa)"/.test(src), `${path}: no unserved chip codes`);
    assert.ok(!/\b(ta|kn|pa):\s*"/.test(src), `${path}: no unserved question keys`);
  }
});

test("FAP-83: the shared small print names the served languages and the roadmap", () => {
  const src = read(sectionPath);
  assert.match(src, /understood in English, Hindi, and Bengali/, "legend names the served set");
  assert.match(src, /More languages are on the roadmap/, "roadmap line present");
});

test("FAP-83: the section eyebrow defaults to an honest personal phrase", () => {
  const src = read(sectionPath);
  assert.match(src, /eyebrow\s*=\s*"Your language"/, 'default eyebrow is "Your language"');
  assert.ok(!/eyebrow\s*=\s*"Every language"/.test(src), 'default eyebrow is not "Every language"');
});

test("FAP-83: no 'every language' claim in section copy or its five callers", () => {
  const sources = [read(sectionPath), ...pagePaths.map(read)];
  for (const [i, src] of sources.entries()) {
    const copy = withoutComments(src);
    assert.ok(
      !/every language/i.test(copy),
      `${[sectionPath, ...pagePaths][i]}: copy must not claim 'every language'`
    );
  }
});

test("FAP-83: /professional eyebrow and /organization claims carry the honest phrasing", () => {
  const college = read(pagePaths[3]);
  assert.match(college, /eyebrow="Your language"/, "professional eyebrow honest");
  const org = read(pagePaths[4]);
  assert.match(org, /accent="In your people's languages"/, "organization h2 honest");
  assert.match(org, /In the languages your people think in/, "organization feature card honest");
  assert.match(org, /could support English, Hindi, and Bengali/, "organization card describes the languages under development");
});
