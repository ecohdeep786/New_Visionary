// Wrap preserved form/state sections in the standard page container.
import { readFileSync, writeFileSync } from "node:fs";
const jobs = [
  ["src/pages/landing/ContactPage.jsx", ["form"]],
  ["src/pages/landing/PartnersPage.jsx", ["directory", "become"]],
  ["src/pages/landing/ReferralPage.jsx", ["start"]],
  ["src/pages/landing/ResearchNewsPage.jsx", ["publications"]],
];
for (const [file, ids] of jobs) {
  let s = readFileSync(file, "utf8");
  for (const id of ids) {
    const start = s.indexOf(`<section id="${id}"`);
    if (start === -1) { console.log(file, id, "MISS"); continue; }
    const end = s.indexOf("</section>", start) + "</section>".length;
    const block = s.slice(start, end);
    const inner = block.replace(
      /^<section id="([^"]*)" className="([^"]*)">/,
      (_m, idAttr, cls) => `<section id="${idAttr}" className="${cls} px-6 py-20 sm:px-8 lg:px-10 lg:py-28">\n          <div className="mx-auto max-w-[1240px]">`
    );
    // the grabbed block's own closing </section> needs a </div> before it
    const fixed = inner.replace(/\n(\s*)<\/section>$/, "\n$1  </div>\n        </section>");
    s = s.slice(0, start) + fixed + s.slice(end);
    console.log(file, id, "wrapped");
  }
  writeFileSync(file, s);
}
