/** FAP-77 — Learn entry vocabulary: the authored-sample task family speaks the
 *  product's own words. Before, the Learn entry buttons and empty state said
 *  "sample" ("Try authored learning sample", "Try authored workplace sample",
 *  "Try a multi-book sample", "…try an authored sample.", "Authored
 *  mathematics sample") — internal fixture language a first-time learner
 *  cannot be expected to know. The law (HIG Writing → inclusivity:
 *  "Write for everyone… simple, plain language… avoiding jargon"): the entry
 *  task buttons call themselves example lessons in en/hi/bn, the empty state
 *  and the authored-mathematics view use the same words, the honest boundary
 *  sentence survives (these example lessons are not official curriculum
 *  coverage), no visible entry word contains "sample" or "legacy", and the
 *  working endpoints behind the words (SAMPLE_SELECTION,
 *  SAMPLE_LIBRARY_SELECTION, ?legacy=1 links) stay untouched. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workspace = readFileSync(new URL("../src/pages/dashboard/LearningWorkspace.jsx", import.meta.url), "utf8");
const learningCopy = readFileSync(new URL("../src/lib/learningCopy.js", import.meta.url), "utf8");
const catalogueCopy = readFileSync(new URL("../src/lib/learningCatalogueCopy.js", import.meta.url), "utf8");
const legacyCopy = readFileSync(new URL("../src/lib/legacyLearningCopy.js", import.meta.url), "utf8");
const guideCopy = readFileSync(new URL("../src/lib/guideCopy.js", import.meta.url), "utf8");
const mlReview = readFileSync(new URL("../scripts/ml-experience-review.mjs", import.meta.url), "utf8");
const studentReview = readFileSync(new URL("../scripts/student-review.mjs", import.meta.url), "utf8");

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Row anchored on the English key: a Devanagari hi cell and a Bengali bn cell follow. */
const trilingualRow = (enKey) => new RegExp(esc(`'${enKey}'`) + ",'[\\u0900-\\u097F][^']*','[\\u0980-\\u09FF][^']*'");
test("the two entry task buttons call themselves example lessons, not samples", () => {
  assert.match(workspace, /copy\(professional \? 'Try a workplace example lesson' : 'Try an example lesson'\)/,
    "the school/professional entry button pair uses example-lesson vocabulary");
  assert.match(workspace, /catalogueCopy\('Try examples from more books'\)/,
    "the multi-book entry button uses example-lesson vocabulary");
  assert.match(guideCopy, trilingualRow("Try an example lesson"),
    "Guide's example-lesson affordance (FAP-76) shares the same words");
});

test("the retired entry labels are gone from every copy table", () => {
  for (const [name, lib] of [["learningCopy", learningCopy], ["learningCatalogueCopy", catalogueCopy], ["legacyLearningCopy", legacyCopy]]) {
    assert.doesNotMatch(lib, /Try authored learning sample/, `${name} no longer carries the retired school label`);
    assert.doesNotMatch(lib, /Try authored workplace sample/, `${name} no longer carries the retired workplace label`);
    assert.doesNotMatch(lib, /Try a multi-book sample/, `${name} no longer carries the retired multi-book label`);
    assert.doesNotMatch(lib, /try an authored sample/, `${name} no longer tells the learner to try a "sample"`);
    assert.doesNotMatch(lib, /Authored mathematics sample/, `${name} no longer titles the authored view "sample"`);
    assert.doesNotMatch(lib, /This sample is not official curriculum coverage/, `${name} keeps the boundary sentence in current vocabulary`);
  }
});

test("the new entry vocabulary ships in en/hi/bn across all three copy tables", () => {
  assert.match(learningCopy, trilingualRow("Try an example lesson"), "school entry task in three locales");
  assert.match(learningCopy, trilingualRow("Try a workplace example lesson"), "workplace entry task in three locales");
  assert.match(catalogueCopy, trilingualRow("Try examples from more books"), "multi-book entry task in three locales");
  assert.match(catalogueCopy, trilingualRow("No subjects are listed for this context yet. Add a subject below or try an example lesson."),
    "the empty state routes to the example lesson in three locales");
  assert.match(legacyCopy, trilingualRow("Authored mathematics examples"), "the authored mathematics heading in three locales");
});

test("no entry-vocabulary row still says sample or legacy in any locale", () => {
  const rows = [
    [learningCopy, "Try an example lesson"],
    [learningCopy, "Try a workplace example lesson"],
    [catalogueCopy, "Try examples from more books"],
    [catalogueCopy, "No subjects are listed for this context yet. Add a subject below or try an example lesson."],
    [legacyCopy, "Authored mathematics examples"],
    [legacyCopy, "The cube model, explanation, questions, attempts and project stay with one saved concept. These example lessons are not official curriculum coverage."],
  ];
  for (const [lib, enKey] of rows) {
    const m = lib.match(new RegExp(esc(`'${enKey}'`) + ",'[^']*','[^']*'"));
    assert.ok(m, `row for '${enKey}' exists`);
    assert.doesNotMatch(m[0], /sample|legacy/i, `'${enKey}' row is free of fixture vocabulary in en, hi and bn`);
  }
});

test("the honest boundary sentence stays explicit in the example-lesson view", () => {
  assert.match(legacyCopy, /These example lessons are not official curriculum coverage\./,
    "the English boundary says exactly what these lessons are not");
  assert.match(legacyCopy, /'The cube model, explanation, questions, attempts and project stay with one saved concept\. These example lessons are not official curriculum coverage\.','[^']*','[^']*'/,
    "the boundary sentence survives inside the full notice in all three locales");
});

test("the working endpoints behind the new words are untouched", () => {
  assert.match(workspace, /import \{ getContentRepository, getSavedCurriculumGraphs, SAMPLE_SELECTION, SAMPLE_LIBRARY_SELECTION, PROFESSIONAL_SAMPLE_SELECTION \} from '@\/services\/contentRepository';/,
    "the sample selections still come from the content repository");
  assert.match(workspace, /openOutline\(professional \? PROFESSIONAL_SAMPLE_SELECTION : SAMPLE_SELECTION\)/,
    "the example-lesson button still opens the authored selection");
  assert.match(workspace, /openOutline\(SAMPLE_LIBRARY_SELECTION\)/,
    "the multi-book button still opens the sample library selection");
  assert.match(workspace, /to=\{practice \? '\/dashboard\/practice\?legacy=1' : '\/dashboard\/learn\?legacy=1'\}/,
    "the internal ?legacy=1 deep links keep working under the honest label");
});

test("review scripts follow the product vocabulary", () => {
  assert.equal(mlReview.split("{ name: 'Try an example lesson' }").length - 1, 2,
    "ml-experience-review clicks the example-lesson button at both sites");
  assert.doesNotMatch(mlReview, /Try authored/, "ml-experience-review no longer names the sample entry");
  assert.match(studentReview, /hasExamplePath: \/Try an example lesson\/i/, "student-review detects the example-lesson path");
  assert.match(studentReview, /\/Try an example lesson\/i\.test\(b\.textContent \|\| ''\)/, "student-review finds the button by its product label");
  assert.doesNotMatch(studentReview, /Try authored/, "student-review no longer names the sample entry");
});
