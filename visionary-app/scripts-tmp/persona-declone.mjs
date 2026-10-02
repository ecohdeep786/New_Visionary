/* Persona de-clone codemod (v2 — per-page captures):
   1. Build PersonaSections.jsx from StudentPage verbatim bodies + props.
   2. Per page: capture page-specific values (struggle words, dots label,
      modal fallbacks, image exprs, icon-map names) BEFORE deleting the
      local copies; remove 6 hooks + 17 components + 4 internal consts;
      add shared imports; rewrite every usage site with the captured
      values. Every rewrite asserts exactly one match. */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = (p) => join(ROOT, "src/pages/landing/" + p + ".jsx");

const PAGES = ["StudentPage", "TeacherPage", "ParentPage", "CollegePage", "OrganizationPage"];

const MEMO_COMPONENTS = [
  "StruggleHeading", "StruggleCluster", "CarouselDots", "JourneyCarousel",
  "JourneyModal", "IntelligenceCopy", "IntelligenceVisual", "LanguageChips",
  "StageDropdown", "ContinuityCard", "AchievementAccordion",
  "JourneyCategoryCard", "TrustCard", "ExploreCard",
  "ChevronIcon", "VoiceIcon", "FadeReveal",
];
const HOOKS = ["UseCycleIndex", "UseRevealOnce", "UseRevealContinuous", "UseActiveStep", "UseScrollTrack", "UseStageIndex"];

function extractMemo(src, name) {
  const m = src.match(new RegExp(`const ${name} = React\\.memo\\(function ${name}\\(`));
  if (!m) throw new Error(`${name}: memo header not found`);
  const end = src.indexOf("\n});", m.index);
  if (end === -1) throw new Error(`${name}: memo end not found`);
  return src.slice(m.index, end + 4);
}

function replaceOnce(src, from, to, label) {
  const parts = src.split(from);
  if (parts.length !== 2) throw new Error(`${label}: expected 1 occurrence, got ${parts.length - 1}`);
  return parts.join(to);
}

/* ── shared module from StudentPage ── */
const student = readFileSync(pagePath("StudentPage"), "utf8");
const mod = {};
for (const n of MEMO_COMPONENTS) mod[n] = extractMemo(student, n);

const styleWord = student.slice(student.indexOf("const STRUGGLE_WORD_STYLE = `"), student.indexOf("`;", student.indexOf("const STRUGGLE_WORD_STYLE = `")) + 2);
const styleImage = student.slice(student.indexOf("const STRUGGLE_IMAGE_STYLE = `"), student.indexOf("`;", student.indexOf("const STRUGGLE_IMAGE_STYLE = `")) + 2);

// StruggleHeading words → lines prop
const studentWords = [...mod.StruggleHeading.matchAll(/<span className="block">([^<]*)<\/span>/g)].map((m) => m[1]);
if (studentWords.length !== 4) throw new Error("StruggleHeading: expected 4 word spans");
mod.StruggleHeading = replaceOnce(mod.StruggleHeading,
  studentWords.map((w) => `      <span className="block">${w}</span>\n`).join(""),
  `      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}\n`, "SH words");
mod.StruggleHeading = replaceOnce(mod.StruggleHeading,
  "function StruggleHeading({ word, slideKey }) {",
  "function StruggleHeading({ word, slideKey, lines }) {", "SH sig");

// CarouselDots label prop
mod.CarouselDots = replaceOnce(mod.CarouselDots,
  "function CarouselDots({ total, active, onSelect }) {",
  "function CarouselDots({ total, active, onSelect, label }) {", "CD sig");
mod.CarouselDots = replaceOnce(mod.CarouselDots,
  mod.CarouselDots.match(/aria-label="([^"]+)"/)[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  'aria-label={label}', "CD label");

