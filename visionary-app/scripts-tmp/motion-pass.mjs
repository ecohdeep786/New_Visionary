/* Motion pass — unify landing reveals to one grammar measured from live
   apple.com + workspace.google.com + edu.google.com (see motion-study/):
   reveal = 700ms ease-google (cubic-bezier(0.22,1,0.36,1)), translateY 24px,
   reduced-motion = instant visible. Heroes untouched. */
import fs from "node:fs";

const EDITS = [
  /* translate-y-5 reveals -> translate-y-6 + ease-google (About, Community) */
  ["src/pages/landing/AboutUsPage.jsx",
    'transition duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}',
    'transition duration-700 ease-google motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}'],
  ["src/pages/landing/CommunityPage.jsx",
    'transition duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}',
    'transition duration-700 ease-google motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}'],
  /* translate-y-5 + ease-out (Careers, Research) */
  ["src/pages/landing/CareersPage.jsx",
    'transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}',
    'transition-all duration-700 ease-google motion-reduce:transition-none motion-reduce:transform-none ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}'],
  ["src/pages/landing/ResearchNewsPage.jsx",
    'transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}',
    'transition-all duration-700 ease-google motion-reduce:transition-none motion-reduce:transform-none ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}'],
  /* translate-y-4 observer reveals (Updates, Safety, Referral, Partners) */
  ["src/pages/landing/UpdatesPage.jsx", "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none", "transition-[opacity,transform] duration-700 ease-google motion-reduce:transition-none"],
  ["src/pages/landing/UpdatesPage.jsx", 'shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"', 'shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"'],
  ["src/pages/landing/SafetyPage.jsx", "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none", "transition-[opacity,transform] duration-700 ease-google motion-reduce:transition-none"],
  ["src/pages/landing/SafetyPage.jsx", 'shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"', 'shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"'],
  ["src/pages/landing/ReferralPage.jsx", "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none", "transition-[opacity,transform] duration-700 ease-google motion-reduce:transition-none"],
  ["src/pages/landing/ReferralPage.jsx", 'shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"', 'shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"'],
  ["src/pages/landing/PartnersPage.jsx", "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none", "transition-[opacity,transform] duration-700 ease-google motion-reduce:transition-none"],
  ["src/pages/landing/PartnersPage.jsx", 'shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"', 'shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"'],
  /* static reveal wrappers — ease token only */
  ["src/pages/landing/ContactPage.jsx", 'transition duration-700 ease-out ${className}', 'transition duration-700 ease-google ${className}'],
  ["src/pages/landing/AccessibilityPage.jsx", "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none", "transition-[opacity,transform] duration-700 ease-google motion-reduce:transition-none"],
  /* g-card hover: Google's live cards transition shadow at 200ms (measured) */
  ["src/index.css", "transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);", "transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);"],
];

let applied = 0, missed = [];
for (const [file, from, to] of EDITS) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes(from)) { missed.push([file, from]); continue; }
  fs.writeFileSync(file, src.replace(from, to));
  applied++;
}
console.log(`applied: ${applied}/${EDITS.length}`);
if (missed.length) { console.log("MISSED:"); missed.forEach((m) => console.log("  " + m.join("  ::  "))); process.exitCode = 1; }
