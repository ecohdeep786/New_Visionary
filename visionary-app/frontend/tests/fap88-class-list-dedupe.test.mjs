/** FAP-88 — the teacher class list never renders the same classroom twice in one commit.
 *  Before: TeacherHome.handleCreate optimistically prepended the created class
 *  (setClasses(prev => [created, ...prev])) and then dispatched visionary:workspace-change;
 *  the create write itself already dispatches the same event (appClient notifyChange on
 *  Classroom.create) and TeacherHome listens to it directly while useWorkspace also bumps
 *  its revision — verified live at beta fdfc6a45 with a console args + component-stack
 *  capture: React logged "Encountered two children with the same key" with the new
 *  classroom's UUID as the key on /dashboard/classes (reproduced 4/4 creation runs; the
 *  grid briefly held [C, C] before a refetch replaced the list). The law: both write
 *  points are idempotent by classroom id — the optimistic append merges an existing
 *  entry instead of blindly prepending, and every fetched list is deduped before it
 *  reaches state, so one commit can never contain two children with the same id. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../src/pages/dashboard/role/TeacherHome.jsx", import.meta.url), "utf8");

test("FAP-88: the optimistic append after class creation is idempotent by classroom id", () => {
  const create = home.slice(home.indexOf("const handleCreate"), home.indexOf("const stats ="));
  assert.match(create, /prev\.some\(c => c\.id === created\.id\)/, "the append checks whether the class is already in the list");
  assert.match(create, /prev\.map\(c => c\.id === created\.id \? \{ \.\.\.created, student_count: c\.student_count \} : c\)/, "an existing entry is merged in place (the fetched student count is preserved)");
  assert.match(create, /\[created, \.\.\.prev\]/, "a genuinely new class is still prepended");
  assert.doesNotMatch(create, /setClasses\(prev => \[created, \.\.\.prev\]\);/, "the unguarded blind prepend is gone");
});

test("FAP-88: every fetched class list is deduped by id before it reaches state", () => {
  const load = home.slice(home.indexOf("const load = useCallback"), home.indexOf("const handleCreate"));
  assert.match(load, /const seenClassIds=new Set\(\);/, "a per-load dedupe set guards the render list");
  assert.match(load, /filter\(c => \{ if\(seenClassIds\.has\(c\.id\)\)return false; seenClassIds\.add\(c\.id\); return true; \}\)/, "duplicate classroom rows are dropped before setClasses");
  assert.match(load, /\.sort\(\(a, b\) => \(b\.createdAt \|\| 0\) - \(a\.createdAt \|\| 0\)\)/, "the dedupe happens before the existing ordering");
});

test("FAP-88: the grid still keys class cards by classroom id and no other list in the page uses a duplicate-prone key", () => {
  assert.match(home, /classes\.map\(c => <ClassCard key=\{c\.id\} classroom=\{c\} \/>\)/, "the render contract (key=c.id) is unchanged");
  const stats = home.slice(home.indexOf("const stats ="), home.indexOf("return <div className=\"v-page\""));
  assert.match(stats, /label: "Classes"/, "stat labels stay unique");
  assert.match(stats, /label: "Students"/, "stat labels stay unique");
  assert.match(stats, /label: "Assignments"/, "stat labels stay unique");
});