// JourneyCarousel: iconMap + anchor ids
mod.JourneyCarousel = replaceOnce(mod.JourneyCarousel,
  "function JourneyCarousel({ stages, onOpen, trackRef, onScroll, canPrev, canNext, scrollByCard }) {",
  "function JourneyCarousel({ stages, onOpen, trackRef, onScroll, canPrev, canNext, scrollByCard, iconMap }) {", "JC sig");
mod.JourneyCarousel = replaceOnce(mod.JourneyCarousel,
  "const Icon = JOURNEY_STAGE_ICONS[stage.title] || Sparkles;",
  "const Icon = iconMap[stage.title] || Sparkles;", "JC iconMap");
mod.JourneyCarousel = replaceOnce(mod.JourneyCarousel,
  '<article key={stage.title} data-card className="w-[85%] shrink-0 snap-start sm:w-[440px] lg:w-[700px] xl:w-[780px]">',
  '<article key={stage.title} id={stage.id} data-card className="w-[85%] shrink-0 snap-start scroll-mt-24 sm:w-[440px] lg:w-[700px] xl:w-[780px]">', "JC anchors");

// JourneyModal: modals/stageMeta/fallbackKey/secondaryLabel props
mod.JourneyModal = replaceOnce(mod.JourneyModal,
  "function JourneyModal({ stage, onClose }) {",
  "function JourneyModal({ stage, onClose, modals, stageMeta, fallbackKey, secondaryLabel }) {", "JM sig");
mod.JourneyModal = replaceOnce(mod.JourneyModal,
  "const content = JOURNEY_MODALS[stage.title];",
  "const content = modals[stage.title];", "JM content");
