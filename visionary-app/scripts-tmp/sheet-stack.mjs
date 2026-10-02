/* Sheet-stack pass:
   A) remove the VisionChapterNav subnav (user rejected: duplicates landing nav)
   B) hero base (NewPersona) -> sticky bottom sheet
   C) every persona-page section -> sticky bottom-0 isolate sheet with an
      opaque bg and a rounded top edge, so each section scrolls normally,
      pins when its bottom reaches the viewport bottom, and the next section
      slides up OVER it — the Apple Vision Pro page-over-page grammar. */
import fs from "node:fs";

const PAGES = [
  "src/pages/Landing.jsx",
  "src/pages/landing/StudentPage.jsx",
  "src/pages/landing/TeacherPage.jsx",
  "src/pages/landing/ParentPage.jsx",
  "src/pages/landing/CollegePage.jsx",
  "src/pages/landing/OrganizationPage.jsx",
];

/* A) remove the chapter subnav */
for (const file of PAGES) {
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  src = src.replace(/import VisionChapterNav from "@\/components\/landing\/VisionChapterNav";\r?\n/, "");
  src = src.replace(/^[ \t]*<VisionChapterNav [^>]*\/>\r?\n/m, "");
  src = src.replace(/const (LANDING|PERSONA)_CHAPTERS = \[[\s\S]*?\];\r?\n\r?\n/, "");
  if (src !== before) { fs.writeFileSync(file, src); console.log("subnav removed:", file); }
  else console.log("subnav: nothing to remove in", file);
}
fs.rmSync("src/components/landing/VisionChapterNav.jsx", { force: true });
console.log("VisionChapterNav.jsx deleted");

/* B) hero base sheet (NewPersona — used by all five persona pages) */
{
  const file = "src/components/landing/NewPersona.jsx";
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const heroIdx = lines.findIndex((l) => l.includes('data-section="01-hero"'));
  if (heroIdx >= 0) {
    for (let i = heroIdx; i < Math.min(heroIdx + 4, lines.length); i++) {
      if (lines[i].includes('className="relative overflow-hidden"')) {
        lines[i] = lines[i].replace('className="relative overflow-hidden"', 'className="sticky bottom-0 isolate overflow-hidden"');
        console.log("hero base sheet:", file);
        break;
      }
    }
  }
  fs.writeFileSync(file, lines.join("\n"));
}

/* C) persona page sections -> stacked sheets */
const SHEETS = [
  "src/pages/landing/StudentPage.jsx",
  "src/pages/landing/TeacherPage.jsx",
  "src/pages/landing/ParentPage.jsx",
  "src/pages/landing/CollegePage.jsx",
  "src/pages/landing/OrganizationPage.jsx",
];
let sheets = 0;
for (const file of SHEETS) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes("<section") || !lines[i].includes('data-section="')) continue;
    const m = lines[i].match(/className="([^"]*)"/);
    if (!m) continue;
    let cls = m[1];
    if (cls.includes("sticky bottom-0")) continue;
    cls = cls.replace(/^relative /, "sticky bottom-0 isolate ");
    if (!/bg-[a-z[#]/.test(cls)) cls += " bg-white";
    if (!cls.includes("rounded-t-")) cls += " rounded-t-[32px]";
    lines[i] = lines[i].replace(m[0], `className="${cls}"`);
    count++;
  }
  fs.writeFileSync(file, lines.join("\n"));
  sheets += count;
  console.log(`${count} sheets: ${file}`);
}
console.log(`total sheets: ${sheets}`);
