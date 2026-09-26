// SafetyPage: restore missing LandingNav/Breadcrumb/LandingFooter + fix pillar subjects.
import { readFileSync, writeFileSync } from "node:fs";
const f = "src/pages/landing/SafetyPage.jsx";
let s = readFileSync(f, "utf8");

// imports
if (!s.includes('import Breadcrumb')) {
  s = s.replace(
    'import LandingNav from "@/components/landing/LandingNav";',
    'import LandingNav from "@/components/landing/LandingNav";\nimport Breadcrumb from "@/components/landing/Breadcrumb";\nimport LandingFooter from "@/components/landing/LandingFooter";'
  );
}
// chrome: nav + breadcrumb before hero, footer after CTA
s = s.replace(
  "    <div className=\"min-h-screen bg-white\" style={{ fontFamily: FONT_FAMILY }}>\n      <SafetyHero />",
  "    <div className=\"min-h-screen bg-white\" style={{ fontFamily: FONT_FAMILY }}>\n      <LandingNav />\n      <Breadcrumb page=\"Safety\" />\n      <SafetyHero />"
);
s = s.replace(
  "      <SafetyCTA />\n    </div>\n  );",
  "      <SafetyCTA />\n      <LandingFooter variant=\"quiet\" />\n    </div>\n  );"
);
// pillar subjects that don't exist → existing scenes
s = s.replace('subject: "eye"', 'subject: "document"');
s = s.replace('subject: "flag"', 'subject: "history"');
writeFileSync(f, s);
console.log("safety chrome restored");