mod.JourneyModal = replaceOnce(mod.JourneyModal,
  mod.JourneyModal.match(/const meta = STAGE_META\[stage\.title\] \|\| STAGE_META\["[^"]+"\];/)[0],
  "const meta = stageMeta[stage.title] || stageMeta[fallbackKey];", "JM meta");
mod.JourneyModal = replaceOnce(mod.JourneyModal,
  mod.JourneyModal.match(/\? \{ label: "[^"]+", to: "\/register" \}/)[0],
  '? { label: secondaryLabel, to: "/register" }', "JM secondary");

// IntelligenceVisual: image prop
const studentIntelSrc = mod.IntelligenceVisual.match(/src=("https[^"]+"|\{[^}]+\})/)[1];
mod.IntelligenceVisual = replaceOnce(mod.IntelligenceVisual, `src=${studentIntelSrc}`, "src={image}", "IV src");
mod.IntelligenceVisual = replaceOnce(mod.IntelligenceVisual,
  "function IntelligenceVisual({ step, index, setStepRef }) {",
  "function IntelligenceVisual({ step, index, setStepRef, image }) {", "IV sig");

// LanguageChips: chips prop
mod.LanguageChips = replaceOnce(mod.LanguageChips,
  "function LanguageChips({ active, onSelect }) {",
  "function LanguageChips({ active, onSelect, chips }) {", "LC sig");
mod.LanguageChips = replaceOnce(mod.LanguageChips,
  "{LANGUAGE_CHIPS.map((lang) => (", "{chips.map((lang) => (", "LC chips");

// ContinuityCard: images prop
mod.ContinuityCard = replaceOnce(mod.ContinuityCard,
  "src={CATEGORY_SECTION_IMG[index % CATEGORY_SECTION_IMG.length]}",
  "src={images[index % images.length]}", "CC src");
mod.ContinuityCard = replaceOnce(mod.ContinuityCard,
  'function ContinuityCard({ index, label, caption, text, imgClass = "", className = "" }) {',
  'function ContinuityCard({ index, label, caption, text, imgClass = "", className = "", images }) {', "CC sig");

// AchievementAccordion: meta prop
mod.AchievementAccordion = replaceOnce(mod.AchievementAccordion,
  "function AchievementAccordion({ tabs, open, onToggle }) {",
  "function AchievementAccordion({ tabs, open, onToggle, meta }) {", "AA sig");
mod.AchievementAccordion = replaceOnce(mod.AchievementAccordion,
  "const Meta = ACHIEVEMENT_META[i] || ACHIEVEMENT_META[0];",
  "const Meta = meta[i] || meta[0];", "AA meta");

// JourneyCategoryCard: iconMap prop
mod.JourneyCategoryCard = replaceOnce(mod.JourneyCategoryCard,
  "const Icon = JOURNEY_STAGE_ICONS[text] || Sparkles;",
  "const Icon = iconMap[text] || Sparkles;", "JCC iconMap");
mod.JourneyCategoryCard = replaceOnce(mod.JourneyCategoryCard,
  'function JourneyCategoryCard({ index, text, className = "" }) {',
  'function JourneyCategoryCard({ index, text, className = "", iconMap }) {', "JCC sig");

// TrustCard: image prop
mod.TrustCard = replaceOnce(mod.TrustCard, "function TrustCard({ card }) {", "function TrustCard({ card, image }) {", "TC sig");
mod.TrustCard = replaceOnce(mod.TrustCard,
  mod.TrustCard.match(/src=("https[^"]+"|\{[^}]+\})/)[0], "src={image}", "TC src");

// ExploreCard: images prop
mod.ExploreCard = replaceOnce(mod.ExploreCard, "src={EXPLORE_CAT_IMG[index]}", "src={images[index]}", "EC src");
mod.ExploreCard = replaceOnce(mod.ExploreCard,
  "function ExploreCard({ index, category }) {",
  "function ExploreCard({ index, category, images }) {", "EC sig");

const moduleSrc = `import React from "react";
import { Link } from "react-router-dom";

/**
 * Shared persona-section components — extracted verbatim from the five
 * persona pages (Student/Teacher/Parent/Professional/Organization), whose
 * implementations were byte-identical except for page-specific strings.
 * Page data (slides, journey modals, icon maps, images) is passed in via
 * props; the visual anatomy, motion, and class strings live here once.
 *
 * Canonical colors: the site hairline #dadce0 and the Google app-chip tint
 * #e8f0fe (chip law) apply to every persona page through this module.
 */
const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  slate: "#5f6368",
  lightGrey: "#9AA0A6",
  blue: "#4285F4",
  chipBg: "#e8f0fe",
  mist: "#dadce0",
  white: "#ffffff",
};

/** Struggle-circle crop positions and keyframes, identical on every page. */
const STRUGGLE_MAIN_POSITIONS = ["center 30%"];

${styleWord}
${styleImage}

${MEMO_COMPONENTS.map((n) => mod[n]).join("\n\n")}
`;

writeFileSync(join(ROOT, "src/components/landing/persona/PersonaSections.jsx"), moduleSrc);
console.log("PersonaSections.jsx written");

/* ── per-page rewrite ── */
for (const page of PAGES) {
  let src = readFileSync(pagePath(page), "utf8");

  /* capture page-specific values BEFORE deleting */
  const words = [...extractMemo(src, "StruggleHeading").matchAll(/<span className="block">([^<]*)<\/span>/g)].map((m) => m[1]);
  if (words.length !== 4) throw new Error(`${page}: struggle words != 4`);
  const dotsLabel = extractMemo(src, "CarouselDots").match(/aria-label="([^"]+)"/)[1];
  const jmBody = extractMemo(src, "JourneyModal");
  const fallbackKey = jmBody.match(/STAGE_META\[stage\.title\] \|\| STAGE_META\["([^"]+)"\]/)[1];
  const secondaryLabel = jmBody.match(/\? \{ label: "([^"]+)", to: "\/register" \}/)[1];
  const intelSrc = extractMemo(src, "IntelligenceVisual").match(/src=("https[^"]+"|\{[^}]+\})/)[1];
  const trustSrc = extractMemo(src, "TrustCard").match(/src=("https[^"]+"|\{[^}]+\})/)[1];
  const catIconMap = extractMemo(src, "JourneyCategoryCard").includes("JOURNEY_FLOW_ICONS") ? "JOURNEY_FLOW_ICONS" : "JOURNEY_STAGE_ICONS";
  const jcIconMap = extractMemo(src, "JourneyCarousel").includes("JOURNEY_FLOW_ICONS") ? "JOURNEY_FLOW_ICONS" : "JOURNEY_STAGE_ICONS";
  const ccImages = extractMemo(src, "ContinuityCard").match(/src=\{(\w+)\[/)[1];
  const aaMeta = extractMemo(src, "AchievementAccordion").match(/const Meta = (\w+)\[i\]/)[1];
  const ecImages = extractMemo(src, "ExploreCard").match(/src=\{(\w+)\[/)[1];
  const lcChips = extractMemo(src, "LanguageChips").match(/\{(\w+)\.map\(\(lang\)/)[1];

  /* delete local hooks + components + internal consts */
  for (const h of HOOKS) {
    const start = src.indexOf(`function ${h}(`);
    if (start === -1) throw new Error(`${page}: hook ${h} missing`);
    const end = src.indexOf("\n}", start);
    src = src.slice(0, start) + src.slice(end + 2);
  }
  for (const n of MEMO_COMPONENTS) {
    const body = extractMemo(src, n);
    src = replaceOnce(src, body, "", `${page} remove ${n}`);
  }
  for (const c of ["STRUGGLE_MAIN_POSITIONS", "STRUGGLE_SATELLITES", "STRUGGLE_WORD_STYLE", "STRUGGLE_IMAGE_STYLE"]) {
    const re = c.endsWith("STYLE")
      ? new RegExp(`const ${c} = \`[\\s\\S]*?\`;\\n\\n?`)
      : new RegExp(`const ${c} = \\[[^\\]]*\\];\\n`);
    if (!re.test(src)) throw new Error(`${page}: const ${c} not found`);
    src = src.replace(re, "");
  }

  /* shared imports after the last import line */
  const importHook = 'import { useCycleIndex as UseCycleIndex, useRevealOnce as UseRevealOnce, useRevealContinuous as UseRevealContinuous, useActiveStep as UseActiveStep, useHorizontalTrack as UseScrollTrack, useStageIndex as UseStageIndex } from "@/components/landing/system/hooks";';
  const importSections = `import {
  StruggleHeading,
  StruggleCluster,
  CarouselDots,
  JourneyCarousel,
  JourneyModal,
  IntelligenceCopy,
  IntelligenceVisual,
  LanguageChips,
  StageDropdown,
  ContinuityCard,
  AchievementAccordion,
  JourneyCategoryCard,
  TrustCard,
  ExploreCard,
  ChevronIcon,
  VoiceIcon,
  FadeReveal,
} from "@/components/landing/persona/PersonaSections";`;
  const semi = src.lastIndexOf('from "@/');
  const lineEnd = src.indexOf("\n", src.indexOf(";", semi)) + 1;
  src = src.slice(0, lineEnd) + importHook + "\n" + importSections + "\n" + src.slice(lineEnd);

  /* injected data consts */
  const injectBefore = (marker, text, label) => {
    const at = src.indexOf(marker);
    if (at === -1) throw new Error(`${page}: inject anchor for ${label} missing`);
    src = src.slice(0, at) + text + src.slice(at);
  };
  injectBefore("const SLIDES = [", `const STRUGGLE_LINES = ${JSON.stringify(words)};\n\n`, "STRUGGLE_LINES");
  if (intelSrc.startsWith('"https')) injectBefore("const SLIDES = [", `const INTELLIGENCE_VISUAL_IMAGE = ${intelSrc};\n\n`, "INTEL const");
  if (trustSrc.startsWith('"https')) injectBefore("const TRUST_CARDS = [", `const TRUST_CARD_IMAGE = ${trustSrc};\n\n`, "TRUST const");

  /* usage rewrites */
  src = replaceOnce(src,
    "<StruggleHeading word={slide.word} slideKey={index} />",
    "<StruggleHeading word={slide.word} slideKey={index} lines={STRUGGLE_LINES} />", `${page} SH`);
  src = replaceOnce(src,
    "<CarouselDots total={SLIDES.length} active={index} onSelect={goTo} />",
    `<CarouselDots total={SLIDES.length} active={index} onSelect={goTo} label="${dotsLabel}" />`, `${page} CD`);
  src = replaceOnce(src,
    "        scrollByCard={scrollByCard}\n      />",
    `        scrollByCard={scrollByCard}\n        iconMap={${jcIconMap}}\n      />`, `${page} JC`);
  src = replaceOnce(src,
    "<JourneyModal stage={openStage} onClose={() => setOpenStage(null)} />",
    `<JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="${fallbackKey}" secondaryLabel="${secondaryLabel}" />`, `${page} JM`);
  const intelExpr = intelSrc.startsWith('"https')
    ? "INTELLIGENCE_VISUAL_IMAGE"
    : intelSrc === "{step.image}"
      ? "step.image"
      : intelSrc.slice(1, -1).replace(/\bindex\b/g, "i");
  src = replaceOnce(src,
    "<IntelligenceVisual step={s} index={i} setStepRef={setStepRef} />",
    `<IntelligenceVisual step={s} index={i} setStepRef={setStepRef} image={${intelExpr}} />`, `${page} IV`);
  if (trustSrc.startsWith('"https')) {
    src = replaceOnce(src, "<TrustCard card={active} />", "<TrustCard card={active} image={TRUST_CARD_IMAGE} />", `${page} TC a`);
    src = replaceOnce(src, "<TrustCard card={next} />", "<TrustCard card={next} image={TRUST_CARD_IMAGE} />", `${page} TC b`);
  } else {
    const arr = trustSrc.match(/\{(\w+)\[cardIndex % (\w+)\.length\]\}/);
    if (!arr) throw new Error(`${page}: unexpected trust src ${trustSrc}`);
    src = replaceOnce(src,
      "<TrustCard card={active} cardIndex={index} />",
      `<TrustCard card={active} image={${arr[1]}[index % ${arr[2]}.length]} />`, `${page} TC a`);
    src = replaceOnce(src,
      "<TrustCard card={next} cardIndex={(index + 1) % TRUST_CARDS.length} />",
      `<TrustCard card={next} image={${arr[1]}[(index + 1) % ${arr[2]}.length]} />`, `${page} TC b`);
  }
  for (const lbl of ["Previous", "Now", "Next"]) {
    src = replaceOnce(src,
      `<ContinuityCard index={index} label="${lbl}"`,
      `<ContinuityCard images={${ccImages}} index={index} label="${lbl}"`, `${page} CC ${lbl}`);
  }
  src = replaceOnce(src,
    "AchievementAccordion tabs={",
    `AchievementAccordion meta={${aaMeta}} tabs={`, `${page} AA`);
  src = replaceOnce(src,
    "<JourneyCategoryCard index={index} text={first}",
    `<JourneyCategoryCard iconMap={${catIconMap}} index={index} text={first}`, `${page} JCC a`);
  src = replaceOnce(src,
    "<JourneyCategoryCard index={index + 1} text={second}",
    `<JourneyCategoryCard iconMap={${catIconMap}} index={index + 1} text={second}`, `${page} JCC b`);
  src = replaceOnce(src,
    "<ExploreCard index={index} key={c.slug} category={c} />",
    `<ExploreCard index={index} key={c.slug} category={c} images={${ecImages}} />`, `${page} EC`);
  src = replaceOnce(src,
    "<LanguageChips active={lang} onSelect={setLang} />",
    `<LanguageChips active={lang} onSelect={setLang} chips={${lcChips}} />`, `${page} LC`);

  writeFileSync(pagePath(page), src);
  console.log(`${page} rewritten (words="${words.join(" ")}" label="${dotsLabel}" fallback=${fallbackKey} secondary="${secondaryLabel}")`);
}

console.log("student intel src:", studentIntelSrc);
console.log("student trust src:", student.src);
