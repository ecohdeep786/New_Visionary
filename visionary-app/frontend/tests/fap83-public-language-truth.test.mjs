/** FAP-83: each public category must demonstrate exactly the languages supported
 * by the workspace and distinguish the example from a live language service. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL("../src/" + file, import.meta.url), "utf8");
const gallery = read("components/landing/persona/CategoryStory.jsx");
const roles = {
  student: "StudentPage", teacher: "TeacherPage", parent: "ParentPage",
  professional: "CollegePage", organization: "OrganizationPage",
};
const served = ["bn", "en", "hi"];

test("FAP-83: the language picker offers every served language, with honest availability", () => {
  const picker = gallery.match(/const languages = \[([\s\S]+?)\];/)?.[1];
  assert.ok(picker);
  assert.deepEqual([...picker.matchAll(/code: "([a-z]+)"/g)].map((m) => m[1]).sort(), served);
  assert.match(gallery, /English, Hindi, and Bengali are supported/);
  assert.match(gallery, /More languages are on the roadmap/);
  assert.match(gallery, /aria-pressed=\{current === code\}/);
  assert.match(gallery, /lang=\{current\}>\{language.examples\[current\]\}/);
  assert.doesNotMatch(gallery, /every language|listening in/i);
});

for (const [role, page] of Object.entries(roles)) {
  test("FAP-83: " + role + " supplies three distinct, native-script examples to its public page", () => {
    const route = read("pages/landing/" + page + ".jsx");
    assert.ok(route.includes('import story from "./stories/' + role + '"'));
    assert.match(route, /<CategoryStory story=\{story\}/);
    const story = read("pages/landing/stories/" + role + ".js");
    const examples = story.match(/examples: \{([^}]+)\}/)?.[1];
    assert.ok(examples);
    const values = Object.fromEntries([...examples.matchAll(/([a-z]+): "([^"]+)"/g)].map((m) => [m[1], m[2]]));
    assert.deepEqual(Object.keys(values).sort(), served);
    assert.equal(new Set(Object.values(values)).size, 3);
    assert.match(values.hi, /\p{Script=Devanagari}/u);
    assert.match(values.bn, /\p{Script=Bengali}/u);
    assert.doesNotMatch(story, /every language|listening in/i);
  });
}
