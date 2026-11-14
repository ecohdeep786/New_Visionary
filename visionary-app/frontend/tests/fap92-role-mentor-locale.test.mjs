/** FAP-92 — the role-mentor home module speaks the interface language.
 *  Before: every role-mentor panel on Home (teacher, parent, professional,
 *  organization) was ~100% hardcoded English even when the interface locale was
 *  हिन्दी or বাংলা: panel headings, evidence-table headers, notices, the
 *  "Summary unavailable"/"Retry"/"Loading your authorized summary…" states and
 *  the footer all rendered in English, and the "Your next capability" heading
 *  leaked into an otherwise localized Hindi/Bengali page although its
 *  translation already existed in professionalCopy. Reproduced live on merged
 *  beta 1e25f633 (Hindi/বাংলা home walk: h2 "Your next capability" + "Microphone
 *  idle…" + "Show getting started" strays, 0 console errors). The law: every
 *  string in the role-mentor module is keyed in roleMentorCopy with en, hi and
 *  bn translations; service data that reaches the panel is localized through
 *  exact-match entries (relationship statuses, the closed period set from
 *  mentorStateService, MasteryStage via the professionalCopy →
 *  learningProgressText chain) and unknown data falls back to English honestly;
 *  service error messages stay English but are marked lang="en" like the Guide
 *  load-error convention; no output ever leaks a {param} marker. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { roleMentorCopy } from "../src/lib/roleMentorCopy.js";

const panel = readFileSync(new URL("../src/components/dashboard/RoleMentorPanel.jsx", import.meta.url), "utf8");

// Every authored string of the role-mentor module. The three professional keys
// inherited through professionalCopy are asserted separately below.
const keys = [
  "No shared evidence yet. An empty history is not a learning gap.",
  "Shared concept evidence, aggregated without learner identities",
  "Learning evidence summary",
  "Objective",
  "Checks",
  "Review signals",
  "Evidence stage",
  "Learning objective {number}",
  "Reference",
  "{correct} / {total} correct",
  "No checks yet",
  "1 learner",
  "{count} learners",
  "Teaching workspace",
  "Your own growth",
  "Class evidence and your own learning stay separate. Private learner doubts are not included.",
  "Assigned class",
  "{pending} submissions awaiting review · {shared} of {total} learners have shared evidence.",
  "No assigned class is connected. You can prepare independently or connect a class.",
  "Open classes",
  "Continue preparation",
  "Open lesson drafts",
  "Quiz, lesson plan, and teacher coach",
  "Requests use the teaching-service connection. No model answer is generated while it is disconnected. Only class-level evidence is attached.",
  "What are you preparing?",
  "Lesson plan",
  "Quiz for class review needs",
  "Teacher coach",
  "Objective or question",
  "Describe the objective and the support you need. Avoid personal learner details.",
  "Requesting…",
  "Request teaching support",
  "Draft title",
  "Editable preparation",
  "Write your own outline here, or review a connected service response before saving.",
  "Save preparation draft",
  "Preparation saved locally as an unreviewed draft. Open Prepare to review and assign it.",
  "Your own growth: {count} capabilities with recorded activity. This is separate from the class summary.",
  "Your child’s week",
  "Read-only progress shared with you. Private questions, conversations, notes, and drafts remain private.",
  "Child",
  "Rule-based observations from shared evidence, not a model assessment.",
  "No learning activity has been shared for this period. Ask what they would like to explore, without treating missing activity as a problem.",
  "{count} completed applications in this period.",
  "Shared learning evidence",
  "No child currently shares a progress summary with you. A pending, expired, or revoked connection does not grant access.",
  "Connection status",
  "Manage child connections",
  "Open shared report",
  "Your target guides the same learning, practice, and building loop. An employer does not gain access to this personal evidence.",
  "{count} capabilities have checks to revisit. This is based on recorded attempts, not an assessment of your employability.",
  "No review gap is indicated by your recorded checks. Keep building varied evidence.",
  "No skill gap has been assessed yet. Choose a target, then build evidence through practice and projects.",
  "Update career target",
  "Set a career target",
  "For example, make better data-informed decisions",
  "Save target",
  "Capabilities to revisit",
  "Build your portfolio",
  "Career workspace",
  "{count} saved projects · Share work explicitly; do not paste confidential employer material.",
  "Career target saved locally in your personal workspace.",
  "Organization readiness",
  "Operational totals and explicitly shared class evidence only. Individual personal learning is not included.",
  "Learner denominator: distinct active enrollments in linked classes.",
  "Linked classes",
  "Active memberships",
  "Learners in linked classes",
  "Submissions awaiting review",
  "Hidden",
  "People and permissions",
  "{count} active memberships",
  "Cohorts",
  "{count} saved groups",
  "Curriculum",
  "{count} reviewed mappings",
  "Teaching library",
  "{count} reviewed resources",
  "Learning totals are hidden for groups or concepts with fewer than {count} contributing learners.",
  "Shared concept totals",
  "Summary unavailable",
  "Retry",
  "Choose an available connection",
  "Manage connections",
  "Loading your authorized summary…",
  "Local preview · No live model, identity verification, or cloud synchronization.",
];

test("FAP-92: every role-mentor panel string exists with en identity plus hi and bn translations", () => {
  for (const key of keys) {
    assert.equal(roleMentorCopy("en")(key), key, `en identity for: ${key}`);
    assert.notEqual(roleMentorCopy("hi")(key), key, `hi is translated for: ${key}`);
    assert.notEqual(roleMentorCopy("bn")(key), key, `bn is translated for: ${key}`);
  }
});

test("FAP-92: no output ever leaks an unreplaced {param} marker", () => {
  for (const key of keys.filter(key => /\{\w+\}/.test(key))) {
    const names = [...key.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
    const params = Object.fromEntries(names.map(name => [name, 3]));
    for (const locale of ["en", "hi", "bn"]) {
      const value = roleMentorCopy(locale)(key, params);
      assert.doesNotMatch(value, /\{/, `${locale} output for "${key}" replaced every marker: ${value}`);
      for (const name of names) assert.ok(value.includes("3"), `${locale} output for "${key}" used ${name}: ${value}`);
    }
  }
});

test("FAP-92: professional keys and MasteryStage data resolve through the inherited chain", () => {
  assert.equal(roleMentorCopy("hi")("Your next capability"), "आपका अगला कौशल");
  assert.equal(roleMentorCopy("bn")("Your next capability"), "আপনার পরের দক্ষতা");
  assert.equal(roleMentorCopy("hi")("Capability or role target"), "कौशल या भूमिका का लक्ष्य");
  assert.equal(roleMentorCopy("hi")("What would useful progress look like?"), "उपयोगी प्रगति कैसी होगी?");
  assert.equal(roleMentorCopy("hi")("Practicing"), "अभ्यास जारी", "MasteryStage values localize for the evidence-stage column");
  assert.equal(roleMentorCopy("bn")("Needs review"), "পর্যালোচনা দরকার");
});

test("FAP-92: service data uses exact-match entries and falls back to English honestly", () => {
  for (const status of ["pending", "active", "declined", "expired", "revoked"]) {
    assert.notEqual(roleMentorCopy("hi")(status), status, `relationship status ${status} is translated`);
    assert.notEqual(roleMentorCopy("bn")(status), status, `relationship status ${status} is translated`);
  }
  for (const period of ["Last 7 days", "Last 30 days", "Last 7 days of recorded class evidence", "Last 30 days of recorded class evidence", "All saved local class records"]) {
    assert.notEqual(roleMentorCopy("hi")(period), period, `period ${period} is translated`);
    assert.notEqual(roleMentorCopy("bn")(period), period, `period ${period} is translated`);
  }
  assert.equal(roleMentorCopy("hi")("SomeUnrecordedDataValue"), "SomeUnrecordedDataValue", "unknown data falls back to English, it is never invented");
});

test("FAP-92: the panel wires roleMentorCopy through every sub-panel and the evidence table", () => {
  assert.match(panel, /function EvidenceTable\(\{ locale, rows, aggregate = false \}\) \{\n  const t = roleMentorCopy\(locale\);/, "the evidence table receives the locale");
  assert.match(panel, /function TeacherPanel\(\{ ctx, locale, view, onSelect, onNotice \}\) \{\n  const t = roleMentorCopy\(locale\);/);
  assert.match(panel, /function ParentPanel\(\{ locale, view, onSelect \}\) \{\n  const t = roleMentorCopy\(locale\);/);
  assert.match(panel, /function ProfessionalPanel\(\{ ctx, locale, view, onNotice \}\) \{\n  const t = roleMentorCopy\(locale\);/);
  assert.match(panel, /function OrganizationPanel\(\{ locale, view \}\) \{\n  const t = roleMentorCopy\(locale\);/);
  for (const call of ["<EvidenceTable locale={locale} rows={view.aggregate.concepts} aggregate />", "<EvidenceTable locale={locale} rows={view.summary.concepts}/>", "<EvidenceTable locale={locale} rows={needsReview}/>", "<EvidenceTable locale={locale} rows={aggregate.concepts} aggregate/>"]) {
    assert.ok(panel.includes(call), `evidence tables pass the locale down: ${call}`);
  }
});

test("FAP-92: no hardcoded English panel copy remains in the component", () => {
  assert.match(panel, /<h2 className="text-lg font-medium">\{t\(/, "every panel heading is a copy call");
  assert.doesNotMatch(panel, /<h2 className="text-lg font-medium">[^{]/);
  for (const literal of ["Teaching workspace", "Your next capability", "Organization readiness", "Your child’s week", "Summary unavailable", "Loading your authorized summary…", "Local preview · No live model, identity verification, or cloud synchronization."]) {
    assert.ok(panel.includes(`t('${literal}')`), `${literal} renders through the copy table`);
  }
  assert.doesNotMatch(panel, />(Teaching workspace|Your next capability|Organization readiness|Summary unavailable|No shared evidence yet|No checks yet|Open classes)</, "no raw English text node remains");
  assert.doesNotMatch(panel, /placeholder="(?!NO)/, "placeholders are translated values, not literals");
  assert.doesNotMatch(panel, /<option value="(lesson|quiz|coach)">[^{]/, "select options render translated labels");
  assert.match(panel, /\{t\(item\.status\)\}/, "relationship status data localizes");
  assert.match(panel, /: t\(row\.stage\)\}/, "MasteryStage data localizes");
  assert.match(panel, /\{t\(view\.summary\.period\)\} · \{t\('Rule-based observations/, "the parent period line is localized");
  assert.match(panel, /\{t\(aggregate\.period\)\}\. \{t\('Learner denominator/, "the organization period line is localized");
  assert.doesNotMatch(panel, /\{aggregate\.pendingSubmissions \?\? '/, "the hidden-count fallback is a copy call");
});

test("FAP-92: notices localize and service errors stay English but marked lang=en", () => {
  assert.match(panel, /onNotice\(t\('Preparation saved locally as an unreviewed draft\. Open Prepare to review and assign it\.'\)\)/);
  assert.match(panel, /onNotice\(t\('Career target saved locally in your personal workspace\.'\)\)/);
  assert.match(panel, /role="alert" lang="en">\{query\.error\.message\}/);
  assert.match(panel, /role="alert" className="v-notice v-error mt-4" lang="en">\{error\}/);
  assert.doesNotMatch(panel, /role="alert"[^>]*>(?!\{)(?![^<]*lang)/, "every alert marks its service English with lang");
});
