/**
 * F10 binding audit — the split scripts added per-module import headers by
 * hand, and rollup treats a free identifier as a GLOBAL (no build error), so
 * every split module is audited here: any name referenced in the body must
 * appear in that file's import statements (or be declared locally).
 *
 * Strategy: parse each file's import specifiers into a declared-names set,
 * collect top-level const/let/function/var + parameter-free body identifiers,
 * then scan body text for candidate FREE identifiers among the known
 * cross-module names (palette, helpers, tokens, icons). Cheap, targeted, and
 * catches exactly the classes of drift a hand-built header can have.
 * Usage: node scripts/f10-audit-bindings.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PERSONA = new URL("../src/components/landing/persona", import.meta.url)
  .pathname.replace(/^\/([A-Za-z]:)/, "$1");
const LANDING = new URL("../src/components/landing", import.meta.url)
  .pathname.replace(/^\/([A-Za-z]:)/, "$1");

const importNames = (text) => {
  const names = new Set();
  for (const m of text.matchAll(/import\s+[^;]+?from\s+["'][^"']+["']/g)) {
    const clause = m[0];
    for (const d of clause.matchAll(/\{([^}]+)\}/g)) {
      for (const piece of d[1].split(",")) {
        let n = piece.trim();
        if (!n) continue;
        n = n.replace(/^type\s+/, "");
        const as = n.split(/\s+as\s+/);
        names.add((as[1] ?? as[0]).trim());
      }
    }
    for (const d of clause.matchAll(/import\s+(\*|\{|\w)/g)) {
      void d;
    }
    const def = clause.match(/^import\s+(\w+)(?:\s*,)?/);
    if (def) names.add(def[1]);
    const star = clause.match(/import\s+\*\s+as\s+(\w+)/);
    if (star) names.add(star[1]);
  }
  return names;
};

const localDecls = (text) => {
  const names = new Set();
  for (const m of text.matchAll(/^\s*(?:export\s+)?(?:const|let|var|function)\s+(\w+)/gm)) {
    names.add(m[1]);
  }
  return names;
};

/* candidate free identifiers, grouped by which concerns them */
const CANDIDATES = {
  "sections/*.jsx": [
    "revealStyle", "useAppleLinkedReveal", "STRUGGLE_MASK", "ART_VARIANTS",
    "isExternalSrc", "itemCounter", "JOURNEY_GALLERY_MS", "PillButton",
    "color", "useInViewOnce", "Sparkles", "ChevronDown",
    "ChevronIcon", "VoiceIcon", "FadeReveal", "RevealItem", "ScrollReveal",
    "CarouselDots", "LazyImage", "Link",
  ],
  "premium/*.jsx": [
    "useCentredStep", "INTELLIGENCE_CLIPS", "IntelligenceBeats",
    "IntelligenceFrame", "IntelligenceDrawer", "JourneyPairCard",
    "PremiumPlayPauseButton", "PremiumOrbitDots", "PremiumPlayPause",
    "fontStack", "color", "ScrollReveal", "RevealItem", "ChevronIcon",
    "ChevronDown", "LazyImage", "Link", "useRevealOnce",
    "usePrefersReducedMotion", "useScrollTrack", "useHorizontalTrack",
  ],
  "SpotIllustration/*.jsx": [
    "C", "cardGradient", "shadow", "dot", "glasses", "legs", "shoes",
    "headShaded", "hairCapShaded", "ear", "SKIN_DEFAULT", "SKIN_DEEP",
    "SKIN_DEEPER",
  ],
  "LandingNav/*": [
    "CATEGORY_META", "FALLBACK_META", "metaFor", "ORG_CONTEXTS",
    "DOWNLOAD_PLATFORMS", "ABOUT_GROUPS", "FOCUS_RING", "navLink", "iconBtn",
    "MEGA_TILE", "MegaTile", "isAboutPath", "HOVER_OPEN_MS", "HOVER_CLOSE_MS",
    "color", "fontStack", "CATEGORIES", "VisionaryLogo", "C",
    "GraduationCap", "Users", "Briefcase", "Building2", "HeartHandshake",
    "Sparkles", "BookOpen", "UsersRound", "Monitor", "Smartphone", "Laptop",
    "Apple", "Chrome", "TabletSmartphone", "ShieldCheck", "Lock",
    "Accessibility", "Newspaper", "Mail", "Handshake", "Bell", "Gift",
    "Menu", "X", "ChevronDown", "CircleHelp", "Link", "useLocation",
    "useEffect", "useRef", "useState",
  ],
};

const dirs = [
  { label: "PersonaSections/sections", path: join(PERSONA, "sections"), cand: CANDIDATES["sections/*.jsx"] },
  { label: "PersonaSections/premium", path: join(PERSONA, "premium"), cand: CANDIDATES["premium/*.jsx"] },
  { label: "SpotIllustration", path: join(LANDING, "SpotIllustration"), cand: CANDIDATES["SpotIllustration/*.jsx"] },
  { label: "LandingNav", path: join(LANDING, "LandingNav"), cand: CANDIDATES["LandingNav/*"] },
];

let bad = 0;
for (const { label, path, cand } of dirs) {
  for (const f of readdirSync(path)) {
    if (!/\.(jsx|js)$/.test(f)) continue;
    const text = readFileSync(join(path, f), "utf8");
    const declared = new Set([...importNames(text), ...localDecls(text)]);
    /* strip import statements so imported-name references don't collide with
       candidate matching; we care about BODY references */
    const body = text
      .replace(/import\s+[^;]+?from\s+["'][^"']+["']/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    const missing = cand.filter((n) =>
      new RegExp(`(?<![\\w.$])${n}(?![:\\w])`).test(body) && !declared.has(n)
    );
    const unused = [...declared].filter((n) => cand.includes(n) && !new RegExp(`\\b${n}\\b`).test(body));
    if (missing.length) {
      console.log(`MISSING ${label}/${f}: ${missing.join(", ")}`);
      bad++;
    }
  }
}

console.log(bad ? `\n${bad} FILE(S) WITH FREE IDENTIFIERS — fix before shipping` : "\nall split bindings resolve");
process.exit(bad ? 1 : 0);
