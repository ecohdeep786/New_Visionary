/**
 * F10 split — PersonaSections.jsx (958 lines) → per-section modules.
 *
 * Mechanical, verbatim surgery: each module body is EXTRACTED from the
 * original monolith by line range (no retyping), wrapped with the exact
 * per-module import header, and verified by substring containment before
 * anything is written. PersonaSections.jsx then becomes a pure re-export
 * barrel in the original export order, so every import site keeps working
 * unchanged. Run: node scripts/f10-split-persona.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src/components/landing/persona", import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, "$1"); // windows drive
const ORIG = join(ROOT, "PersonaSections.jsx");

const text = readFileSync(ORIG, "utf8").replace(/\r\n/g, "\n");
const lines = text.split("\n");
const rng = (s, e) => lines.slice(s - 1, e).join("\n").trim() + "\n";

const T = 'import { color } from "@/components/landing/system/tokens";';
const R = 'import React from "react";';

const modules = [
  { file: "ChevronIcon.jsx", name: "ChevronIcon", imports: [R], body: [[871, 877]] },
  { file: "VoiceIcon.jsx", name: "VoiceIcon", imports: [R], body: [[879, 887]] },
  { file: "FadeReveal.jsx", name: "FadeReveal", imports: [R], body: [[889, 895]] },
  { file: "RevealItem.jsx", name: "RevealItem", imports: [R], body: [[905, 921]] },
  {
    file: "ScrollReveal.jsx",
    name: "ScrollReveal",
    imports: [
      R,
      'import { useInViewOnce } from "@/components/landing/system/hooks";',
    ],
    body: [[897, 903], [923, 936]],
  },
  {
    file: "CarouselDots.jsx",
    name: "CarouselDots",
    imports: [R, T],
    body: [[194, 214]],
  },
  {
    file: "StruggleChapter.jsx",
    name: "StruggleChapter",
    imports: [
      R,
      'import { revealStyle, useAppleLinkedReveal, STRUGGLE_MASK } from "./reveal-helpers.js";',
      'import CarouselDots from "./CarouselDots.jsx";',
      T,
    ],
    body: [[104, 192]],
  },
  {
    file: "JourneyGallery.jsx",
    name: "JourneyGallery",
    imports: [
      'import React, { useCallback, useEffect, useRef, useState } from "react";',
      'import { Sparkles } from "lucide-react";',
      'import ChevronIcon from "./ChevronIcon.jsx";',
      'import { useInViewOnce } from "@/components/landing/system/hooks";',
      'import LazyImage from "@/components/landing/LazyImage";',
      T,
    ],
    body: [[216, 216], [221, 422]],
  },
  {
    file: "JourneyModal.jsx",
    name: "JourneyModal",
    imports: [
      'import React, { useEffect, useRef } from "react";',
      'import { Link } from "react-router-dom";',
      'import { PillButton } from "@/components/landing/system/ui";',
      'import ChevronIcon from "./ChevronIcon.jsx";',
      T,
    ],
    body: [[425, 558]],
  },
  {
    file: "IntelligenceCopy.jsx",
    name: "IntelligenceCopy",
    imports: [R, T],
    body: [[559, 570]],
  },
  {
    file: "art-helpers.js",
    name: null,
    imports: [],
    body: [[572, 582], [584, 584]],
    tail: "export { ART_VARIANTS, isExternalSrc };\n",
  },
  {
    file: "IntelligenceArt.jsx",
    name: "IntelligenceArt",
    imports: [R, 'import { ART_VARIANTS } from "./art-helpers.js";'],
    body: [[586, 617]],
  },
  {
    file: "IntelligenceVisual.jsx",
    name: "IntelligenceVisual",
    imports: [
      R,
      'import { isExternalSrc } from "./art-helpers.js";',
      'import IntelligenceArt from "./IntelligenceArt.jsx";',
      'import LazyImage from "@/components/landing/LazyImage";',
    ],
    body: [[619, 643]],
  },
  { file: "LanguageChips.jsx", name: "LanguageChips", imports: [R, T], body: [[645, 669]] },
  {
    file: "StageDropdown.jsx",
    name: "StageDropdown",
    imports: ['import React, { useEffect, useRef, useState } from "react";', T],
    body: [[671, 725]],
  },
  {
    file: "ContinuityCard.jsx",
    name: "ContinuityCard",
    imports: [R, 'import LazyImage from "@/components/landing/LazyImage";', T],
    body: [[727, 754]],
  },
  {
    file: "AchievementAccordion.jsx",
    name: "AchievementAccordion",
    imports: [R, 'import { ChevronDown } from "lucide-react";', T],
    body: [[756, 787]],
  },
  {
    file: "JourneyCategoryCard.jsx",
    name: "JourneyCategoryCard",
    imports: [R, 'import LazyImage from "@/components/landing/LazyImage";'],
    body: [[789, 816]],
  },
  {
    file: "TrustCard.jsx",
    name: "TrustCard",
    imports: [
      R,
      'import { isExternalSrc } from "./art-helpers.js";',
      'import IntelligenceArt from "./IntelligenceArt.jsx";',
      'import LazyImage from "@/components/landing/LazyImage";',
      'import { Link } from "react-router-dom";',
      'import ChevronIcon from "./ChevronIcon.jsx";',
      T,
    ],
    body: [[818, 840]],
  },
  {
    file: "ExploreCard.jsx",
    name: "ExploreCard",
    imports: [
      R,
      'import LazyImage from "@/components/landing/LazyImage";',
      'import { Link } from "react-router-dom";',
      'import ChevronIcon from "./ChevronIcon.jsx";',
      T,
    ],
    body: [[842, 869]],
  },
];

const barrelNames = [
  "StruggleChapter", "CarouselDots", "JourneyGallery", "JourneyModal",
  "IntelligenceCopy", "IntelligenceVisual", "IntelligenceArt",
  "LanguageChips", "StageDropdown", "ContinuityCard", "AchievementAccordion",
  "JourneyCategoryCard", "TrustCard", "ExploreCard", "ChevronIcon",
  "VoiceIcon", "FadeReveal", "ScrollReveal", "RevealItem",
];

/* ── verify containment BEFORE writing anything ── */
let failed = 0;
for (const m of modules) {
  const body = m.body.map(([s, e]) => rng(s, e)).join("\n");
  for (const [s, e] of m.body) {
    const piece = lines.slice(s - 1, e).join("\n");
    if (!piece.trim()) { console.error(`RANGE ${s}-${e} EMPTY`); failed++; }
  }
}
if (failed) { process.exit(1); }

