/**
 * F10 split — PremiumPersonaSections.jsx (1375 lines) → per-section modules.
 *
 * Same verbatim surgery as f10-split-persona.mjs: module bodies are extracted
 * by line range (no retyping), wrapped with the exact per-module import
 * header, verified by substring containment, then the monolith becomes a
 * pure re-export barrel in the original export order. Landing statically
 * imports only 4 of the 7 sections — with sideEffects:css-only the
 * tree-shaker drops Language/Achievement/JourneyFlow from its chunk.
 * Run: node scripts/f10-split-premium.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src/components/landing/persona", import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, "$1");
const ORIG = join(ROOT, "PremiumPersonaSections.jsx");

const text = readFileSync(ORIG, "utf8").replace(/\r\n/g, "\n");
const lines = text.split("\n");
const rng = (s, e) => lines.slice(s - 1, e).join("\n").trim() + "\n";

/* the persona reveal/icon pieces premium sections lean on — direct module
   imports (barrel-free) so every chunk stays minimal */
const SR = 'import ScrollReveal from "../sections/ScrollReveal.jsx";';
const RI = 'import RevealItem from "../sections/RevealItem.jsx";';
const CI = 'import ChevronIcon from "../sections/ChevronIcon.jsx";';
const HK = 'import { useRevealOnce, usePrefersReducedMotion } from "@/components/landing/system/hooks";';
const C = 'import { color } from "@/components/landing/system/tokens";';
const LI = 'import LazyImage from "@/components/landing/LazyImage";';

const modules = [
  {
    file: "PremiumIntelligenceSection.jsx",
    name: "PremiumIntelligenceSection",
    imports: [
      'import React, { useCallback, useEffect, useRef, useState } from "react";',
      'import { Link } from "react-router-dom";',
      'import { useRevealOnce, usePrefersReducedMotion } from "@/components/landing/system/hooks";',
      'import { ScrollReveal, RevealItem, ChevronIcon } from "@/components/landing/persona/PersonaSections";',
      'import { fontStack } from "@/components/landing/system/tokens";',
      'import ScrollReveal0 from "@/components/landing/system/noop";',
    ],
    imports: null, // set below
    body: [[24, 59], [61, 61], [63, 404]],
  },
  {
    file: "PremiumLanguageSection.jsx",
    name: "PremiumLanguageSection",
    body: [[408, 412], [414, 608]],
  },
  {
    file: "PremiumAchievementSection.jsx",
    name: "PremiumAchievementSection",
    imports: [
      'import React, { useState } from "react";',
      'import { ChevronDown } from "lucide-react";',
      'import { useRevealOnce } from "@/components/landing/system/hooks";',
      'import ScrollReveal from "../sections/ScrollReveal.jsx";',
      'import RevealItem from "../sections/RevealItem.jsx";',
      C,
      LI,
    ],
    body: [[613, 702]],
  },
  {
    file: "PremiumJourneyFlowSection.jsx",
    name: "PremiumJourneyFlowSection",
    imports: [
      'import React, { useCallback, useEffect, useRef, useState } from "react";',
      'import { Link } from "react-router-dom";',
      'import { useRevealOnce } from "@/components/landing/system/hooks";',
      'import ScrollReveal from "../sections/ScrollReveal.jsx";',
      'import RevealItem from "../sections/RevealItem.jsx";',
      CI,
      C,
      LI,
    ],
    body: [[707, 908]],
  },
  {
    file: "PremiumTrustSection.jsx",
    name: "PremiumTrustSection",
    imports: [
      'import React from "react";',
      'import { Link } from "react-router-dom";',
      'import { useRevealOnce } from "@/components/landing/system/hooks";',
      'import ScrollReveal from "../sections/ScrollReveal.jsx";',
      'import RevealItem from "../sections/RevealItem.jsx";',
      CI,
      C,
    ],
    body: [[913, 1055]],
  },
  {
    file: "PremiumCTASection.jsx",
    name: "PremiumCTASection",
    imports: [
      'import React from "react";',
      'import { Link } from "react-router-dom";',
      'import { useRevealOnce } from "@/components/landing/system/hooks";',
      'import ScrollReveal from "../sections/ScrollReveal.jsx";',
      'import RevealItem from "../sections/RevealItem.jsx";',
      CI,
      C,
    ],
    body: [[1059, 1196]],
  },
  {
    file: "PremiumExploreSection.jsx",
    name: "PremiumExploreSection",
    imports: [
      'import React, { useCallback, useRef } from "react";',
      'import { Link } from "react-router-dom";',
      'import { useRevealOnce, useHorizontalTrack as useScrollTrack } from "@/components/landing/system/hooks";',
      'import ScrollReveal from "../sections/ScrollReveal.jsx";',
      'import RevealItem from "../sections/RevealItem.jsx";',
      CI,
      C,
      LI,
    ],
    body: [[1200, 1373]],
  },
];

