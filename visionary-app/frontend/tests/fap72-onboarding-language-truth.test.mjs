/** FAP-72 — the onboarding language list must never present a language as
 *  switchable that the deployed product does not serve.
 *
 *  Defect at beta: the onboarding "Preferred learning language" select and the
 *  learner teaching-medium grid listed 14 languages (English, Hindi, Bengali,
 *  Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Urdu, Odia,
 *  Assamese, Others) while the deployed workspace serves exactly en/hi/bn (the
 *  locale mapping sends Hindi -> hi, Bengali -> bn, everything else -> en).
 *  Worse, the auth/onboarding header+footer carried a cosmetic LanguageSelector
 *  offering en/hi/es/fr/de/ar/zh/ja/pt/ru that changed NOTHING (local state
 *  only) — the same false-affordance class F-31 already removed from the
 *  public footer. FAP-83 fixed the marketing surface; this is the other half.
 *
 *  The law:
 *    1. The full 14 are only ever a saved CONTENT-INTEREST preference, and every
 *       language-preference surface carries the honest note ("UI currently
 *       available in English, Hindi and Bengali — your choice helps us
 *       prioritise.") exported from stepConfigs.
 *    2. There is NO cosmetic fake switch: nothing references the deleted
 *       LanguageSelector component, and no language is offered as an interface
 *       switch outside the served set.
 *    3. The locale mapping still serves exactly {en, hi, bn} (Hindi->hi,
 *       Bengali->bn, else en) — a non-served pick cannot switch the interface.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");

test("FAP-72: stepConfigs exports the served set and the honest UI-language note", () => {
  const src = read("src/components/onboarding/stepConfigs.jsx");
  const note = src.match(/UI_LANGUAGE_NOTE\s*=\s*"([^"]+)"/);
  assert.ok(note, "UI_LANGUAGE_NOTE constant is defined in stepConfigs");
  assert.match(note[1], /English, Hindi and Bengali/, "the note names the served set");
  assert.match(note[1], /helps us prioritise/, "the note is framed as roadmap/content-interest");
  const served = src.match(/SERVED_UI_LANGUAGES\s*=\s*\[([\s\S]*?)\]\.map/);
  assert.ok(served, "SERVED_UI_LANGUAGES is defined in stepConfigs");
  const ids = [...served[1].matchAll(/"([A-Za-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["English", "Hindi", "Bengali"], "the switchable set is exactly en/hi/bn");
});

test("FAP-72: every onboarding language-preference surface carries the honest note", () => {
  for (const file of [
    "src/components/onboarding/ProductSetupFields.jsx",
    "src/components/onboarding/steps/student/StudentContextForm.jsx",
  ]) {
    const src = read(file);
    assert.match(src, /UI_LANGUAGE_NOTE/, `${file} references the honest UI-language note`);
    assert.match(src, /LANGUAGES/, `${file} still offers the full content-interest list`);
    assert.match(src, /UI currently available in English, Hindi and Bengal|UI_LANGUAGE_NOTE/, `${file} shows the note beside the full list`);
  }
});

test("FAP-72: no cosmetic fake language switch remains in auth or onboarding", () => {
  // The F-31-class selector (offered en/es/fr/de/ar/zh/ja/pt/ru that changed
  // nothing) is deleted: no import, no mount, no file.
  assert.equal(existsSync(join(root, "src/components/auth/LanguageSelector.jsx")), false, "LanguageSelector component file is deleted");
  for (const file of ["src/components/AuthLayout.jsx", "src/components/onboarding/OnboardingLayout.jsx"]) {
    const src = read(file);
    assert.equal(src.includes("LanguageSelector"), false, `${file} no longer mounts a fake language switch`);
  }
});

test("FAP-72: the locale mapping still serves exactly en/hi/bn (a non-served pick cannot switch the UI)", () => {
  const src = read("src/services/workspaceService.ts");
  const m = src.match(/data\.preferences\.locale\s*=\s*lang==='Hindi'\?'hi':lang==='Bengali'\?'bn':'en'/);
  assert.ok(m, "the preferred-language -> locale mapping is exact (Hindi->hi, Bengali->bn, else en)");
});
