// SafetyPage chrome v2 — against the concurrently-rewritten file (CRLF aware).
import { readFileSync, writeFileSync } from "node:fs";
const f = "src/pages/landing/SafetyPage.jsx";
let s = readFileSync(f, "utf8");

// 1. imports (anchor on the legalMeta import that certainly exists)
if (!s.includes("import LandingNav")) {
  const imp = "import { LEGAL_META, RESPONSE_TIMES } from \"@/data/legalMeta\";";
  if (!s.includes(imp)) { console.log("IMP-MISS"); process.exit(1); }
  s = s.replace(
    imp,
    imp + "\r\nimport LandingNav from \"@/components/landing/LandingNav\";\r\nimport Breadcrumb from \"@/components/landing/Breadcrumb\";\r\nimport LandingFooter from \"@/components/landing/LandingFooter\";"
  );
}

// 2. nav + breadcrumb before the hero
const open = "style={{ fontFamily: FONT_FAMILY }}>\r\n      <SafetyHero />";
if (!s.includes(open)) { console.log("OPEN-MISS"); process.exit(1); }
s = s.replace(
  open,
  "style={{ fontFamily: FONT_FAMILY }}>\r\n      <LandingNav />\r\n      <Breadcrumb page=\"Safety\" />\r\n      <SafetyHero />"
);

// 3. footer before the closing div of the default export (the LAST </div> before final })
const tail = "</div>\r\n  );\r\n}";
const last = s.lastIndexOf(tail);
if (last === -1) { console.log("TAIL-MISS"); process.exit(1); }
s = s.slice(0, last) + "<LandingFooter variant=\"quiet\" />\r\n    " + s.slice(last);

writeFileSync(f, s);
console.log("safety chrome v2 restored");
