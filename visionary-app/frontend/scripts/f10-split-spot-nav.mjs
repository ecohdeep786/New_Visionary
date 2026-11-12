/**
 * F10 split 3/4 — SpotIllustration.jsx (1223 lines) → SpotIllustration/ dir
 * and LandingNav.jsx (785 lines) → LandingNav/ dir. Import sites resolve
 * through index.jsx (extensions are never used in import specifiers; the
 * script aborts if any appear). Everything is verbatim line-range extraction;
 * the only scaffolding is each subject-group file's `const S = {};` +
 * `export default S;` bookends and the index merge.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = new URL("../src/components/landing", import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, "$1");
const SPOT = join(BASE, "SpotIllustration.jsx");
const NAV = join(BASE, "LandingNav.jsx");

/* guard: import specifiers must not carry the file extension, or deleting
   the monolith breaks them */
const scan = (dir, names) => {
  const { readdirSync, statSync } = require?.["node:fs"] ?? {};
  void readdirSync; void statSync;
  return true;
};
// quick textual scan of src for ".jsx"-suffixed specifiers of these files
import { readdirSync } from "node:fs";
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
};
const files = walk(new URL("../src", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const bad = files
  .map((f) => [f, readFileSync(f, "utf8")])
  .filter(([, t]) => t.includes('from "@/components/landing/SpotIllustration.jsx"') || t.includes('from "@/components/landing/LandingNav.jsx"'));
if (bad.length) {
  console.error("ABORT: extension-bearing import specifiers found:", bad.map(([f]) => f));
  process.exit(1);
}
if (!existsSync(SPOT) || !existsSync(NAV)) { console.error("ABORT: monolith already split"); process.exit(1); }

const slice = (text, ranges) => {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return ranges.map(([s, e]) => lines.slice(s - 1, e).join("\n")).join("\n").trim() + "\n";
};

/* ───────────────────────── SpotIllustration ───────────────────────── */
{
  const text = readFileSync(SPOT, "utf8");
  const seg = (s, e) => slice(text, [[s, e]]);
  mkdirSync(join(BASE, "SpotIllustration"), { recursive: true });

  writeFileSync(join(BASE, "SpotIllustration", "palette.jsx"),
    seg(32, 158) + "\nexport {\n  C, cardGradient, shadow, hairCapShaded, ear, glasses,\n  dot, legs, shoes, SKIN_DEFAULT, SKIN_DEEP, SKIN_DEEPER, headShaded,\n};\n");

  const P_MIN = 'import { C, cardGradient, shadow, dot } from "./palette.jsx";';
  writeFileSync(join(BASE, "SpotIllustration", "scenes-primary.jsx"),
    P_MIN + "\n\n" + seg(160, 598) + "\nexport default S;\n");

  writeFileSync(join(BASE, "SpotIllustration", "scenes-academic.jsx"),
    P_MIN + "\n\nconst S = {};\n\n" + seg(600, 778) + "\nexport default S;\n");

  writeFileSync(join(BASE, "SpotIllustration", "scenes-portraits.jsx"),
    'import { C, cardGradient, shadow, dot, legs, shoes, headShaded, hairCapShaded, ear, SKIN_DEFAULT, SKIN_DEEP, SKIN_DEEPER } from "./palette.jsx";\n\nconst S = {};\n\n' + seg(805, 934) + "\nexport default S;\n");

  writeFileSync(join(BASE, "SpotIllustration", "scenes-wide.jsx"),
    'import { C, cardGradient, shadow, dot, glasses, shoes, headShaded, hairCapShaded, ear, SKIN_DEFAULT, SKIN_DEEP, SKIN_DEEPER } from "./palette.jsx";\n\nconst S = {};\n\n' + seg(780, 803) + "\n" + seg(936, 1212) + "\nexport default S;\n");

  writeFileSync(join(BASE, "SpotIllustration", "index.jsx"),
    seg(1, 30) + "\nimport scenesPrimary from \"./scenes-primary.jsx\";\nimport scenesAcademic from \"./scenes-academic.jsx\";\nimport scenesPortraits from \"./scenes-portraits.jsx\";\nimport scenesWide from \"./scenes-wide.jsx\";\n\n/* the one subject map, gathered from the per-group scene modules */\nconst S = {\n  ...scenesPrimary,\n  ...scenesAcademic,\n  ...scenesPortraits,\n  ...scenesWide,\n};\n\n" + seg(1214, 1223));

  rmSync(SPOT);
  console.log("SpotIllustration split → dir (palette + 4 scene groups + index), monolith removed");
}

/* ───────────────────────── LandingNav ───────────────────────── */
{
  const text = readFileSync(NAV, "utf8");
  const seg = (s, e) => slice(text, [[s, e]]);
  mkdirSync(join(BASE, "LandingNav"), { recursive: true });

  writeFileSync(join(BASE, "LandingNav", "nav-data.js"),
    seg(19, 82) + "\nexport { CATEGORY_META, FALLBACK_META, metaFor, ORG_CONTEXTS, DOWNLOAD_PLATFORMS, ABOUT_GROUPS };\n");

  writeFileSync(join(BASE, "LandingNav", "nav-shared.jsx"),
    'import { Link } from "react-router-dom";\nimport { color as C } from "@/components/landing/system/tokens";\nimport { ABOUT_GROUPS } from "./nav-data.js";\n\n' + seg(15, 17) + "\n\n" + seg(84, 136) + "\n\nexport { FOCUS_RING, navLink, iconBtn, MEGA_TILE, MegaTile, isAboutPath, HOVER_OPEN_MS, HOVER_CLOSE_MS };\n");

  writeFileSync(join(BASE, "LandingNav", "index.jsx"),
    seg(1, 13) + "\n" +
    "import { metaFor, ORG_CONTEXTS, DOWNLOAD_PLATFORMS, ABOUT_GROUPS } from \"./nav-data.js\";\n" +
    "import { FOCUS_RING, navLink, iconBtn, MegaTile } from \"./nav-shared.jsx\";\n\n" +
    seg(138, 785));

  rmSync(NAV);
  console.log("LandingNav split → dir (nav-data + nav-shared + index), monolith removed");
}

console.log("F10 splits complete: SpotIllustration + LandingNav");
