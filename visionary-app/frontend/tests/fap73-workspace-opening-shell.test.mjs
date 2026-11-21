/** FAP-73 — the workspace core routes must never mount an unbranded void.
 *
 *  Defect at beta: /dashboard/learn, /dashboard/ask, /dashboard/practice,
 *  /dashboard/build, /dashboard/progress and /dashboard/career opened with a
 *  bare one-line placeholder ("Opening this workspace…" / "Preparing your
 *  workspace…" / "Loading workspace…" / "Loading projects…" / "Opening your
 *  career workspace…") for the first 1–2s of a cold first visit — no
 *  landmark, no h1, no skeleton. The V6 five-question law requires designed
 *  loading paths, and F-27/FAP-73 gave PUBLIC routes both a designed state
 *  and idle chunk prefetch while the workspace had neither.
 *
 *  The law:
 *    1. Every core-route cold mount renders the shared WorkspaceOpening
 *       shell: a real status landmark (role="status" + aria-busy +
 *       data-workspace-opening) whose h1 announces the DESTINATION the
 *       route finally renders (same string the route's settled h1 uses),
 *       with the localized note and an aria-hidden skeleton.
 *    2. The skeleton is token-driven and non-oversized; its pulse runs ONLY
 *       under prefers-reduced-motion: no-preference, with the workspace-wide
 *       reduce law in workspace-design.css as the backstop.
 *    3. The localized titles are real copy-table entries (en/hi/bn), not
 *       invented strings.
 *    4. Workspace chunk prefetch reaches parity with the public
 *       RoutePrefetcher: the same import specifiers App.jsx/DashboardHome.jsx
 *       use, only from /dashboard|/dashboard/home, skipped on save-data/2g,
 *       paced after a 2.5s settle onto an idle callback with a bounded
 *       timeout; mounted in App.jsx beside RoutePrefetcher — NOT statically
 *       imported by DashboardLayout, whose import closure the surface audit
 *       unions into every /dashboard route (a layout-level import would
 *       attribute the warmed chunks' capability tags to routes that never
 *       render them).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");

test("FAP-73: the shared shell is a status landmark with an announcing h1 and a hidden skeleton", () => {
  const src = read("src/components/dashboard/WorkspaceOpening.jsx");
  assert.match(src, /className="v-page v-opening"/, "the shell keeps the neutral v-page chrome");
  assert.match(src, /role="status"/, "the shell is a status landmark");
  assert.match(src, /aria-busy="true"/, "the landmark is busy while opening");
  assert.match(src, /data-workspace-opening="true"/, "the shell carries the FAP-73 probe hook");
  assert.match(src, /<h1 className="v-title/, "the h1 announces the destination route");
  assert.match(src, /className="v-muted mt-2">\{note\}/, "the localized note renders beside the title");
  assert.match(src, /aria-hidden="true"/, "the skeleton is hidden from assistive tech");
  assert.match(src, /v-opening-art/, "the skeleton paints an intentional opening state");
});

test("FAP-73: every core-route cold mount renders WorkspaceOpening with the destination's own h1", () => {
  // learn + practice — all four mount states; the title switches with the
  // practice prop exactly as the settled render does.
  const lw = read("src/pages/dashboard/LearningWorkspace.jsx");
  assert.equal(lw.includes("WorkspaceOpening"), true, "LearningWorkspace mounts the shared shell");
  const lwOpenings = lw.match(/<WorkspaceOpening /g) || [];
  assert.ok(lwOpenings.length >= 4, `all four LW mount states use the shell (found ${lwOpenings.length})`);
  assert.match(lw, /title=\{copy\(practice \? 'Practice' : 'Learning workspace'\)\}/, "the LW title switches with the practice prop like the settled h1s");
  assert.match(lw, /import WorkspaceOpening from '@\/components\/dashboard\/WorkspaceOpening';/, "LearningWorkspace imports the shell");
  assert.doesNotMatch(lw, /role="status"[^>]*>\{copy\("Opening this workspace/, "no bare text void remains for the workspace switch");
  assert.doesNotMatch(lw, /role=\{workspaceError \? 'alert' : 'status'\}/, "the error state is no longer merged into the loading state");

  // ask — the Guide brand string, same as its settled h1 (literal, with GuideMark).
  const guide = read("src/pages/dashboard/Guide.jsx");
  assert.equal((guide.match(/<WorkspaceOpening /g) || []).length, 2, "both Guide mount states use the shell");
  assert.match(guide, /title="Visionary Guide"/, "the Guide shell announces the same brand h1 the settled page renders");
  assert.doesNotMatch(guide, /role="status">\{copy\("Preparing your workspace/, "no bare text void remains in Guide");

  // progress (+ other tool areas) — the progress title matches LearningProgress's settled h1.
  const wt = read("src/pages/dashboard/WorkspaceTools.jsx");
  assert.match(wt, /<WorkspaceOpening locale=\{interfaceLocale\}/, "WorkspaceTools mounts the shared shell");
  assert.match(wt, /learningProgressText\(interfaceLocale, 'title'\)/, "the progress title comes from the same table LearningProgress renders");
  assert.match(wt, /import \{ learningProgressText \} from '@\/lib\/learningProgressCopy';/, "WorkspaceTools imports the progress table");

  // career — ProfessionalCareer's settled h1.
  const pc = read("src/pages/dashboard/ProfessionalCareer.jsx");
  assert.match(pc, /<WorkspaceOpening locale=\{locale\} title=\{t\("Your next capability"\)\}/, "the career shell announces ProfessionalCareer's settled h1");

  // build — /dashboard/build renders ArtifactStudio; its settled list h1.
  const as = read("src/pages/dashboard/ArtifactStudio.jsx");
  assert.match(as, /<WorkspaceOpening locale=\{locale\} title=\{t\('Build something of your own'\)\}/, "the build shell announces ArtifactStudio's settled h1");

  // practice geometry entry — the cube lesson's settled h1, switching with `from`.
  const cle = read("src/components/dashboard/CubeLearningEntry.jsx");
  assert.match(cle, /<WorkspaceOpening locale=\{locale\} title=\{from === 'practice' \? copy\("Practice cube volume in your lesson"\) : copy\("Explore cube volume in your lesson"\)\}/, "the cube entry shell announces its settled h1");
  assert.match(cle, /if \(workspaceError\) return <div className="v-page" role="alert"/, "the error path stays an alert, not a loading state");
});

test("FAP-73: the localized titles are real en/hi/bn copy-table entries", () => {
  const lc = read("src/lib/learningCopy.js");
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const key of ["Learning workspace", "Practice", "Opening your learning workspace…"]) {
    const entry = lc.match(new RegExp("\\['" + esc(key) + "','([^']*)','([^']*)'\\]"));
    assert.ok(entry, `learningCopy has an entry for "${key}"`);
    assert.ok(entry[1].length > 0 && entry[2].length > 0, `"${key}" is localized for hi and bn`);
  }
  const pc = read("src/lib/professionalCopy.js");
  assert.match(pc, /'Your next capability'/, "professionalCopy carries the career title");
  assert.match(pc, /'Opening your career workspace…'/, "professionalCopy carries the career note");
  const pj = read("src/lib/projectCopy.js");
  assert.match(pj, /'Build something of your own'/, "projectCopy carries the build title");
});

test("FAP-73: the skeleton pulse respects the motion law", () => {
  const css = read("src/components/dashboard/workspace-design.css");
  const pulse = css.match(/@media\(prefers-reduced-motion:no-preference\) \{\s*\.v-opening [^{]+\{animation: v-opening-pulse/);
  assert.ok(pulse, "the pulse animation is gated behind prefers-reduced-motion: no-preference");
  assert.match(css, /@keyframes v-opening-pulse/, "the pulse keyframes are defined once");
  const art = css.match(/\.v-opening \.v-opening-art \{([^}]*)\}/);
  assert.ok(art, "the skeleton art is styled");
  assert.match(art[1], /var\(--v-soft\)/, "the skeleton uses the semantic tokens (dark mode follows the system)");
  assert.ok(!/height:\s*(?:2[6-9]\d|[3-9]\d\d)px/.test(css.slice(css.indexOf(".v-opening"), css.indexOf("@keyframes v-opening-pulse"))), "the skeleton stays non-oversized");
  const reduce = css.match(/@media\(prefers-reduced-motion:reduce\) \{\s*\.visionary-workspace \*/);
  assert.ok(reduce, "the workspace-wide reduce law remains as the backstop");
});