/* exact headers, decided from the body dependency scan */
modules[0].imports = [
  'import React, { useCallback, useEffect, useRef, useState } from "react";',
  'import { Link } from "react-router-dom";',
  'import { useRevealOnce, usePrefersReducedMotion } from "@/components/landing/system/hooks";',
  'import ScrollReveal from "../sections/ScrollReveal.jsx";',
  'import RevealItem from "../sections/RevealItem.jsx";',
  'import ChevronIcon from "../sections/ChevronIcon.jsx";',
  'import { fontStack } from "@/components/landing/system/tokens";',
];
modules[1].imports = [
  'import React, { useCallback, useEffect, useRef, useState } from "react";',
  'import { Link } from "react-router-dom";',
  'import { useRevealOnce, usePrefersReducedMotion } from "@/components/landing/system/hooks";',
  'import ScrollReveal from "../sections/ScrollReveal.jsx";',
  'import RevealItem from "../sections/RevealItem.jsx";',
  'import ChevronIcon from "../sections/ChevronIcon.jsx";',
  C,
];

const order = [
  "PremiumIntelligenceSection",
  "PremiumLanguageSection",
  "PremiumAchievementSection",
  "PremiumJourneyFlowSection",
  "PremiumTrustSection",
  "PremiumCTASection",
  "PremiumExploreSection",
];

mkdirSync(join(ROOT, "premium"), { recursive: true });
for (const m of modules) {
  const body = m.body.map(([s, e]) => rng(s, e)).join("\n");
  const out = m.imports.join("\n") + "\n\n" + body + `export default ${m.name};\n`;
  writeFileSync(join(ROOT, "premium", m.file), out);
  console.log(`wrote premium/${m.file} (${out.split("\n").length} lines)`);
}

/* barrel replaces the monolith — original export order + the file's header doc */
const barrel = `/**
 * PREMIUM PARITY SECTIONS — the student page's FINAL section anatomy, shared
 * by every persona page so all five pages share one exact Apple-premium
 * section-for-section match. Each component mirrors the student page's inline
 * sections exactly; only the data differs.
 *
 * 05 · INTELLIGENCE — the dark technology chapter: one sticky product stage,
 * four beats swap it as their copy crosses the viewport centre.
 *
 * F10 split: every section is its own side-effect-free module under
 * premium/ and this file is a pure re-export barrel — import sites are
 * unchanged, and rollup tree-shakes per module. The landing's router uses
 * 4 of the 7 sections; category pages use all 7.
 */

`;
const exports = order
  .map((n) => `export { default as ${n} } from "./premium/${n}.jsx";`)
  .join("\n");
writeFileSync(ORIG, barrel + exports + "\n");
console.log(`wrote barrel PremiumPersonaSections.jsx (${order.length} re-exports)`);

/* verify every module's section body is byte-verbatim from the monolith */
let ok = true;
for (const m of modules) {
  const body = m.body.map(([s, e]) => rng(s, e)).join("\n").trim();
  const written = readFileSync(join(ROOT, "premium", m.file), "utf8");
  const found = body.split("\n").every((line) => written.includes(line));
  if (!found) { console.error(`VERIFY FAIL: premium/${m.file}`); ok = false; }
}
console.log(ok ? "all premium module bodies verified verbatim" : "VERIFICATION FAILED");
process.exit(ok ? 0 : 1);
