/** FAP-79 — the create-a-class journey speaks one token color language.
 *  The research walk (docs/visionary/baseline/t03-research-2026-11-09/) measured
 *  the same journey painting its primary controls from two color systems:
 *  the workspace action token (--v-action: #0071e3 light / #aac7ff dark, one
 *  definition point) versus inline useThemeColor accent paints (#0b57d2 default,
 *  #137333 green) plus hardcoded Google blues (#0b57d2 Cancel, #4285F4 field
 *  focus). In dark mode the token system remaps; the inline/hardcoded paints do
 *  not — the Cancel text measured 2.69:1 over the dark dialog surface, below the
 *  product's own 4.5:1 informative law. The law (Apple HIG Color: "Avoid using
 *  the same color to mean different things. Use color consistently throughout
 *  your interface, especially when you use it to help communicate information
 *  like status or interactivity."): the journey's controls adopt the design
 *  system's control classes; the account accent stays on supported non-chrome
 *  accents. Copy, flow, field geometry, the class-color choices fieldset and
 *  the FAP-78 per-state singleton law are untouched. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { primaryWorkspaceCopy } from "../src/lib/primaryWorkspaceCopy.js";

const home = readFileSync(new URL("../src/pages/dashboard/role/TeacherHome.jsx", import.meta.url), "utf8");
const modal = readFileSync(new URL("../src/components/dashboard/teacher/CreateClassModal.jsx", import.meta.url), "utf8");
const assignLesson = readFileSync(new URL("../src/components/dashboard/AssignLesson.jsx", import.meta.url), "utf8");

const count = (s, needle) => s.split(needle).length - 1;

test("the modal submit paints from the workspace action token", () => {
  const submit = modal.match(/<button type="submit"[^\n]*\n[^\n]*<\/button>/) || modal.match(/<button type="submit"[\s\S]*?<\/button>/);
  assert.ok(submit, "the modal's primary submit exists");
  const markup = submit[0];
  assert.match(markup, /className="v-button primary"/,
    "the submit adopts the design-system primary classes (token paint + system states)");
  assert.doesNotMatch(markup, /style=\{\{/, "no inline backgroundColor paint on the submit");
  assert.doesNotMatch(markup, /h-10 rounded-full px-5/, "no override-of-system sizing paint classes on the submit");
});

test("the modal Cancel is a token secondary control, not a Google-blue text paint", () => {
  const cancel = modal.match(/<button type="button"[^\n]*onClick=\{onClose\}[^\n]*<\/button>/);
  assert.ok(cancel, "the modal Cancel exists");
  const markup = cancel[0];
  assert.match(markup, /className="v-button"/,
    "the Cancel adopts the design-system secondary classes (token paint; automatic dark remap)");
  assert.doesNotMatch(markup, /text-\[#0b57d2\]/, "the Cancel no longer hardcodes the Google-blue text");
  assert.doesNotMatch(markup, /hover:bg-\[#ffffff\]/, "the Cancel's hover state comes from the system law, not a white paint");
  assert.equal(count(modal, "0b57d2"), 0, "no Google-blue #0b57d2 paint remains in the modal");
});

test("the modal field focus paints from the action token, legacy Google blue gone", () => {
  assert.match(modal, /focus:border-\[var\(--v-action\)\] focus:ring-1 focus:ring-\[var\(--v-action\)\]/,
    "the fields' focus paint follows the workspace action token (the established input pattern)");
  assert.equal(count(modal, "4285F4"), 1,
    "#4285F4 appears exactly once in the file — the class-color choices data, no focus paint classes");
  assert.doesNotMatch(modal, /focus:border-\[#4285F4\]/, "no hardcoded legacy focus border");
  assert.doesNotMatch(modal, /focus:ring-\[#4285F4\]/, "no hardcoded legacy focus ring");
});

test("the modal no longer receives or paints an inline accent", () => {
  assert.doesNotMatch(modal, /accent/, "CreateClassModal carries no accent prop or paint");
  assert.equal(count(home, "backgroundColor: accent"), 0,
    "TeacherHome no longer paints any interactive control with the inline accent");
  assert.equal(count(home, "<CreateClassModal"), 1, "the modal is still rendered once");
  assert.doesNotMatch(home, /CreateClassModal[^>]*accent/, "the call passes no accent prop");
});

test("the teacher empty-state CTA paints with the same token classes as the header control", () => {
  const zeroAt = home.indexOf("classes.length === 0 ? ");
  const gridAt = home.indexOf("classes.map(c => <ClassCard");
  assert.ok(zeroAt > -1 && gridAt > zeroAt, "the zero-classes branch exists before the grid");
  const emptyBranch = home.slice(zeroAt, gridAt);
  assert.match(emptyBranch, /className="v-button primary"/,
    "the empty-state CTA now paints from the token system — one paint per journey");
  assert.doesNotMatch(emptyBranch, /h-10 px-6 rounded-full/, "no override sizing paint classes on the CTA");
  // the account accent remains ONLY on supported non-chrome accents (cards/spinner)
  const chromeUses = (home.match(/accent=\{accent\}/g) || []).length;
  assert.equal(chromeUses, 2, "accent passes to the insight + upskilling cards only");
  const spinnerUse = home.indexOf("borderTopColor: accent");
  assert.ok(spinnerUse > -1, "the loading spinner keeps its supported accent wash");
});

test("the per-state create law and flow independence stay intact (FAP-78 unchanged)", () => {
  assert.match(home, /\{classes\.length > 0 && <button onClick=\{\(\)=>setShowCreate\(true\)\} className="v-button primary"><Plus size=\{18\} aria-hidden="true"\/>\{copy\("Create class"\)\}<\/button>\}/);
  assert.equal(count(home, "setShowCreate(true)"), 3,
    "deep-link effect + gated header + empty-state CTA (no new open-modal call site)");
  assert.equal(count(home, "{showCreate && <CreateClassModal"), 1, "the modal render stays unconditional");
});

test("the class-color choices fieldset stays data-driven and unchanged", () => {
  assert.match(modal, /const COLORS = \[\["Blue", "#4285F4"\], \["Green", "#137333"\], \["Red", "#b3261e"\], \["Purple", "#7627bb"\], \["Teal", "#007b83"\], \["Slate", "#4f647a"\]\]/,
    "the six class-color choices keep their data values (they carry data, not chrome)");
  assert.match(modal, /aria-label=\{copy\(label\)\} aria-pressed=\{form\.color === color\}/,
    "the swatch anatomy is untouched");
});

test("no copy changed — the journey's labels still resolve through the cascade", () => {
  const en = primaryWorkspaceCopy("en"), hi = primaryWorkspaceCopy("hi"), bn = primaryWorkspaceCopy("bn");
  assert.equal(en("Create class"), "Create class");
  assert.notEqual(hi("Create class"), "Create class");
  assert.notEqual(bn("Create class"), "Create class");
  assert.equal(en("Create your first class"), "Create your first class");
  assert.notEqual(hi("Create your first class"), "Create your first class");
  assert.notEqual(bn("Create your first class"), "Create your first class");
  assert.equal(en("Cancel"), "Cancel");
});

test("journey-adjacent dialogs keep their own token controls untouched", () => {
  assert.match(assignLesson, /className="v-button primary" disabled=\{busy \|\| !classId\}/,
    "AssignLesson dialog's primary stays the token control");
  assert.equal(count(assignLesson, "backgroundColor"), 0, "AssignLesson paints no inline accent");
});
