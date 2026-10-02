/**
 * Exact inverse of apple-scroll-apply.mjs — restores the five persona pages
 * to their pre-session state. Original mechanical blocks (Struggle section,
 * CarouselDots, UseRevealContinuous) are extracted from git HEAD; the user's
 * uncommitted copy edits live outside those blocks and are preserved.
 * Every replacement asserts its expected hit count — any miss aborts.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";

const PAGES = [
  { file: "src/pages/landing/StudentPage.jsx", P: "Student", intel: "INTELLIGENCE_WORDS", keeps: "KEEPS_WORDS", lang: "LANGUAGE_QUESTIONS" },
  { file: "src/pages/landing/TeacherPage.jsx", P: "Teacher", intel: "TEACHER_INTELLIGENCE_WORDS", keeps: "TEACHER_KEEPS_WORDS", lang: "TEACHER_LANGUAGE_QUESTIONS" },
  { file: "src/pages/landing/ParentPage.jsx", P: "Parent", intel: "INTELLIGENCE_WORDS", keeps: "KEEPS_WORDS", lang: "LANGUAGE_QUESTIONS" },
  { file: "src/pages/landing/CollegePage.jsx", P: "Pro", intel: "INTELLIGENCE_WORDS", keeps: "KEEPS_WORDS", lang: "LANGUAGE_QUESTIONS" },
  { file: "src/pages/landing/OrganizationPage.jsx", P: "Org", intel: "INTELLIGENCE_WORDS", keeps: "KEEPS_WORDS", lang: "LANGUAGE_QUESTIONS" },
];

let failures = 0;
const fail = (msg) => { failures += 1; console.error("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);

function swap(src, find, repl, count = 1, label = "") {
  const parts = src.split(find);
  if (parts.length - 1 !== count) {
    fail(`${label || find.slice(0, 60)}: expected ${count} hit(s), found ${parts.length - 1}`);
    return src;
  }
  ok(`${label || find.slice(0, 60)}`);
  return parts.join(repl);
}

function gitHead(file) {
  return execSync(`git show HEAD:visionary-app/${file}`, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
}

/** span from startMarker through the first "\n}\n" after it */
function block(src, startMarker) {
  const i = src.indexOf(startMarker);
  if (i < 0) fail(`missing marker in source: ${startMarker}`);
  const end = src.indexOf("\n}\n", i);
  if (end < 0) fail(`missing end brace for: ${startMarker}`);
  return src.slice(i, end + 3);
}

/** span of a React.memo component ending in "\n});\n" */
function memoBlock(src, startMarker) {
  const i = src.indexOf(startMarker);
  if (i < 0) fail(`missing marker in source: ${startMarker}`);
  const end = src.indexOf("\n});\n", i);
  if (end < 0) fail(`missing memo end for: ${startMarker}`);
  return src.slice(i, end + 5);
}

