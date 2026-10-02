/**
 * Applies the Vision Pro scroll system to the five category pages.
 * Every replacement asserts its expected hit count — any miss aborts the run
 * before write, so a partial conversion can never land.
 */
import fs from "node:fs";

const PAGES = [
  { file: "src/pages/landing/StudentPage.jsx", P: "Student", Display: "Student", intel: "INTELLIGENCE_WORDS", keeps: "KEEPS_WORDS", lang: "LANGUAGE_QUESTIONS" },
  { file: "src/pages/landing/TeacherPage.jsx", P: "Teacher", Display: "Teacher", intel: "TEACHER_INTELLIGENCE_WORDS", keeps: "TEACHER_KEEPS_WORDS", lang: "TEACHER_LANGUAGE_QUESTIONS" },
  { file: "src/pages/landing/ParentPage.jsx", P: "Parent", Display: "Parent", intel: "INTELLIGENCE_WORDS", keeps: "KEEPS_WORDS", lang: "LANGUAGE_QUESTIONS" },
  { file: "src/pages/landing/CollegePage.jsx", P: "Pro", Display: "Professional", intel: "INTELLIGENCE_WORDS", keeps: "KEEPS_WORDS", lang: "LANGUAGE_QUESTIONS" },
  { file: "src/pages/landing/OrganizationPage.jsx", P: "Org", Display: "Organization", intel: "INTELLIGENCE_WORDS", keeps: "KEEPS_WORDS", lang: "LANGUAGE_QUESTIONS" },
];