test("FAP-73: workspace chunk prefetch reaches parity with the public RoutePrefetcher", () => {
  const src = read("src/lib/WorkspaceChunkPrefetcher.jsx");
  assert.match(src, /pathname !== "\/dashboard" && pathname !== "\/dashboard\/home"/, "it warms only from the workspace landing");
  assert.match(src, /saveData/, "it is skipped when the user asks to save data");
  assert.match(src, /slow-2g", "2g"/, "it is skipped on slow connections");
  assert.match(src, /requestIdleCallback\(run, \{ timeout: 2000 \}\)/, "the work is bounded on an idle callback");
  assert.match(src, /2500/, "it paces itself 2.5s after the shell settles");
  assert.match(src, /load\.catch\(\(\) => \{\}\)/, "a failed warm never surfaces as an error");
  for (const chunk of [
    "@/pages/dashboard/Learn",
    "@/pages/dashboard/Practice",
    "@/pages/dashboard/ArtifactStudio",
    "@/pages/dashboard/WorkspaceTools",
    "@/pages/dashboard/Guide",
  ]) {
    assert.ok(src.includes(`import("${chunk}")`), `it warms the exact App/Home specifier ${chunk}`);
  }
  const app = read("src/App.jsx");
  assert.match(app, /import \{ WorkspaceChunkPrefetcher \} from '@\/lib\/WorkspaceChunkPrefetcher'/, "App.jsx imports the workspace prefetcher");
  assert.match(app, /<WorkspaceChunkPrefetcher \/>/, "the prefetcher is mounted beside RoutePrefetcher");
  // The surface audit unions DashboardLayout's import closure into every
  // /dashboard route — a layout-level import of the prefetcher would pull
  // the warmed chunks' capability tags onto routes that never render them.
  const dl = read("src/components/dashboard/DashboardLayout.jsx");
  assert.equal(dl.includes("WorkspaceChunkPrefetcher"), false, "DashboardLayout does not statically import the prefetcher");
  // The public prefetcher is untouched by this law.
  const pub = read("src/lib/RoutePrefetcher.jsx");
  assert.match(pub, /pathname !== "\/"/, "RoutePrefetcher still owns the public landing");
  assert.doesNotMatch(pub, /dashboard/, "the public prefetcher does not reach into the workspace");
});
