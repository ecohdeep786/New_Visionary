/** FAP-78 — the Classes page keeps exactly one create affordance per state.
 *  Before, a teacher with zero classes met two equal create controls on one
 *  screen: the header "Create class" button AND the empty-state "Create your
 *  first class" CTA. Two equal weights for one intent make the user pause over
 *  which is "the" path. The law (HIG Writing → writing for everyone; one clear
 *  primary action per state): the header control shows only when the class
 *  list exists (classes.length > 0); on an empty list the friendly empty-state
 *  CTA is the page's only create affordance; the creation flow itself is
 *  untouched — the ?create=1 deep link opens the modal regardless of list
 *  state, the modal render is independent of the header, and no copy changed
 *  (both labels resolve in en/hi/bn through the existing copy cascade; the
 *  student side keeps its single join-by-code affordance). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { primaryWorkspaceCopy } from "../src/lib/primaryWorkspaceCopy.js";

const home = readFileSync(new URL("../src/pages/dashboard/role/TeacherHome.jsx", import.meta.url), "utf8");
const studentClasses = readFileSync(new URL("../src/pages/dashboard/StudentClasses.jsx", import.meta.url), "utf8");
const copyTable = readFileSync(new URL("../src/lib/primaryWorkspaceCopy.js", import.meta.url), "utf8");
const teacherReview = readFileSync(new URL("../scripts/teacher-review.mjs", import.meta.url), "utf8");
const crossRoleReview = readFileSync(new URL("../scripts/cross-role-review.mjs", import.meta.url), "utf8");

const count = (s, needle) => s.split(needle).length - 1;

test("the header Create class control is gated on the class list existing", () => {
  assert.match(home, /\{classes\.length > 0 && <button onClick=\{\(\)=>setShowCreate\(true\)\} className="v-button primary"><Plus size=\{18\} aria-hidden="true"\/>\{copy\("Create class"\)\}<\/button>\}/,
    "the header create control renders only when classes.length > 0");
  assert.equal(count(home, '{copy("Create class")}'), 1,
    "TeacherHome names the header create control once");
});

test("the empty state keeps its single friendly create CTA", () => {
  assert.equal(count(home, '{copy("Create your first class")}'), 1,
    "exactly one empty-state create CTA call");
  const zeroAt = home.indexOf("classes.length === 0 ?<div") >= 0
    ? home.indexOf("classes.length === 0 ?<div")
    : home.indexOf("classes.length === 0 ? ");
  const gridAt = home.indexOf("classes.map(c => <ClassCard");
  assert.ok(zeroAt > -1 && gridAt > zeroAt, "the zero-classes branch exists before the populated grid");
  const emptyBranch = home.slice(zeroAt, gridAt);
  assert.match(emptyBranch, /onClick=\{\(\) => setShowCreate\(true\)\}/,
    "the empty state owns its own create call site");
  assert.match(emptyBranch, /\{copy\("Create your first class"\)\}/,
    "the empty-state CTA renders from within the zero-classes branch");
});

test("the empty page cannot render two equal create controls from TeacherHome", () => {
  // setShowCreate(true) call sites: the ?create=1 effect, the gated header
  // button and the empty-state CTA. The header call sits inside the
  // classes.length > 0 conditional; the empty-state call sits inside the
  // classes.length === 0 branch — opposite sides of the same split, so every
  // rendered state carries exactly one create control.
  assert.equal(count(home, "setShowCreate(true)"), 3,
    "exactly three open-modal call sites: deep-link effect, header gate, empty-state CTA");
  const gateAt = home.indexOf("classes.length > 0 && <button");
  const headerBlock = home.slice(gateAt, gateAt + 200);
  assert.ok(headerBlock.includes("onClick={()=>setShowCreate(true)}"),
    "the header call site is inside the populated-state conditional");
  assert.match(headerBlock, /\{copy\("Create class"\)\}/,
    "the header create control lives in the same gated expression");
});

test("the modal and the ?create=1 deep link stay independent of the list state", () => {
  assert.match(home, /if \(params\.get\("create"\) === "1"\) \{\s*\n\s*setShowCreate\(true\);/,
    "the deep link opens the modal regardless of whether classes exist");
  assert.equal(count(home, "{showCreate && <CreateClassModal"), 1,
    "the modal render stays unconditional at the page level");
});

test("no copy changed — both labels resolve in en, hi and bn", () => {
  const en = primaryWorkspaceCopy("en"), hi = primaryWorkspaceCopy("hi"), bn = primaryWorkspaceCopy("bn");
  assert.equal(en("Create class"), "Create class");
  assert.notEqual(hi("Create class"), "Create class");
  assert.notEqual(bn("Create class"), "Create class");
  assert.equal(en("Create your first class"), "Create your first class");
  assert.notEqual(hi("Create your first class"), "Create your first class");
  assert.notEqual(bn("Create your first class"), "Create your first class");
  // the empty-state helper sentence stays explicit and localized
  assert.match(copyTable, /'Create your first class to post announcements, assign work tagged to concepts, and review recorded work, concept coverage, and feedback\.'/,
    "the long empty-state sentence remains in the primary workspace table");
});

test("the student side keeps its single join-by-code affordance", () => {
  assert.match(studentClasses, /copy\("Join with a code"\)/, "the learner Classes page joins with a code");
  assert.doesNotMatch(studentClasses, /CreateClassModal/, "the learner Classes page has no create modal");
  assert.doesNotMatch(studentClasses, /\{copy\("Create class"\)\}/, "the learner Classes page has no create control");
});

test("review harnesses click the state's single visible create control", () => {
  assert.match(teacherReview, /\/Create \(your first \)\?class\/i/,
    "teacher-review accepts either state's create control");
  assert.match(crossRoleReview, /\/Create \(your first \)\?class\/i/,
    "cross-role-review clicks the visible create control");
  assert.match(crossRoleReview, /\/create \(\?:your first \)\?class\/i/,
    "cross-role-review's shell check accepts either label");
});