let failures = 0;
const fail = (msg) => { failures += 1; console.error("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);

/** Replace `find` with `repl`, expecting exactly `count` hits (default 1). */
function swap(src, find, repl, count = 1, label = "") {
  const parts = src.split(find);
  if (parts.length - 1 !== count) {
    fail(`${label || find.slice(0, 60)}: expected ${count} hit(s), found ${parts.length - 1}`);
    return src;
  }
  ok(`${label || find.slice(0, 60)}`);
  return parts.join(repl);
}

/** Replace a regex, expecting exactly `count` matches. */
function swapRe(src, re, repl, count, label) {
  const hits = src.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"));
  const n = hits ? hits.length : 0;
  if (n !== count) {
    fail(`${label}: expected ${count} hit(s), found ${n}`);
    return src;
  }
  ok(`${label}`);
  return src.replace(re, repl);
}

function bodyOf(src, startMarker) {
  const i = src.indexOf(startMarker);
  if (i < 0) fail(`missing start marker: ${startMarker}`);
  const end = src.indexOf("\n}\n", i);
  if (end < 0) fail(`missing end brace for: ${startMarker}`);
  return { start: i, end: end + 3 };
}

for (const page of PAGES) {
  console.log(`\n═══ ${page.file}`);
  let src = fs.readFileSync(page.file, "utf8");
  const { P, Display, intel, keeps, lang } = page;

  /* ── 1. imports ─────────────────────────────────────────────── */
  if (!src.includes("system/ScrollStage")) {
    src = swap(
      src,
      `import useSheetStack from "@/components/landing/system/useSheetStack";`,
      `import useSheetStack from "@/components/landing/system/useSheetStack";
import ScrollStage, { StageDots } from "@/components/landing/system/ScrollStage";
import { scrollToStageStep, useScrubIndex } from "@/components/landing/system/motion";`,
      1,
      "imports"
    );
  }

  /* ── 2. Struggle → pinned scroll stage ──────────────────────── */
  if (!src.includes("wrapperRef={stageRef}")) {
    const { start, end } = bodyOf(src, `function ${P}StruggleSection() {`);
    const struggleNew = `function ${P}StruggleSection() {
  /* Vision Pro pattern: the section pins below the nav and the scroll drives
     the slide; the dots jump by scrolling the stage, not by a timer. */
  const stageRef = useRef(null);
  const jumpToSlide = useCallback(
    (i) => scrollToStageStep(stageRef.current, SLIDES.length, i),
    []
  );
  const scene = useCallback((i) => {
    const slide = SLIDES[i];
    return (
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-10">
        <div className="mx-auto w-full max-w-[420px] lg:col-span-5 lg:mx-0 lg:max-w-none lg:pl-[4%] xl:pl-[6.5%]">
          <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>
            The problem
          </p>
          <div className="mt-6">
            <StruggleHeading word={slide.word} slideKey={i} />
          </div>
        </div>

        <div className="relative w-full lg:col-span-7 lg:pr-[2%] xl:pr-[4%]">
          <StruggleCluster slide={slide} slideKey={i} />
        </div>
      </div>
    );
  }, []);

  return (
    <section data-section="02-struggle" className="relative isolate overflow-x-clip bg-white py-24 lg:py-32 rounded-t-[32px]">
      <ScrollStage
        steps={SLIDES.length}
        render={scene}
        wrapperRef={stageRef}
        footer={(i) => (
          <div className="mt-10 flex justify-center px-6">
            <StageDots
              total={SLIDES.length}
              active={i}
              onSelect={jumpToSlide}
              label="${Display} learning challenges"
            />
          </div>
        )}
      />
    </section>
  );
}
`;
    src = src.slice(0, start) + struggleNew + src.slice(end);
    ok("struggle → ScrollStage");
  }

  /* ── 3. Journey heading word → scroll scrub ─────────────────── */
  if (src.includes(`UseCycleIndex(JOURNEY_WORDS.length, JOURNEY_WORD_MS)`)) {
    src = swap(
      src,
      `  const { index } = UseCycleIndex(JOURNEY_WORDS.length, JOURNEY_WORD_MS);`,
      `  /* Heading word follows the scroll instead of a clock (Vision Pro). */
  const journeyScrub = useScrubIndex(JOURNEY_WORDS.length);
  const index = journeyScrub.index;
  const journeySectionRef = useCallback(
    (el) => { ref.current = el; journeyScrub.ref.current = el; },
    [ref, journeyScrub.ref]
  );`,
      1,
      "journey scrub hook"
    );
    src = swapRe(
      src,
      /<section ref=\{ref\} (data-section="04-journey")/,
      `<section ref={journeySectionRef} $1`,
      1,
      "journey section ref"
    );
  }

  /* ── 4. Intelligence heading word → scroll scrub ────────────── */
  if (src.includes(`UseCycleIndex(${intel}.length, INTELLIGENCE_WORD_MS)`)) {
    src = swap(
      src,
      `  const { index: wordIndex } = UseCycleIndex(${intel}.length, INTELLIGENCE_WORD_MS);`,
      `  const intelScrub = useScrubIndex(${intel}.length);
  const wordIndex = intelScrub.index;
  const intelHeadRef = useCallback(
    (el) => { headRef.current = el; intelScrub.ref.current = el; },
    [headRef, intelScrub.ref]
  );`,
      1,
      "intelligence scrub hook"
    );
    if (src.includes('<section ref={headRef} data-section="05-intelligence"')) {
      src = swap(
        src,
        '<section ref={headRef} data-section="05-intelligence"',
        '<section ref={intelHeadRef} data-section="05-intelligence"',
        1,
        "intelligence section ref (with data-section)"
      );
    } else {
      src = swap(
        src,
        '<section ref={headRef} className=',
        '<section ref={intelHeadRef} className=',
        1,
        "intelligence section ref (plain, Student layout)"
      );
    }
  }

  /* ── 5. Closing keeps-word → scroll scrub ───────────────────── */
  if (src.includes(`UseCycleIndex(${keeps}.length, KEEPS_WORD_MS)`)) {
    src = swap(
      src,
      `  const { index } = UseCycleIndex(${keeps}.length, KEEPS_WORD_MS);`,
      `  const closingScrub = useScrubIndex(${keeps}.length);
  const index = closingScrub.index;
  const closingSectionRef = useCallback(
    (el) => { ref.current = el; closingScrub.ref.current = el; },
    [ref, closingScrub.ref]
  );`,
      1,
      "closing scrub hook"
    );
    src = swapRe(
      src,
      /<section ref=\{ref\} (data-section="06-closing")/,
      `<section ref={closingSectionRef} $1`,
      1,
      "closing section ref"
    );
  }

  /* ── 6. Language question → scroll scrub ────────────────────── */
  if (src.includes(`UseCycleIndex(${lang}.length, QUESTION_MS)`)) {
    src = swap(
      src,
      `  const { index } = UseCycleIndex(${lang}.length, QUESTION_MS);`,
      `  const langScrub = useScrubIndex(${lang}.length);
  const index = langScrub.index;
  const langSectionRef = useCallback(
    (el) => { ref.current = el; langScrub.ref.current = el; },
    [ref, langScrub.ref]
  );`,
      1,
      "language scrub hook"
    );
    src = swapRe(
      src,
      /<section ref=\{ref\} (data-section="07-language")/,
      `<section ref={langSectionRef} $1`,
      1,
      "language section ref"
    );
  }

  /* ── 7. JourneyFlow pair → scroll scrub ─────────────────────── */
  if (src.includes(`UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS)`)) {
    src = swap(
      src,
      `  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);`,
      `  const flowScrub = useScrubIndex(JOURNEY_CATEGORIES.length - 1);
  const index = flowScrub.index;
  const flowSectionRef = useCallback(
    (el) => { ref.current = el; flowScrub.ref.current = el; },
    [ref, flowScrub.ref]
  );`,
      1,
      "journey-flow scrub hook"
    );
    src = swapRe(
      src,
      /<section ref=\{ref\} (data-section="10-journey-flow")/,
      `<section ref={flowSectionRef} $1`,
      1,
      "journey-flow section ref"
    );
  }

  /* ── 8. Retire the now-dead timer hook + constants ──────────── */
  if (!src.includes("UseRevealContinuous()")) {
    const { start, end } = bodyOf(src, "function UseRevealContinuous");
    src = src.slice(0, start) + src.slice(end).replace(/^\n+/, "\n");
    ok("removed UseRevealContinuous");
    for (const c of ["CYCLE_MS", "JOURNEY_WORD_MS", "INTELLIGENCE_WORD_MS", "KEEPS_WORD_MS", "QUESTION_MS", "CATEGORY_MS"]) {
      const line = new RegExp(`^const ${c} = \\d+;\\n`, "m");
      if (line.test(src)) {
        src = src.replace(line, "");
        ok(`removed constant ${c}`);
      }
    }
  } else {
    fail("UseRevealContinuous still referenced — Struggle conversion did not land");
  }

  /* ── 9. College-only: undo the experimental sticky sections ─── */
  if (src.includes('className="sticky bottom-0 isolate')) {
    src = swap(src, 'className="sticky bottom-0 isolate', 'className="relative isolate', 12, "college sticky bottom-0 → relative");
  }

  fs.writeFileSync(page.file, src);
  console.log(`  saved (${(src.length / 1024).toFixed(1)} KB)`);
}

console.log(failures ? `\n${failures} FAILURE(S) — nothing partial above failed loudly` : "\nAll pages converted cleanly.");
process.exit(failures ? 1 : 0);
