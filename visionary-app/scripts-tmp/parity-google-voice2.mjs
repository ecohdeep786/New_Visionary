// Batch 2 — same grammar for /partners, /referral, /accessibility + shared About hero
// (covers every legal page hero): ink headings, grey caps labels, short hero subs.
import { readFileSync, writeFileSync } from "node:fs";

const P = "src/pages/landing/";
const BLUE = "color: COLORS.blue";
const INK = "color: COLORS.ink";
const EYEBROW = {
  search: 'text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}',
  replace: 'text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}',
};

const edits = [
  [P + "AccessibilityPage.jsx", [
    [`<span style={{ ${BLUE} }}>Use Visionary your way.</span>`, `<span style={{ ${INK} }}>Use Visionary your way.</span>`],
    [`<span style={{ ${BLUE} }}>It is to give more people a way in.</span>`, `<span style={{ ${INK} }}>It is to give more people a way in.</span>`],
    ["People do not all read, hear, speak, move, or interact with technology in the same way. Visionary should make room for those differences so more people can understand, practise, create, and continue.",
     "Visionary should make room for the many ways people read, hear, speak, and interact."],
    [EYEBROW.search, EYEBROW.replace, ":ALL"],
  ]],
  [P + "ReferralPage.jsx", [
    [`<span style={{ ${BLUE} }}>Help someone start.</span>`, `<span style={{ ${INK} }}>Help someone start.</span>`],
    [`<span style={{ ${BLUE} }}>can change where someone starts.</span>`, `<span style={{ ${INK} }}>can change where someone starts.</span>`],
    [`<span style={{ ${BLUE} }}>can become someone's beginning.</span>`, `<span style={{ ${INK} }}>can become someone's beginning.</span>`],
    ["Visionary grows through people who find it useful enough to share. The referral program gives people a simple way to introduce Visionary to others.",
     "A simple way to introduce Visionary to someone who needs it."],
    [EYEBROW.search, EYEBROW.replace, ":ALL"],
  ]],
  [P + "PartnersPage.jsx", [
    [`<span style={{ ${BLUE} }}>closer to where learning happens.</span>`, `<span style={{ ${INK} }}>closer to where learning happens.</span>`],
    [`<span style={{ ${BLUE} }}>Knowing where it belongs is another.</span>`, `<span style={{ ${INK} }}>Knowing where it belongs is another.</span>`],
    [`<span style={{ ${BLUE} }}>Build for more places.</span>`, `<span style={{ ${INK} }}>Build for more places.</span>`],
    ["The right partner can make a product more useful in a particular school, institution, region, or learning environment. Visionary is building partnerships around that idea.",
     "The right partner makes Visionary more useful in a specific place."],
    [EYEBROW.search, EYEBROW.replace, ":ALL"],
  ]],
  ["src/components/landing/AboutPageShared.jsx", [
    ["{p.accent ? <span style={{ color: COLORS.blue }}>{p.text}</span> : p.text}",
     "{p.accent ? <span style={{ color: COLORS.ink }}>{p.text}</span> : p.text}"],
    ["{heading} {headingAccent && <span style={{ color: COLORS.blue }}>{headingAccent}</span>}",
     "{heading} {headingAccent && <span style={{ color: COLORS.ink }}>{headingAccent}</span>}"],
    ["{title} {titleAccent && <span style={{ color: COLORS.blue }}>{titleAccent}</span>}",
     "{title} {titleAccent && <span style={{ color: COLORS.ink }}>{titleAccent}</span>}"],
    ['<p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.blue }}>{r.n}</p>',
     '<p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.lightGrey }}>{r.n}</p>'],
  ]],
];

let applied = 0, failed = [];
for (const [file, pairs] of edits) {
  let src = readFileSync(file, "utf8");
  for (const [search, replace, flag] of pairs) {
    const count = src.split(search).length - 1;
    if (flag === ":ALL") {
      if (count === 0) { failed.push(`${file} :: ${search.slice(0, 50)}`); continue; }
      src = src.split(search).join(replace);
      applied += count;
    } else {
      if (count !== 1) { failed.push(`${file} :: [${count}x] ${search.slice(0, 60)}`); continue; }
      src = src.replace(search, replace);
      applied += 1;
    }
  }
  writeFileSync(file, src);
}
console.log(`applied: ${applied}`);
if (failed.length) { console.log("FAILED:"); failed.forEach((f) => console.log("  " + f)); process.exit(1); }
console.log("batch 2 clean");
