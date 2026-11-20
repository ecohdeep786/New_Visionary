/** FAP-84 — the hero <img> must reach the DOM without React's camelCase
 *  fetchPriority warning.
 *
 *  Defect at beta 07bfb77a: src/components/landing/CinematicHero.jsx passed
 *  the camelCase `fetchPriority="high"` prop to a raw <img>. React 18.2 does
 *  not recognize the camelCase img prop and logs "Warning: React does not
 *  recognize the `fetchPriority` prop on a DOM element" on every load of
 *  every public page that renders the hero image — reproduced 6/6 in fresh
 *  Playwright contexts on /research, /accessibility and /privacy (the six
 *  trust/legal pages import CinematicHero). The receipted A4 treatment
 *  already exists: LazyImage.jsx destructures the camelCase caller prop and
 *  emits the standard lowercase `fetchpriority` content attribute, and
 *  NewPersona.jsx uses the {...{ fetchpriority: "high" }} passthrough on its
 *  raw imgs. src/styles/apple-reference-notes.md documents the leftover as
 *  outside the earlier correction.
 *
 *  Why it matters: dev-console React warnings are noise on every load of the
 *  public hero, pollute the console-error evidence later verification sweeps
 *  rely on (T13), and indicated the hero img was not on the receipted path.
 *
 *  The law: landing source reaches the DOM with the standard lowercase
 *  `fetchpriority` content attribute; the camelCase `fetchPriority` form
 *  appears only inside LazyImage.jsx's sanctioned A4 surface (the
 *  caller-facing destructure and its documented lowercase mapping) and in
 *  law comments. No raw img anywhere in src/ may pass the camelCase prop.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const heroPath = join(root, "src/components/landing/CinematicHero.jsx");
const lazyPath = join(root, "src/components/landing/LazyImage.jsx");
const personaPath = join(root, "src/components/landing/NewPersona.jsx");

const read = (p) => readFileSync(p, "utf8");

/** Strip JS block and line comments so law comments that state the
 *  prohibition do not count as violations. */
function withoutComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1");
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (/\.(jsx|js|ts|tsx)$/.test(entry)) yield p;
  }
}

test("FAP-84: the CinematicHero hero img carries the lowercase passthrough, not the camelCase prop", () => {
  const src = withoutComments(read(heroPath));
  assert.match(src, /\{\.\.\.\{\s*fetchpriority:\s*"high"\s*\}\}/, "lowercase passthrough present");
  assert.ok(!/fetchPriority\s*=/.test(src), `no camelCase fetchPriority JSX prop: ${heroPath}`);
});

test("FAP-84: no source file under src/ passes camelCase fetchPriority to the DOM (LazyImage A4 surface excepted)", () => {
  const offenders = [];
  for (const p of walk(join(root, "src"))) {
    const src = withoutComments(read(p));
    if (/fetchPriority\s*=/.test(src) && !p.endsWith("LazyImage.jsx")) {
      offenders.push(p);
    }
  }
  assert.deepEqual(offenders, [], "camelCase fetchPriority must not appear outside the sanctioned LazyImage surface");
});

test("FAP-84: the sanctioned LazyImage A4 treatment is intact (caller prop stays camelCase, DOM attribute lowercase)", () => {
  const src = read(lazyPath);
  assert.match(src, /fetchPriority,\s*\n/, "destructured caller-facing prop retained");
  assert.match(src, /\{\s*fetchpriority:\s*fetchPriority\s*\}/, "lowercase content-attribute mapping retained");
});

test("FAP-84: NewPersona's receipted passthrough treatments remain (regression guard)", () => {
  const src = read(personaPath);
  const count = (src.match(/\{\.\.\.\{\s*fetchpriority:\s*"high"\s*\}\}/g) || []).length;
  assert.ok(count >= 2, `expected both NewPersona passthroughs, found ${count}`);
});
