/** B1 (FAP-46) — voice→type ladder regression lock.
 *  The six landing sources may author no raw fluid sizes, and every h1/h2/h3
 *  opening tag must declare its voice with `data-type` from the ladder
 *  vocabulary (docs/visionary/design/VOICE_TYPE_LADDER_2026-10-21.md).
 *  B2 (FAP-47) extends the lock: public sources author no `uppercase` class
 *  anywhere, and the label role/law/sites stay pinned. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

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

/* ── B2 (FAP-47) — kicker voice lock ──────────────────────────────────────
 * Public surfaces speak sentence case: the CSS uppercase mask is retired and
 * kickers are either data-type="label" (hero-adjacent lead-ins) or the
 * .apple-eyebrow base class. The B2 doors may never reintroduce a mask. */

const walkPublic = (dir) =>
  readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((e) => {
    const p = `${dir}/${e.name}`;
    return e.isDirectory() ? walkPublic(p) : p.endsWith(".jsx") ? [p] : [];
  });

for (const file of [...walkPublic("../src/pages/landing"), ...walkPublic("../src/components/landing")]) {
  test(`B2 kicker voice — ${file.replace("../src/", "")} authors no uppercase`, () => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.ok(
      !source.includes("uppercase"),
      `${file}: the uppercase class/mask is retired on public pages (B2/FAP-47) — use data-type="label" or .apple-eyebrow`,
    );
  });
}

test("B2 label role — law present with the measured dial", () => {
  const law = readFileSync(new URL("../src/styles/apple-typography.css", import.meta.url), "utf8");
  const block = law.match(/\[data-type="label"\]\s*{[^}]*}/);
  assert.ok(block, "the data-type=\"label\" law is missing from apple-typography.css");
  assert.match(block[0], /font-size:\s*var\(--fs-label\)/, "label law must voice var(--fs-label) = 21px");
  assert.match(block[0], /font-weight:\s*600/, "label law must voice 600");
  assert.match(block[0], /0\.011em/, "label law must voice the 0.011em kicker track");
  assert.match(block[0], /1\.19/, "label law must voice lh 1.19");
  assert.match(block[0], /text-transform:\s*none/, "label law must be sentence-case");
});

for (const file of [
  "../src/components/landing/AboutUsHero.jsx",
  "../src/pages/landing/DownloadPage.jsx",
  "../src/pages/landing/CommunityPage.jsx",
  "../src/pages/landing/PartnersPage.jsx",
  "../src/pages/landing/UpdatesPage.jsx",
  "../src/pages/landing/ReferralPage.jsx",
  "../src/pages/landing/AccessibilityPage.jsx",
  "../src/pages/landing/PrivacyPage.jsx",
  "../src/pages/landing/TermsPage.jsx",
  "../src/pages/landing/SecurityPage.jsx",
  "../src/pages/landing/CookiesPage.jsx",
]) {
  test(`B2 label role — ${file.replace("../src/", "")} keeps its label site`, () => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.ok(source.includes('data-type="label"'), `${file}: the hero-adjacent label lead-in lost its role`);
  });
}
