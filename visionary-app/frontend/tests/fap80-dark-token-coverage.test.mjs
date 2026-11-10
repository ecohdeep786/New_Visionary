/** FAP-80 — every hardcoded palette class in the dashboard joins the dark-mode
 *  token contract, or is an explicitly justified exception.
 *
 *  The product's dark theme is a single remap block in workspace-design.css:
 *  it rewrites the authored legacy palette classes onto the semantic tokens
 *  (--v-text/--v-muted/--v-action/--v-border/--v-soft/--v-raised/...). A class
 *  that is missing from that block keeps its light literal in dark mode — the
 *  FAP-80 defect: a #0b57d2 link at 2.69:1 on the dark surface and a #dadce0
 *  card border that outshines the token border.
 *
 *  This test is the enforcement: scan dashboard source for palette utilities,
 *  parse the dark remap segment, and require every token to be covered there.
 *  The only allowed exception is the image scrim (bg-[#121317]/40), whose dark
 *  wash is the legibility device over photography in both color schemes.
 *  The remap must be dark-only: no palette selector may live outside the
 *  prefers-color-scheme:dark block, or light mode would stop rendering the
 *  authored values. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cssPath = join(root, "src/components/dashboard/workspace-design.css");
const css = readFileSync(cssPath, "utf8");

/* The one justified exception: a photography scrim, not a surface token. */
const ALLOWLIST = new Map([
  ["bg-[#121317]/40", "image scrim: the dark wash keeps overlay text legible over photography in both color schemes"],
]);

const sourceFiles = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    const stat = statSync(file);
    if (stat.isDirectory()) walk(file);
    else if (/\.jsx?$/.test(name)) sourceFiles.push(file);
  }
};
walk(join(root, "src/components/dashboard"));
walk(join(root, "src/pages/dashboard"));

/* Exact Tailwind class tokens, including state prefixes and /opacity suffixes,
   because border-[#dadce0]/60 is a different declaration than the solid one. */
const TOKEN_RE = /(?:^|[\s"'`])((?:[a-z]+:)*)(text|bg|border|ring|fill|stroke|from|to|decoration|shadow|outline|divide|placeholder|caret)-\[(#[0-9a-fA-F]{3,8})\](?:\/(\d{1,3}))?/g;
const tokens = new Map();
for (const file of sourceFiles) {
  const source = readFileSync(file, "utf8");
  let match;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(source))) {
    const token = `${match[1] || ""}${match[2]}-[${match[3].toLowerCase()}]${match[4] ? `/${match[4]}` : ""}`;
    if (!tokens.has(token)) tokens.set(token, []);
    const line = source.slice(0, match.index).split("\n").length;
    tokens.get(token).push(`${file.slice(root.length).replace(/\\/g, "/")}:${line}`);
  }
}

const darkStart = css.indexOf("@media(prefers-color-scheme:dark)");
assert.ok(darkStart > -1, "the dark-scheme media query must exist");

const darkOpen = css.indexOf("{", darkStart);
let depth = 0;
let darkEnd = -1;
for (let i = darkOpen; i < css.length; i += 1) {
  if (css[i] === "{") depth += 1;
  else if (css[i] === "}") {
    depth -= 1;
    if (depth === 0) {
      darkEnd = i;
      break;
    }
  }
}
assert.ok(darkEnd > darkOpen, "the dark-scheme block must close");
const darkSegment = css.slice(darkOpen, darkEnd + 1);
const outsideDark = css.slice(0, darkStart) + css.slice(darkEnd + 1);
const covered = (token) => darkSegment.includes(`class~="${token}"`);

test("dashboard palette inventory is non-trivial (the scan is real)", () => {
  assert.ok(tokens.size >= 60, `expected the dashboard palette inventory, found ${tokens.size} class tokens`);
  assert.ok(tokens.has("text-[#0b57d2]"), "the measured FAP-80 link token must be in the inventory");
  assert.ok(tokens.has("border-[#dadce0]"), "the measured FAP-80 border token must be in the inventory");
});

test("every dashboard palette token is remapped by the dark-scheme token block", () => {
  const missing = [...tokens.keys()].filter((token) => !covered(token) && !ALLOWLIST.has(token)).sort();
  assert.deepEqual(
    missing,
    [],
    `these palette classes keep their light literals in dark mode; add them to the dark remap in workspace-design.css or document an allowlist reason: ${missing.join(", ")}`,
  );
});

test("the only unremapped class is the justified image scrim, and it still exists", () => {
  const allowlisted = [...ALLOWLIST.keys()];
  for (const token of allowlisted) {
    assert.ok(tokens.has(token), `stale allowlist entry ${token}: no dashboard source uses it anymore`);
    assert.ok(!covered(token), `${token} is allowlisted because it must not be tokenized, but the dark block remaps it`);
  }
  const unmapped = [...tokens.keys()].filter((token) => !covered(token));
  assert.deepEqual(unmapped, allowlisted, "the allowlist must match the unremapped inventory exactly");
  assert.match(css, /image\s+scrim/i, "the scrim exception must be justified in the stylesheet itself");
});

