/* Dedup v2 — remove every copy of the two journey doc-comment blocks and
   reinsert exactly one canonical copy before each component declaration.
   Pure split/join, no regex. Idempotent. */
const fs = require("node:fs");
const P = "src/components/landing/persona/PersonaSections.jsx";
let s = fs.readFileSync(P, "utf8");
const before = s.length;

const blocks = [
  {
    start: "/* The journey gallery on persona pages",
    end: "viewport edge. */",
    anchor: "const JourneyGallery = React.memo(",
    canonical: [
      "/* The journey gallery on persona pages — one anatomy site-wide, rebuilt to",
      "   Apple's education-initiative story-card grammar (the \"Equipping today's",
      "   learners…\" chapter, measured live): cards at 68% of the viewport (980px",
      "   @1440), 30px radius, the story headline INSIDE the card bottom-left at",
      "   48px/600 white over Apple's exact bottom smoke (transparent to",
      "   rgba(0,0,0,0.7) across the lower ~43%), a bare 36px white plus glyph",
      "   bottom-right, and the whole card as the button that opens the stage's",
      "   story modal. The controls are Apple's bare 36px glyph row 25px under",
      "   the card: play/pause left, prev/next right, no dots. Auto-advances",
      "   every 5s (opening a card pauses the tour; reduced motion steps",
      "   instantly). The track shares the header's gutter so the statement and",
      "   the first card sit on one spine, with the next card peeking at the",
      "   viewport edge. */",
    ].join("\n"),
  },
  {
    start: "/* The stage's story popup",
    end: "focus is trapped and restored. */",
    anchor: "const JourneyModal = React.memo(",
    canonical: [
      "/* The stage's story popup — Apple's modal-story anatomy (measured on the",
      "   education-initiative card click-through): a full-screen WHITE blur",
      "   curtain (rgba(255,255,255,0.48) over blur(20px)), the white panel inset",
      "   16px at radius 30px, the media full-bleed at the panel's top edge with",
      "   the stage chip over its own smoke, then the story zone: 48px/600",
      "   heading, 17px body, the canonical black primary pill, and the feature",
      "   blocks. Close is Apple's bare glyph over the media. Escape and the",
      "   backdrop close it; focus is trapped and restored. */",
    ].join("\n"),
  },
];

for (const b of blocks) {
  // cut out every existing copy (start marker .. end marker inclusive)
  let cuts = 0;
  for (;;) {
    const i = s.indexOf(b.start);
    if (i < 0) break;
    const j = s.indexOf(b.end, i);
    if (j < 0) break;
    s = s.slice(0, i) + s.slice(j + b.end.length);
    cuts++;
  }
  // insert exactly one canonical copy right before the declaration
  const a = s.indexOf(b.anchor);
  if (a < 0) { console.error("ANCHOR MISSING for", b.start); process.exit(1); }
  s = s.slice(0, a) + b.canonical + "\n" + s.slice(a);
  console.log("block:", b.start.slice(3, 40) + "… — removed", cuts, "cop(y/ies), inserted 1");
}

fs.writeFileSync(P, s);
console.log("dedup delta:", s.length - before, "chars");