for (const page of PAGES) {
  console.log(`\n═══ ${page.file}`);
  const { P, intel, keeps, lang } = page;
  let cur = fs.readFileSync(page.file, "utf8");
  const orig = gitHead(page.file);

  /* ── 1. remove the system imports ──────────────────────────── */
  cur = swap(
    cur,
    `
import ScrollStage, { StageDots } from "@/components/landing/system/ScrollStage";
import { scrollToStageStep, useScrubIndex } from "@/components/landing/system/motion";`,
    "",
    1,
    "remove system imports"
  );

  /* ── 2. restore Struggle (original section + CarouselDots from HEAD) ── */
  const dotsOrig = memoBlock(orig, "const CarouselDots = React.memo");
  const struggleOrig = block(orig, `function ${P}StruggleSection() {`);
  const convStart = cur.indexOf(`function ${P}StruggleSection() {`);
  const convEnd = cur.indexOf("\n}\n", convStart);
  if (convStart < 0 || convEnd < 0) {
    fail("converted struggle function not found");
  } else {
    cur = cur.slice(0, convStart) + dotsOrig + "\n\n" + struggleOrig + cur.slice(convEnd + 3);
    ok("struggle restored (+ CarouselDots from HEAD)");
  }

  /* ── 3. restore UseRevealContinuous from HEAD ──────────────── */
  const revealOrig = block(orig, "function UseRevealContinuous");
  cur = swap(cur, "function UseActiveStep(total) {", revealOrig + "\n\nfunction UseActiveStep(total) {", 1, "UseRevealContinuous restored");

  /* ── 4. restore the timer constants (grouped after SLIDES) ─── */
  const slidesClose = cur.indexOf("const SLIDES = [");
  const closeIdx = cur.indexOf("\n];\n", slidesClose);
  if (slidesClose < 0 || closeIdx < 0) {
    fail("SLIDES array close not found");
  } else {
    const insertAt = closeIdx + 4;
    cur =
      cur.slice(0, insertAt) +
      "\nconst CYCLE_MS = 4000;\nconst JOURNEY_WORD_MS = 3000;\nconst INTELLIGENCE_WORD_MS = 3000;\nconst KEEPS_WORD_MS = 2500;\nconst QUESTION_MS = 3200;\nconst CATEGORY_MS = 4200;\n" +
      cur.slice(insertAt);
    ok("timer constants restored");
  }

  /* ── 5. scrub hooks → original UseCycleIndex lines ─────────── */
  cur = swap(
    cur,
    `  /* Heading word follows the scroll instead of a clock (Vision Pro). */
  const journeyScrub = useScrubIndex(JOURNEY_WORDS.length);
  const index = journeyScrub.index;
  const journeySectionRef = useCallback(
    (el) => { ref.current = el; journeyScrub.ref.current = el; },
    [ref, journeyScrub.ref]
  );`,
    `  const { index } = UseCycleIndex(JOURNEY_WORDS.length, JOURNEY_WORD_MS);`,
    1,
    "journey hook restored"
  );
  cur = swap(cur, '<section ref={journeySectionRef} data-section="04-journey"', '<section ref={ref} data-section="04-journey"', 1, "journey ref restored");

  cur = swap(
    cur,
    `  const intelScrub = useScrubIndex(${intel}.length);
  const wordIndex = intelScrub.index;
  const intelHeadRef = useCallback(
    (el) => { headRef.current = el; intelScrub.ref.current = el; },
    [headRef, intelScrub.ref]
  );`,
    `  const { index: wordIndex } = UseCycleIndex(${intel}.length, INTELLIGENCE_WORD_MS);`,
    1,
    "intelligence hook restored"
  );
  cur = cur.includes('<section ref={intelHeadRef} data-section="05-intelligence"')
    ? swap(cur, '<section ref={intelHeadRef} data-section="05-intelligence"', '<section ref={headRef} data-section="05-intelligence"', 1, "intelligence ref restored (data-section)")
    : swap(cur, '<section ref={intelHeadRef} className=', '<section ref={headRef} className=', 1, "intelligence ref restored (plain)");

  cur = swap(
    cur,
    `  const closingScrub = useScrubIndex(${keeps}.length);
  const index = closingScrub.index;
  const closingSectionRef = useCallback(
    (el) => { ref.current = el; closingScrub.ref.current = el; },
    [ref, closingScrub.ref]
  );`,
    `  const { index } = UseCycleIndex(${keeps}.length, KEEPS_WORD_MS);`,
    1,
    "closing hook restored"
  );
  cur = swap(cur, '<section ref={closingSectionRef} data-section="06-closing"', '<section ref={ref} data-section="06-closing"', 1, "closing ref restored");

  cur = swap(
    cur,
    `  const langScrub = useScrubIndex(${lang}.length);
  const index = langScrub.index;
  const langSectionRef = useCallback(
    (el) => { ref.current = el; langScrub.ref.current = el; },
    [ref, langScrub.ref]
  );`,
    `  const { index } = UseCycleIndex(${lang}.length, QUESTION_MS);`,
    1,
    "language hook restored"
  );
  cur = swap(cur, '<section ref={langSectionRef} data-section="07-language"', '<section ref={ref} data-section="07-language"', 1, "language ref restored");

  cur = swap(
    cur,
    `  const flowScrub = useScrubIndex(JOURNEY_CATEGORIES.length - 1);
  const index = flowScrub.index;
  const flowSectionRef = useCallback(
    (el) => { ref.current = el; flowScrub.ref.current = el; },
    [ref, flowScrub.ref]
  );`,
    `  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);`,
    1,
    "journey-flow hook restored"
  );
  cur = swap(cur, '<section ref={flowSectionRef} data-section="10-journey-flow"', '<section ref={ref} data-section="10-journey-flow"', 1, "journey-flow ref restored");

  /* ── 6. College only: restore its pre-session sticky classes ── */
  if (P === "Pro") {
    const stickyClassNames = [
      'className="relative isolate overflow-hidden px-6 py-24 lg:py-32 bg-white rounded-t-[32px]"',
      'className="relative isolate overflow-hidden py-24 lg:py-32 bg-white rounded-t-[32px]"',
      'className="relative isolate [overflow-x:clip] bg-white rounded-t-[32px]"',
      'className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]"',
      'className="relative isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]"',
      'className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]"',
      'className="relative isolate py-16 lg:py-24 [overflow-x:clip] bg-white rounded-t-[32px]"',
    ];
    let restored = 0;
    for (const cn of stickyClassNames) {
      const stickyCn = cn.replace('className="relative isolate', 'className="sticky bottom-0 isolate');
      let n = 0;
      while (cur.includes(cn)) {
        cur = cur.replace(cn, stickyCn);
        n += 1;
      }
      restored += n;
    }
    console.log(`    college sticky classes restored: ${restored} (expect 11)`);
    if (restored !== 11) fail(`college sticky restore count ${restored} != 11`);
  }

  fs.writeFileSync(page.file, cur);
  console.log(`  saved (${(cur.length / 1024).toFixed(1)} KB)`);
}

console.log(failures ? `\n${failures} FAILURE(S) — inspect before continuing` : "\nAll pages restored.");
process.exit(failures ? 1 : 0);
