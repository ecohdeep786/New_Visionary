/** FAP-76 — Ask's no-answer state leads with the user outcome, not service jargon.
 *  Before, the not_connected teaching reply opened with "Visionary Guide's
 *  teaching service is not connected." (backend plumbing first) and offered
 *  no next step. The law: the first user-visible sentence states the outcome
 *  (question saved; no model answer generated in this workspace), the honest
 *  truthfulness boundary stays explicit, and the same reply state carries a
 *  concrete working affordance (Try an example lesson → suggested journey, or
 *  Learn; plus Return Home). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const teachingInterface = readFileSync(new URL("../src/services/teachingInterface.ts", import.meta.url), "utf8");
const guide = readFileSync(new URL("../src/pages/dashboard/Guide.jsx", import.meta.url), "utf8");
const guideCopy = readFileSync(new URL("../src/lib/guideCopy.js", import.meta.url), "utf8");

test("the no-answer copy leads with the user outcome, per locale", () => {
  for (const line of ['Your question is saved in this workspace.', 'आपका प्रश्न इस कार्यक्षेत्र में सहेजा गया है।', 'আপনার প্রশ্ন এই কর্মক্ষেত্রে সংরক্ষিত হয়েছে।']) {
    assert.match(teachingInterface, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "outcome-first opening sentence must survive");
  }
});

test("the no-answer copy no longer opens with service plumbing jargon", () => {
  assert.doesNotMatch(teachingInterface, /en: 'Visionary Guide’s teaching service is not connected\./,
    "the jargon-first opening sentence is gone");
  assert.doesNotMatch(teachingInterface, /hi: 'Visionary Guide की शिक्षण सेवा/, "hi no longer leads with service name");
  assert.doesNotMatch(teachingInterface, /bn: 'Visionary Guide-এর শিক্ষণ/, "bn no longer leads with service name");
});

test("the no-answer copy keeps the truthful boundary: no model answer was generated", () => {
  assert.match(teachingInterface, /no model answer has been generated\./, "en keeps the explicit no-model-answer claim");
  assert.match(teachingInterface, /मॉडल से कोई उत्तर नहीं बनाया गया है।/, "hi keeps the explicit no-model-answer claim");
  assert.match(teachingInterface, /মডেল থেকে কোনো উত্তর তৈরি করা হয়নি।/, "bn keeps the explicit no-model-answer claim");
});

test("the Ask reply state carries a working next-step affordance for not_connected replies", () => {
  assert.match(guide, /message\.status === 'not_connected' \? <div className="mt-3 flex flex-wrap gap-2">\{suggestions\.length \? <button/,
    "a next-step row renders with the not_connected reply");
  assert.match(guide, /openActivity\(suggestions\[0\]\.id\)/, "the affordance opens a suggested example-lesson activity in place");
  assert.match(guide, /to="\/dashboard\/learn"><BookOpen size=\{16\} \/>\{copy\("Try an example lesson"\)/, "fallback affordance points at Learn when no journey is suggested");
  assert.match(guide, /\{copy\("Return Home"\)\}/, "a second concrete destination (Home) is offered");
});

test("the Ask source label no longer leads with service jargon", () => {
  assert.doesNotMatch(guide, /'not_connected' \? copy\("Teaching service not connected"\)/, "the jargon label is retired");
  assert.match(guide, /'not_connected' \? copy\("Your question is saved · no model answer yet"\)/,
    "the label states the saved outcome with the honest boundary");
  assert.match(guideCopy, /\['Try an example lesson','उदाहरण पाठ आज़माएँ','উদাহরণ পাঠ চেষ্টা করুন'\]/,
    "the affordance label ships in en/hi/bn");
  assert.match(guideCopy, /\['Return Home','होम पर लौटें','হোমে ফিরে যান'\]/,
    "the second destination label ships in en/hi/bn");
});

test("safety and blocked paths are untouched by this change", () => {
  assert.match(teachingInterface, /en: 'Your safety matters\./, "crisis response copy unchanged");
  assert.match(teachingInterface, /status: 'blocked', source: 'safety'/, "blocked path unchanged");
});
