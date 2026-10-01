/* Sheet-stack wiring round 2: sticky-bottom-0 (which cannot pin on downward
   scroll) -> relative isolate + the useSheetStack scroll controller. */
import fs from "node:fs";

const PAGES = [
  ["src/pages/landing/StudentPage.jsx", "StudentPage"],
  ["src/pages/landing/TeacherPage.jsx", "TeacherPage"],
  ["src/pages/landing/ParentPage.jsx", "ParentPage"],
  ["src/pages/landing/CollegePage.jsx", "CollegePage"],
  ["src/pages/landing/OrganizationPage.jsx", "OrganizationPage"],
];

for (const [file, component] of PAGES) {
  let src = fs.readFileSync(file, "utf8");
  /* section classes: sticky bottom-0 -> relative (the hook drives pinning) */
  src = src.split("sticky bottom-0 isolate").join("relative isolate");
  /* hero base in NewPersona */
  const heroFile = "src/components/landing/NewPersona.jsx";
  let hero = fs.readFileSync(heroFile, "utf8");
  if (hero.includes("sticky bottom-0 isolate")) {
    fs.writeFileSync(heroFile, hero.split("sticky bottom-0 isolate").join("relative isolate"));
    console.log("hero reverted to relative:", heroFile);
  }
  /* import after the last landing-system import or LandingNav import */
  if (!src.includes("useSheetStack")) {
    const importRe = /import VisionChapterNav|import (PersonaHero|LandingNav) from "@\/components\/landing\/(NewPersona|LandingNav)";\r?\n/;
    const m = src.match(/import PersonaHero from "@\/components\/landing\/NewPersona";\r?\n/);
    if (m) src = src.replace(m[0], m[0] + 'import useSheetStack from "@/components/landing/system/useSheetStack";\n');
    else {
      const nav = src.match(/import LandingNav from "@\/components\/landing\/LandingNav";\r?\n/);
      if (nav) src = src.replace(nav[0], nav[0] + 'import useSheetStack from "@/components/landing/system/useSheetStack";\n');
      else { console.log("MISS import anchor:", file); process.exitCode = 1; continue; }
    }
    /* hook call as the first statement of the page component */
    const fnRe = new RegExp(`export default function ${component}\\(\\) \\{\\r?\\n`);
    if (!fnRe.test(src)) { console.log("MISS component fn:", component); process.exitCode = 1; continue; }
    src = src.replace(fnRe, (mm) => mm + "  useSheetStack();\n");
    fs.writeFileSync(file, src);
    console.log("wired:", file);
  } else console.log("skip (wired):", file);
}