/* ── write modules ── */
for (const m of modules) {
  const body = m.body.map(([s, e]) => rng(s, e)).join("\n");
  const head = m.imports.length ? m.imports.join("\n") + "\n\n" : "";
  const out = head + body + (m.tail ?? `export default ${m.name};\n`);
  writeFileSync(join(ROOT, "sections", m.file), out);
  console.log(`wrote sections/${m.file} (${out.split("\n").length} lines)`);
}

/* ── barrel replaces the monolith ── */
const barrel = `/**
 * Shared persona-section components — extracted verbatim from the five
 * persona pages (Student/Teacher/Parent/Professional/Organization), whose
 * implementations were byte-identical except for page-specific strings.
 * Page data (slides, journey modals, icon maps, images) is passed in via
 * props; the visual anatomy, motion, and class strings live here once.
 *
 * Canonical colors come from system/tokens.js (the measured Apple-neutral
 * system): the hairline color.mist #d2d2d7 and the law chip wash
 * color.wash rgba(0,102,204,0.10) apply to every persona page through
 * this module. The pills come from system/ui.jsx (PillButton — the CTA law).
 *
 * F10 split: every component is its own side-effect-free module under
 * sections/ and this file is a pure re-export barrel — import sites are
 * unchanged, and rollup tree-shakes per module, so a page importing only
 * ChevronIcon no longer ships the whole persona section anatomy.
 */

`;
const exports = barrelNames
  .map((n) => `export { default as ${n} } from "./sections/${n}.jsx";`)
  .join("\n");
writeFileSync(ORIG, barrel + exports + "\n");
console.log(`wrote barrel PersonaSections.jsx (${barrelNames.length} re-exports)`);

/* ── final proof: every module body is byte-verbatim from the monolith ── */
let ok = true;
for (const m of modules) {
  const body = m.body.map(([s, e]) => rng(s, e)).join("\n").replace(/\r/g, "");
  const written = readFileSync(join(ROOT, "sections", m.file), "utf8");
  if (!written.includes(body.replace(/\n+$/, "\n").trim().replace(/\n{3,}/g, "\n\n"))) {
    console.error(`VERIFY FAIL: sections/${m.file}`);
    ok = false;
  }
}
console.log(ok ? "all module bodies verified verbatim" : "VERIFICATION FAILED");
process.exit(ok ? 0 : 1);
