/** FAP-81 — the Community photo marquee must hold still when the system asks
 *  for reduced motion.
 *
 *  Defect at beta d4c50241: the component's inline <style> declared
 *  `animation: ... 60s linear infinite !important`. The global contract in
 *  index.css kills motion through a universal selector with !important; a
 *  class selector with !important out-specifies it, so two infinite loops kept
 *  running under prefers-reduced-motion: reduce. Removing !important lets the
 *  global kill apply; the component also carries an explicit static-and-visible
 *  guard so the behavior is local, obvious and future-proof.
 *
 *  This test is the enforcement: the marquee keeps its marquee-only law when
 *  motion is allowed, collapses to visible static rows when it is not, and no
 *  source file in the product may sneak a motion declaration past the global
 *  reduced-motion contract with !important outside a reduce block. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  cssMotionValues,
  jsMotionValues,
  reducedMotionEscapes,
} from "../scripts/qa-motion.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const communityPath = join(root, "src/pages/landing/CommunityPage.jsx");
const community = readFileSync(communityPath, "utf8");

const styleMatch = community.match(/<style>\{`([\s\S]*?)`\}<\/style>/);
const marqueeCss = styleMatch ? styleMatch[1] : "";

test("the Community marquee still animates both rows when motion is allowed", () => {
  assert.ok(marqueeCss, "CommunityPage.jsx must carry the PhotoMarquee <style> block");
  assert.match(marqueeCss, /@keyframes community-marquee-left/);
  assert.match(marqueeCss, /@keyframes community-marquee-right/);
  assert.match(marqueeCss, /\.cm-left\s*\{\s*animation:\s*community-marquee-left\s+60s\s+linear\s+infinite;?\s*\}/);
  assert.match(marqueeCss, /\.cm-right\s*\{\s*animation:\s*community-marquee-right\s+60s\s+linear\s+infinite;?\s*\}/);
});

test("the marquee declarations no longer carry !important (the FAP-81 escape hatch)", () => {
  assert.doesNotMatch(marqueeCss, /!\s*important/i);
});

test("the component carries an explicit reduced-motion guard that keeps rows visible", () => {
  const guard = marqueeCss.match(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{([\s\S]*?)\n\s*\}/);
  assert.ok(guard, "the marquee style must carry an @media (prefers-reduced-motion: reduce) block");
  const body = guard[1];
  assert.match(body, /\.cm-left\s*,\s*\.cm-right\s*\{\s*animation:\s*none;?\s*\}/);
  assert.doesNotMatch(body, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:[;\s]|$)/);
});

test("the extracted marquee stylesheet passes the reduced-motion escape law", () => {
  assert.deepEqual(reducedMotionEscapes(marqueeCss, cssMotionValues(marqueeCss)), []);
  const regressed = marqueeCss.replace(
    ".cm-left { animation: community-marquee-left 60s linear infinite; }",
    ".cm-left { animation: community-marquee-left 60s linear infinite !important; }",
  );
  assert.notEqual(regressed, marqueeCss);
  assert.equal(reducedMotionEscapes(regressed, cssMotionValues(regressed)).length, 1);
});

test("no source file escapes the global reduced-motion kill with !important", () => {
  const violations = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name);
      const stat = statSync(file);
      if (stat.isDirectory()) walk(file);
      else if (/\.(?:jsx?|css)$/.test(name)) {
        const text = readFileSync(file, "utf8");
        const values = file.endsWith(".css") ? cssMotionValues(text) : jsMotionValues(text);
        for (const hit of reducedMotionEscapes(text, values)) {
          violations.push(`${relative(root, file).split(sep).join("/")} ${hit.name}: ${hit.value.trim()}`);
        }
      }
    }
  };
  walk(join(root, "src"));
  assert.deepEqual(violations, []);
});
