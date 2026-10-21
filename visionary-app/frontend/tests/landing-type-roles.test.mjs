/** B1 (FAP-46) — voice→type ladder regression lock.
 *  The six landing sources may author no raw fluid sizes, and every h1/h2/h3
 *  opening tag must declare its voice with `data-type` from the ladder
 *  vocabulary (docs/visionary/design/VOICE_TYPE_LADDER_2026-10-21.md). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SITES = [
  "../src/pages/Landing.jsx",
  "../src/pages/landing/StudentPage.jsx",
  "../src/pages/landing/TeacherPage.jsx",
  "../src/pages/landing/ParentPage.jsx",
  "../src/pages/landing/CollegePage.jsx",
  "../src/pages/landing/OrganizationPage.jsx",
  "../src/components/landing/NewPersona.jsx",
  "../src/components/landing/persona/PersonaSections.jsx",
  "../src/components/landing/persona/PremiumPersonaSections.jsx",
];

const LADDER = new Set([
  "display", "product-section", "section", "statement", "feature", "feature-heading",
  "card-name", "editorial-card", "story", "card-chapter", "emphasis",
  "body", "lead", "editorial-lead", "metadata", "caption", "fine",
  "value-title", "value-body", "editorial-body", "editorial-link",
]);

/** Finds the end of a JSX opening tag: the first `>` outside {…} depth. */
function openingTag(source, start) {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return source.slice(start, i);
  }
  return "";
}

for (const site of SITES) {
  test(`landing type roles — ${site.replace("../", "")}`, () => {
    const source = readFileSync(new URL(site, import.meta.url), "utf8");
    const clamps = source.match(/text-\[clamp\(/g);
    assert.equal(
      clamps,
      null,
      `${site} authoring raw fluid sizes (${clamps ? clamps.length : 0}×) — assign data-type roles from the voice→type ladder`,
    );
    const re = /<h([123])(?=[\s>\/])/g;
    let m;
    while ((m = re.exec(source)) !== null) {
      const tag = openingTag(source, m.index);
      const dt = tag.match(/data-type=["']([a-z-]+)/);
      if (!dt) {
        // A dynamically bound role (e.g. `data-type={headingRole}`) is pinned
        // to a ladder literal at the call site; the rendered gate
        // (b1-type-roles.mjs) receipts the value resolved in the DOM.
        assert.ok(
          tag.includes("data-type={"),
          `${site}: <h${m[1]}> at offset ${m.index} lacks a data-type role`,
        );
        continue;
      }
      assert.ok(
        LADDER.has(dt[1]),
        `${site}: <h${m[1]}> at offset ${m.index} declares unknown role "${dt[1]}" — extend VOICE_TYPE_LADDER_2026-10-21.md if this is a new voice`,
      );
    }
  });
}