test("the remap stays dark-only so light mode keeps the authored palette", () => {
  const leaked = [...tokens.keys()].filter((token) => outsideDark.includes(`class~="${token}"`));
  assert.deepEqual(leaked, [], `palette selectors must live inside @media(prefers-color-scheme:dark): ${leaked.join(", ")}`);
});

test("FAP-80 additions target the semantic tokens, not substitute literals", () => {
  const required = [
    ['text-[#0b57d2]', "color: var(--v-action)"],
    ['text-[#0b57d0]', "color: var(--v-action)"],
    ['text-[#4285f4]', "color: var(--v-action)"],
    ['hover:text-[#4285f4]', "color: var(--v-action-hover)"],
    ['hover:text-[#121317]', "color: var(--v-text)"],
    ['text-[#dadce0]', "color: var(--v-border)"],
    ['text-[#6e6e73]', "color: var(--v-muted)"],
    ['placeholder:text-[#5f6368]', "color: var(--v-muted)"],
    ['disabled:text-[#5f6368]', "color: var(--v-muted)"],
    ['bg-[#0b57d2]', "background-color: var(--v-action)"],
    ['bg-[#4285f4]', "background-color: var(--v-action)"],
    ['bg-[#dadce0]', "background-color: var(--v-raised)"],
    ['hover:bg-[#dadce0]', "background-color: var(--v-soft)"],
    ['bg-[#e8f0fe]', "background-color: var(--v-soft)"],
    ['bg-[#1d1d1f]', "background-color: var(--v-text)"],
    ['bg-[#121317]/5', "background-color: var(--v-raised)"],
    ['border-[#dadce0]', "border-color: var(--v-border)"],
    ['border-[#dadce0]/60', "border-color: var(--v-border)"],
    ['border-[#dadce0]/50', "border-color: var(--v-border)"],
    ['border-[#dadce0]/40', "border-color: var(--v-border)"],
    ['border-[#dadce0]/20', "border-color: var(--v-border)"],
    ['border-[#d2d2d7]', "border-color: var(--v-border)"],
    ['border-[#0b57d2]', "border-color: var(--v-action)"],
    ['focus:border-[#4285f4]', "border-color: var(--v-action)"],
    ['divide-[#dadce0]', "border-color: var(--v-border)"],
    ['divide-[#e2e8f0]', "border-color: var(--v-border)"],
    ['ring-[#4285f4]', "--tw-ring-color: var(--v-action)"],
    ['ring-[#dadce0]', "--tw-ring-color: var(--v-border)"],
  ];
  for (const [token, declaration] of required) {
    const ruleLine = darkSegment.split("\n").find((line) => line.includes(`class~="${token}"`) && line.includes(declaration));
    assert.ok(ruleLine, `${token} must map to ${declaration} inside the dark remap`);
  }
});

test("primary fills pair the action token with an on-action foreground", () => {
  const fills = darkSegment.split("\n").filter((line) => /class~="bg-\[#(0b57d2|4285f4)\]"/.test(line));
  const fillTokens = new Set(
    fills.flatMap((line) => [...line.matchAll(/class~="(bg-\[#(?:0b57d2|4285f4)\])"/g)].map((match) => match[1])),
  );
  assert.equal(fillTokens.size, 2, "both primary fill literals must be remapped");
  for (const line of fills) {
    assert.match(line, /color: var\(--v-on-action\)/, `primary fill must set the on-action text color: ${line.trim()}`);
  }
});

test("inline user-accent paint yields to the action tokens in dark mode", () => {
  /* The A/B probe found one paint the class remap cannot reach: the Learn
     topic's "Request explanation" is inline theme.accent, which stayed
     rgb(11,87,210) at 2.69:1 in dark. The primitive keeps the learner's accent
     in light (custom property) and swaps to the semantic pair in dark. */
  const viewer = readFileSync(join(root, "src/components/dashboard/learn/CourseViewer.jsx"), "utf8");
  assert.match(
    viewer,
    /className="v-accent-ink [^"]*border-\[#dadce0\]/,
    "the measured Request explanation action must use the dark-yielding accent ink",
  );
  assert.match(
    viewer,
    /className="v-accent-fill [^"]*text-white/,
    "the save-question fill must use the dark-yielding accent fill",
  );
  assert.doesNotMatch(
    viewer,
    /\b(color|backgroundColor):\s*theme\.accent\b/,
    "accent paint must go through the dark-yielding classes, not an inline literal paint",
  );
  assert.match(
    css.slice(0, darkStart),
    /\.visionary-workspace \.v-accent-ink \{color: var\(--v-user-accent,var\(--v-action\)\)\}/,
    "light mode must keep the learner's accent through the custom property",
  );
  assert.match(
    darkSegment,
    /\.visionary-workspace \.v-accent-ink \{color: var\(--v-action\)\}/,
    "dark accent ink must resolve to the action token",
  );
  assert.match(
    darkSegment,
    /\.visionary-workspace \.v-accent-fill \{background-color: var\(--v-action\);color: var\(--v-on-action\)\}/,
    "dark accent fill must pair the action and on-action tokens",
  );
});
