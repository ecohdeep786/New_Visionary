import React, { useCallback, useState } from "react";
import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, GraduationCap, Target, Brain, Award } from "lucide-react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import parentHero from "@/assets/parent-hero-main-2400w.webp";
import parentHeroContent from "@/assets/parent-hero-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import parentFace from "@/assets/parent-face-main.webp";
import PersonaHero from "@/components/landing/NewPersona";
import useSheetStack from "@/components/landing/system/useSheetStack";
import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";

/**
 * Problem Section
 */
import problemexam from "@/assets/problem-exam.webp";
import problempractice from "@/assets/problem-practice.webp";
import problemrevision from "@/assets/problem-revision.webp";
import problemunderstanding from "@/assets/problem-understanding.webp";

/**
 * Our Journey Section
 */
import primaryStudent from "@/assets/student-primary.webp";
import secondaryStudent from "@/assets/student-secondary.webp";
import competitiveStudent from "@/assets/student-competitive.webp";
import higherStudent from "@/assets/student-higher.webp";
import vocationStudent from "@/assets/student-vocational.webp";

/**
 * Achievement Section
 */
import parentachivenment from "@/assets/achievenment-achieve.webp";
import parentbuild from "@/assets/achivenment-build.webp";

/**
 * Explore Category
 */
import studentmeet from "@/assets/student-hero-main-2400w.webp";
import teachermeet from "@/assets/teacher-face-main.webp";
import promeet from "@/assets/pro-face-main-2400w.webp";
import orgmeet from "@/assets/org-face-main-2400w.webp";
import { useCycleIndex as UseCycleIndex, useRevealOnce as UseRevealOnce, useRevealContinuous as UseRevealContinuous, useActiveStep as UseActiveStep, useHorizontalTrack as UseScrollTrack, useStageIndex as UseStageIndex } from "@/components/landing/system/hooks";
import {
  StruggleChapter,
  JourneyGallery,
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
  ScrollReveal,
} from "@/components/landing/persona/PersonaSections";

const EXPLORE_CAT_IMG = [studentmeet, teachermeet, promeet, orgmeet];

/* ═══════════════════════════════════════════════════════════════════
 * SECTION MAP (render order) — each <section> has data-section for DevTools
 * 01 hero · 02 struggle · 04 journey · 05 intelligence ·
 * 06 closing · 07 language · 08 continuity · 09 achievement ·
 * 10 journey-flow · 11 trust · 12 cta · 13 explore
 * (03 retired — the promise/question beat; keys keep their historical
 * numbers so bridge CSS and probes stay stable)
 * ═══════════════════════════════════════════════════════════════════ */

/* ── DESIGN TOKENS ── */
const COLORS = {
  ink: "#121317",
  surface: "#F5F6F8",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  chipBg: "#D2E3FC",
  mist: "#dadce0",
  white: "#ffffff",
  cardSurface: "#EEF1F6",
  cardSurfaceAlt: "#E9EFFA",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";

/* ═══════════════════════ CONTROLLERS ═══════════════════════ */













/* ═══════════════════════ MODELS ═══════════════════════ */

const HERO_WORDS = ["Parenting.", "to see.", "to help."];
const HERO_WORD_MS = 2800;

const STRUGGLE_LINES = ["Every","parent","wonders","about"];

const SLIDES = [
  { word: "progress", quote: "The report card says fine. I still don't know how to help.", image: problemrevision, alt: "Parent reviewing a child's progress" },
  { word: "homework", quote: "We fight over homework every night. I don't know the right way to explain.", image: problemunderstanding, alt: "Parent helping with homework at night" },
  { word: "understanding", quote: "She says she understood. The test says something else.", image: problempractice, alt: "Parent talking with a child about a test" },
  { word: "confidence", quote: "He used to love learning. Now he hides his books.", image: problemexam, alt: "Parent encouraging a discouraged child" },
  { word: "reports", quote: "I meet the teacher once a year. I want to know every week.", image: parentHeroContent, alt: "Parent at a parent-teacher meeting" },
];

const CYCLE_MS = 4000;
const JOURNEY_WORD_MS = 3000;
const INTELLIGENCE_WORD_MS = 3000;
const KEEPS_WORD_MS = 2500;
const QUESTION_MS = 3200;
const CATEGORY_MS = 4200;

const JOURNEY_WORDS = [
  "moves with them.",
  "meets their questions.",
  "changes with their goals.",
  "grows with their understanding.",
  "opens what comes next.",
];

const INTELLIGENCE_WORDS = ["Every step connected.", "Every week connected.", "Every win connected.", "Every worry connected."];

const INTELLIGENCE_STEPS = [
  { title: "What your child understood this week.", copy: "Not just what was covered. What actually made sense, in minutes.", image: problemunderstanding },
  { title: "Know where your child is stuck.", copy: "See the exact idea that stopped them before it becomes a grade.", image: problemrevision },
  { title: "See which way learning is moving.", copy: "Understand whether confidence is building or slipping, and what changed along the way.", image: parentHeroContent },
  { title: "You see more when everyone shares one view.", copy: "When you, your child, and the teacher share one view, support gets simple.", image: parentFace },
];

const KEEPS_WORDS = ["supporting", "explaining", "celebrating"];

const LANGUAGE_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];

const LANGUAGE_QUESTIONS = [
  { hi: "Priya iss hafte physics mein kaisi rahi?", en: "How did Priya do in physics this week?", bn: "এই সপ্তাহে প্রিয়া পদার্থবিদ্যায় কেমন করল?", ta: "இந்த வாரம் இயற்பியலில் பிரியா எப்படி செய்தார்?", kn: "ಈ ವಾರ ಭೌತಶಾಸ್ತ್ರದಲ್ಲಿ ಪ್ರಿಯಾ ಹೇಗೆ ಮಾಡಿದಳು?", pa: "ਇਸ ਹਫ਼ਤੇ ਭੌਤਿਕ ਵਿਗਿਆਨ ਵਿੱਚ ਪ੍ਰਿਯਾ ਕਿਵੇਂ ਰਹੀ?" },
  { hi: "Homework mein main kaise madad karoon?", en: "How do I help with homework?", bn: "হোমওয়ার্কে আমি কীভাবে সাহায্য করব?", ta: "வீட்டுப் பாடத்தில் எப்படி உதவுவது?", kn: "ಮನೆಪಾಠದಲ್ಲಿ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡುವುದು?", pa: "ਹੋਮਵਰਕ ਵਿੱਚ ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?" },
  { hi: "Parent-teacher meeting se pehle kya jaanna chahiye?", en: "What should I know before the parent-teacher meeting?", bn: "অভিভাবক-শিক্ষক সভার আগে আমার কী জানা উচিত?", ta: "பெற்றோர்-ஆசிரியர் சந்திப்புக்கு முன் நான் என்ன அறிய வேண்டும்?", kn: "ಪೋಷಕ-ಶಿಕ್ಷಕ ಸಭೆಗೆ ಮೊದಲು ನಾನು ಏನು ತಿಳಿಯಬೇಕು?", pa: "ਮਾਪੇ-ਅਧਿਆਪਕ ਮੀਟਿੰਗ ਤੋਂ ਪਹਿਲਾਂ ਮੈਂ ਕੀ ਜਾਣਨਾ ਚਾਹੀਦਾ ਹੈ?" },
];

const CONTINUITY_STAGES = [
  { name: "Primary", previous: "Factors", now: "Decimals", next: "Percentages" },
  { name: "Secondary", previous: "Linear equations", now: "Graphs", next: "Equations" },
  { name: "Competitive exams", previous: "Concept", now: "Difficult problem", next: "New problem" },
  { name: "Vocational and skills", previous: "Basic skill", now: "Practice", next: "Real project" },
  { name: "Higher education", previous: "Foundation", now: "Specialization", next: "Career" },
  { name: "Independent learning", previous: "Curiosity", now: "Habit", next: "Confidence" },
];

const ACHIEVEMENT_TABS = [
  { black: "Understand", blue: "what your child is learning.", copy: "A clear picture of what shaped your child's week, no report card needed." },
  { black: "Support", blue: "where they need it most.", copy: "Know when to help, how to explain, and when to step back." },
  { black: "Celebrate", blue: "every step forward.", copy: "See the wins, and turn them into lasting confidence." },
];

const JOURNEY_CATEGORIES = ["Primary", "Secondary", "Higher secondary", "Competitive exams", "Vocational and skills", "Higher education", "Independent learning"];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and build with confidence.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Plan lessons and see who needs support.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "professional", chip: "Professional", copy: "Turn what you learn into work you can use.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Help teams share context across projects.", alt: "Leader talking at an organization table" },
];

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */







/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const ParentHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Parenting, to see, to help."
    sub="Know what your child is learning before the report card."
    img={parentHero}
    alt="A parent helping a child with homework"
    ctaLabel="Start free"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */










function ParentStruggleSection() {
  /* The problem chapter is static — no auto-advance; one challenge at a
     time while the visitor reads (Apple never auto-steps a problem section).
     Dots still allow manual selection. */
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i) => setIndex(Math.min(SLIDES.length - 1, Math.max(0, i))), []);
  const { ref } = UseRevealContinuous();

  return (
    <section ref={ref} data-section="02-struggle" className="relative overflow-x-clip bg-white">
      <ScrollReveal>
        {/* the bridge's compact band (02-struggle) carries the chapter breath */
        }
        <StruggleChapter
          slides={SLIDES}
          index={index}
          goTo={goTo}
          lines={STRUGGLE_LINES}
          label="Parent concerns"
          kicker="What report cards miss"
          copy="Caring isn't the difficulty. Seeing it is."
        />
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */
/* The turn from the problem chapter lands directly here: the struggle ends
   in a first-person quote, and this chapter answers it with the product.
   No promise/question beat between them: the card section's own heading
   already carries the promise, and Apple never repeats a statement it is
   about to show. (03 retired — the promise/question beat; keys keep their
   historical numbers so bridge CSS and probes stay stable.) */

/* Icons per journey stage — reuses icons already imported in this file */
const JOURNEY_STAGE_ICONS = {
  "Early years": Sparkles,
  "Primary": BookOpen,
  "Secondary": MessageCircle,
  "Secondary and higher secondary": BookOpen,
  "Higher secondary": Layers3,
  "Competitive exams": Target,
  "Vocational and skills": RefreshCw,
  "Higher education": Brain,
  "Beyond school": GraduationCap,
  "Independent learning": Clock,
};

const JOURNEY_STAGES = [
  { title: "Early years", statement: "Be part of the first wins.", copy: "First questions, first wins, and you see them all.", image: primaryStudent, alt: "Parent with a young child learning" },
  { title: "Primary", statement: "Follow the homework. Without the fight.", copy: "Follow what they're learning, and help without taking over.", image: primaryStudent, alt: "Parent following primary school learning" },
  { title: "Secondary", statement: "Stay close as it gets harder.", copy: "Subjects get harder. You stay part of the journey.", image: secondaryStudent, alt: "Parent supporting a secondary student" },
  { title: "Higher secondary", statement: "Big decisions. Clearer choices.", copy: "Streams, boards, big decisions, and how to support them.", image: higherStudent, alt: "Parent discussing higher secondary choices" },
  { title: "Competitive exams", statement: "See the preparation. Not just the score.", copy: "See how preparation is moving, not just the score.", image: competitiveStudent, alt: "Parent supporting exam preparation" },
  { title: "Beyond school", statement: "Their next step. Your continued support.", copy: "Whatever they choose next, their understanding travels with them.", image: vocationStudent, alt: "Parent celebrating a child's next step" },
];

const STAGE_META = {
  "Early years": { Icon: Sparkles },
  "Primary": { Icon: GraduationCap },
  "Secondary": { Icon: BookOpen },
  "Higher secondary": { Icon: Layers3 },
  "Competitive exams": { Icon: Target },
  "Beyond school": { Icon: Brain },
};

const JOURNEY_MODALS = {
  "Early years": {
    top: "Be part of", accent: "the first wins.",
    intro: "The earliest years set the tone for a lifetime of learning. Visionary makes first understanding visual, gentle, and joyful, and keeps you close to every step.",
    primary: { label: "See a learning example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See how they learn.", c: "First concepts become pictures, stories, and voice you can follow along with.", l: "How it works", to: "/how-it-works" },
      { Icon: Sparkles, t: "Celebrate early wins.", c: "Small victories become visible, so encouragement arrives at the right moment.", l: "Start as a parent", to: "/register" },
      { Icon: Globe2, t: "In your language.", c: "Early learning happens best in the language your child thinks in, and yours.", l: "Language support", to: "/how-it-works" },
      { Icon: UsersRound, t: "Learn together.", c: "Simple ways to join in, without taking over the learning.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Primary": {
    top: "Follow the homework.", accent: "Without the fight.",
    intro: "When homework begins, so do the questions. Visionary shows what your child is learning this week and how to help without taking over.",
    primary: { label: "See a learning example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Know what they're learning.", c: "A clear picture of the week's lessons, in minutes, not report-card surprises.", l: "See how it works", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Help the right way.", c: "Suggestions for explaining an idea the way your child will understand it.", l: "Get support", to: "/help" },
      { Icon: RefreshCw, t: "See practice happen.", c: "Follow gentle, encouraging practice that rewards effort, not speed.", l: "Start as a parent", to: "/register" },
      { Icon: Globe2, t: "In your language.", c: "Understand their journey in the language you think in.", l: "Language support", to: "/how-it-works" },
    ],
  },
  "Secondary": {
    top: "Stay close", accent: "as it gets harder.",
    intro: "Subjects deepen and conversations get shorter. Visionary keeps you part of the journey, with the context to support without hovering.",
    primary: { label: "See a learning example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Know where they are stuck.", c: "See the exact idea that stopped them, before it becomes a gap.", l: "See how it works", to: "/how-it-works" },
      { Icon: BookOpen, t: "Follow every subject.", c: "One connected picture across chapters, subjects, and exams.", l: "Keep the picture", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Explain it their way.", c: "The right words for the way your child learns best.", l: "Get support", to: "/help" },
      { Icon: UsersRound, t: "Teachers and parents together.", c: "When everyone sees the same picture, support becomes simple.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Higher secondary": {
    top: "Big decisions.", accent: "Clearer choices.",
    intro: "Streams, boards, and the years that shape what comes next. Visionary helps you understand what your child is working toward and how to support it.",
    primary: { label: "See a learning example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Understand the path.", c: "See how subjects, streams, and goals connect into one journey.", l: "See how it works", to: "/how-it-works" },
      { Icon: Target, t: "Support the goal.", c: "Know what their choices require and how they're progressing toward them.", l: "Start as a parent", to: "/register" },
      { Icon: BookOpen, t: "Boards and beyond.", c: "The same understanding carries into exams and what comes after.", l: "Keep the picture", to: "/how-it-works" },
      { Icon: Clock, t: "Be there at the right moments.", c: "Know when to step in, and when to let them lead.", l: "Get support", to: "/help" },
    ],
  },
  "Competitive exams": {
    top: "See the preparation.", accent: "Not just the score.",
    intro: "Competitive years are a marathon. Visionary shows you how preparation is actually moving, and when to push and when to pause.",
    primary: { label: "See a learning example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Beyond the mock score.", c: "See reasoning, accuracy, and confidence building over time.", l: "See how it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Learn from every attempt.", c: "Each mock becomes context: what to revise, skip, strengthen.", l: "Keep the picture", to: "/how-it-works" },
      { Icon: Clock, t: "Steady support under pressure.", c: "Know the moments your encouragement matters most.", l: "Get support", to: "/help" },
      { Icon: UsersRound, t: "Everyone on the same page.", c: "You, your child, and their teachers sharing one picture.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Beyond school": {
    top: "Their next step.", accent: "Your continued support.",
    intro: "Whatever they choose next, the understanding they've built travels with them, and so does your support.",
    primary: { label: "See a learning example", to: "/how-it-works" },
    blocks: [
      { Icon: Brain, t: "Learning that carries forward.", c: "The understanding they've built connects to whatever comes next.", l: "See how it works", to: "/how-it-works" },
      { Icon: Layers3, t: "Skills and projects.", c: "See what they're building turn into real work and real direction.", l: "Start as a parent", to: "/register" },
      { Icon: GraduationCap, t: "Higher education and beyond.", c: "Follow the journey as it deepens through college and career.", l: "Keep the picture", to: "/how-it-works" },
      { Icon: UsersRound, t: "A partner for the family.", c: "Visionary supports learners and the people behind them.", l: "Talk to us", to: "/contact" },
    ],
  },
};





function ParentJourneySection() {
  const { ref } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_WORDS.length, JOURNEY_WORD_MS);
  const [openStage, setOpenStage] = useState(null);

  return (
    <section ref={ref} data-section="04-journey" className="relative isolate overflow-hidden py-24 lg:py-32 bg-white">
      <ScrollReveal>
        {/* header — Apple's card-chapter treatment (education: "From grade
            school to grad school."): statement LEFT-aligned at the measured
            gutter, and the gallery's track carries the same gutter so the
            first card starts exactly at the heading's left edge — one spine. */}
        <div className="mx-auto w-full max-w-[980px] px-6 lg:px-0">
          <h2 className="font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(34px,4.45vw,64px)]" style={{ color: COLORS.ink }}>
            <span className="block">Learning that</span>
            <span key={index} className="hero-fade-up block min-h-[1.06em] [animation-duration:1s]" style={{ color: COLORS.blue }}>{JOURNEY_WORDS[index]}</span>
          </h2>
          <p className="mt-4 max-w-[640px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
            Wherever your child begins, Visionary helps their learning move forward from there.
          </p>
        </div>
      </ScrollReveal>

      <JourneyGallery stages={JOURNEY_STAGES} onOpen={setOpenStage} label="Learning stages" iconMap={STAGE_META} />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Primary" secondaryLabel="Start as a parent" />}
    </section>
  );
}

/* ═══════════════════════ 05 · INTELLIGENCE ═══════════════════════ */





function ParentIntelligenceSection() {
  const { ref: headRef } = UseRevealOnce();
  const { index: wordIndex } = UseCycleIndex(INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);
  const { active, setStepRef } = UseActiveStep(INTELLIGENCE_STEPS.length);
  const current = INTELLIGENCE_STEPS[active];

  return (
    <section ref={headRef} data-section="05-intelligence" className="relative isolate [overflow-x:clip] bg-white rounded-t-[32px]" style={{ fontFamily: FONT_FAMILY }}>
      <ScrollReveal className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          The intelligence behind your child's learning
        </p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
            {INTELLIGENCE_WORDS[wordIndex]}
          </span>
        </h2>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          From the first question to the moment they can use what they've learned.
        </p>
      </ScrollReveal>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-20 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-14 flex h-[calc(100vh-2rem)] items-center">
            <IntelligenceCopy step={current} />
          </div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {INTELLIGENCE_STEPS.map((s, i) => (
            <div key={s.title}>
              <IntelligenceVisual step={s} index={i} setStepRef={setStepRef} image={s.image} />
              <div className="mt-10 lg:hidden">
                <IntelligenceCopy step={s} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════ 06 · CLOSING ═══════════════════════ */

const ParentClosingSection = React.memo(function ParentClosingSection() {
  const { ref } = UseRevealOnce();
  const { index } = UseCycleIndex(KEEPS_WORDS.length, KEEPS_WORD_MS);
  return (
    <section ref={ref} data-section="06-closing" className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <ScrollReveal>
        <p className="mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
          Visionary keeps{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
            {KEEPS_WORDS[index]}
          </span>{" "}
          with you until understanding becomes confidence.
        </p>
      </ScrollReveal>
    </section>
  );
});

/* ═══════════════════════ 07 · LANGUAGE ═══════════════════════ */



function ParentLanguageSection() {
  const { ref } = UseRevealOnce();
  const [lang, setLang] = useState("hi");
  const { index } = UseCycleIndex(LANGUAGE_QUESTIONS.length, QUESTION_MS);
  const question = LANGUAGE_QUESTIONS[index][lang];
  const activeLabel = LANGUAGE_CHIPS.find((c) => c.code === lang)?.label || lang;

  return (
    <section ref={ref} data-section="07-language" className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <ScrollReveal>
        {/* header unit — tight */}
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Every language</p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your child's progress.<br />In your language.
        </h2>
        <p className="mx-auto max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          Follow your child's journey in the language you think in.
        </p>

        {/* Breath 1 — control first */}
        <div className="mt-14 lg:mt-20">
          <LanguageChips active={lang} onSelect={setLang} chips={LANGUAGE_CHIPS} />
        </div>

        {/* Breath 2 — FLAT Google voice surface: no card, no border, type on the page */}
        <div className="mx-auto mt-16 w-full max-w-[860px] lg:mt-24">
          {/* Assistant-signature four-color voice indicator */}
          <div className="flex items-end justify-center gap-2" aria-hidden="true">
            {["#4285F4", "#EA4335", "#FBBC05", "#34A853"].map((c, i) => (
              <span
                key={c}
                className="h-8 w-1.5 rounded-full"
                style={{
                  backgroundColor: c,
                  transformOrigin: "center",
                  animation: `voiceDot 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>

          {/* the utterance — plain ink type, keyed fade on change */}
          <p
            aria-live="polite"
            className="mx-auto mt-8 max-w-[760px] text-center font-normal tracking-[0] leading-[1.6] text-[clamp(26px,3.4vw,48px)]"
            style={{ color: COLORS.blue }}
          >
            <span key={`${lang}-${index}`} className="hero-fade-up inline">{question}</span>
          </p>

          {/* state line — the only chrome */}
          <p className="mt-6 text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
            Listening in {activeLabel} · understood in every language
          </p>
        </div>

        {/* Breath 3 — helper chip, Google-style surface pill */}
        <div className="mt-14 flex justify-center lg:mt-20">
          <div className="flex items-center gap-4 rounded-full px-8 py-4" style={{ backgroundColor: COLORS.surface }}>
            <VoiceIcon className="h-6 w-6 shrink-0" style={{ color: COLORS.blue }} />
            <p className="font-normal tracking-[0] leading-[20px] text-[14px]" style={{ color: COLORS.grey }}>
              Ask your way: use voice or text in the way you're comfortable.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 08 · CONTINUITY ═══════════════════════ */



const CATEGORY_SECTION_IMG = [primaryStudent, secondaryStudent, competitiveStudent, vocationStudent, higherStudent];



function ParentContinuitySection() {
  const { ref } = UseRevealOnce();
  const { index, goTo, step } = UseStageIndex(CONTINUITY_STAGES.length);
  const stage = CONTINUITY_STAGES[index];

  return (
    <section ref={ref} data-section="08-continuity" className="relative isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]">
      <ScrollReveal>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          Keep the picture
        </p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          What your child learns stays with them.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[700px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          What they understand becomes part of what comes next. Nobody starts over.
        </p>
        <div className="mt-14 flex justify-center lg:mt-20">
          <StageDropdown stages={CONTINUITY_STAGES} active={index} onSelect={goTo} />
        </div>
        <div className="mt-14 grid grid-cols-1 gap-16 px-6 lg:mt-20 lg:grid-cols-3 lg:gap-12 lg:px-0">
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Previous" caption="What they learned" text={stage.previous} imgClass="lg:h-[400px]" className="lg:-ml-[6vw]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Now" caption="What they're working on" text={stage.now} imgClass="lg:h-[600px]" className="lg:mt-[100px]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Next" caption="Where they can go" text={stage.next} imgClass="lg:h-[370px]" className="lg:-mr-[6vw] lg:mt-[20px]" />
        </div>
        <div className="mt-14 flex justify-center gap-4 lg:mt-20">
          <button
            type="button"
            aria-label="Previous stage"
            onClick={() => step(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5"
            style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label="Next stage"
            onClick={() => step(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5"
            style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
        <p className="mt-14 px-6 text-center font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.9vw,42px)] lg:mt-20" style={{ color: COLORS.ink }}>
          They keep their place.
        </p>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 09 · ACHIEVEMENT ═══════════════════════ */
const ACHIEVEMENT_IMAGE = [parentHeroContent, parentachivenment, parentbuild];

/* icon per achievement tab — reuses icons already imported in this file */
const ACHIEVEMENT_META = [
  { Icon: Eye },      /* Understand */
  { Icon: Target },   /* Support */
  { Icon: Award },    /* Celebrate */
];




function ParentAchievementSection() {
  const { ref } = UseRevealOnce();
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState(0);

  const toggle = useCallback((i) => {
    const next = open === i ? (i === 0 ? 1 : i - 1) : i;
    setOpen(next);
    setActive(next);
  }, [open]);

  return (
    <section ref={ref} data-section="09-achievement" className="relative isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]">
      <ScrollReveal>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Your achievement</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>See what your child can achieve.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Turn understanding into results, skills, and confidence you can see.
        </p>

        {/* Breath 2 — accordion + image, balanced columns */}
        <div className="mx-auto mt-14 grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 lg:mt-28 lg:grid-cols-2 lg:items-center lg:gap-24 lg:px-[var(--frame-x)]">
          <AchievementAccordion meta={ACHIEVEMENT_META} tabs={ACHIEVEMENT_TABS} open={open} onToggle={toggle} />
          <div key={active} className="hero-fade-up overflow-hidden rounded-[48px]">
            <img
              src={ACHIEVEMENT_IMAGE[active]}
              alt={`${ACHIEVEMENT_TABS[active].black} ${ACHIEVEMENT_TABS[active].blue}`}
              loading="lazy"
              decoding="async"
              className="h-[320px] w-full rounded-[14px] object-contain sm:h-[440px] lg:h-[620px]"
              style={{ objectPosition: "center center" }}
            />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 10 · JOURNEY FLOW ═══════════════════════ */




function ParentJourneyFlowSection() {
  const { ref } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];

  return (
    <section ref={ref} data-section="10-journey-flow" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your child's journey changes.<br />Their learning stays with them.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          As their subjects, skills, and goals change, Visionary keeps giving you a place to continue supporting, understanding, and moving forward together.
        </p>

        {/* Breath 2 — cascade + closing column */}
        <div className="mx-auto mt-14 grid w-full max-w-[1900px] grid-cols-1 items-center gap-16 px-6 lg:mt-28 lg:grid-cols-[7fr_5fr] lg:gap-24 lg:pl-[10%] lg:pr-12">
          {/* cascade: card → connector → card (in-flow, never overlapping) */}
          <div className="relative">
            <JourneyCategoryCard iconMap={JOURNEY_STAGE_ICONS} images={CATEGORY_SECTION_IMG} index={index} text={first} className="mx-auto max-w-[430px] lg:mx-0" />
            <div className="flex justify-start py-2 pl-[16%] lg:py-3 lg:pl-[20%]">
              <svg
                viewBox="0 0 220 260"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-[64px] w-[110px] lg:h-[88px] lg:w-[150px]"
                style={{ color: COLORS.ink }}
              >
                <path d="M12 4 C 4 120, 44 196, 188 232" />
                <path d="M188 232 l-19 6 M188 232 l-14 -14" />
              </svg>
            </div>
            <JourneyCategoryCard iconMap={JOURNEY_STAGE_ICONS} images={CATEGORY_SECTION_IMG} index={index + 1} text={second} className="ml-[10%] max-w-[430px] lg:ml-[28%]" />
          </div>

          {/* closing column — statement + action, balanced against the cascade */}
          <div className="max-w-[500px]">
            <p className="font-normal tracking-[0] leading-[1.2] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
              Wherever their journey goes, your support can continue with them.
            </p>
            <Link
              to="/how-it-works"
              className="mt-8 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              style={{ color: COLORS.blue }}
            >
              See how Visionary keeps it connected
              <ChevronIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 11 · TRUST ═══════════════════════ */
/* words now map 1:1 to cards — heading narrates the visible card */
const TRUST_WORDS = ["child's", "progress.", "trust."];
const TRUST_WORD_MS = 6000;

const TRUST_CARD_IMG = [parentFace, parentHeroContent, parentbuild];

const TRUST_CARDS = [
  { title: "Private by design.", copy: "Your child's information. Treated with care.", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Safe to grow with.", copy: "Built from the first question to what's next.", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Built responsibly.", copy: "Intelligence should help people, never work against them.", Icon: Scale, to: "/terms", link: "Read our commitments" },
];



function ParentTrustSection() {
  const { ref } = UseRevealOnce();
  const { index, goTo } = UseCycleIndex(TRUST_CARDS.length, TRUST_WORD_MS);
  const active = TRUST_CARDS[index];
  const next = TRUST_CARDS[(index + 1) % TRUST_CARDS.length];
  const stepCards = useCallback((d) => goTo(index + d), [goTo, index]);

  return (
    <section ref={ref} data-section="11-trust" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Trust and safety</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{TRUST_WORDS[index]}</span>
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Your child's questions, conversations, and progress are personal. Visionary keeps it that way.
        </p>

        {/* Breath 2 — narrative column + preview cards */}
        <div className="mx-auto mt-14 grid w-full max-w-[1600px] grid-cols-1 items-start gap-16 px-6 lg:mt-20 lg:grid-cols-[4fr_8fr] lg:gap-24 lg:px-0">
          <div className="lg:pl-[var(--frame-x)]">
            <h3 key={active.title} className="hero-fade-up max-w-[460px] font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
              {active.title}
            </h3>
            <div className="mt-10 flex items-center gap-4 lg:ml-24">
              <button type="button" aria-label="Previous trust card" onClick={() => stepCards(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
                <ChevronIcon direction="left" />
              </button>
              <button type="button" aria-label="Next trust card" onClick={() => stepCards(1)} className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
                <ChevronIcon direction="right" />
              </button>
              <span className="ml-2 font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
                0{index + 1} / 0{TRUST_CARDS.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-8 2xl:grid 2xl:grid-cols-2 2xl:gap-10">
            <div key={`a-${index}`} className="hero-fade-up w-full max-w-[780px]"><TrustCard card={active} image={TRUST_CARD_IMG[index % TRUST_CARD_IMG.length]} /></div>
            <div key={`b-${index}`} className="hero-fade-up hidden w-full max-w-[780px] 2xl:block [animation-delay:80ms] [animation-fill-mode:both]"><TrustCard card={next} image={TRUST_CARD_IMG[(index + 1) % TRUST_CARD_IMG.length]} /></div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 12 · CTA ═══════════════════════ */

const ParentCTASection = React.memo(function ParentCTASection() {
  const { ref } = UseRevealOnce();
  return (
    <section ref={ref} data-section="12-cta" className="relative isolate px-6 py-24 lg:py-32 rounded-t-[32px]" style={{ backgroundImage: "linear-gradient(180deg, #d9e6fd 0%, #e8f0fe 48%, #f5f9ff 100%)" }}>
      <ScrollReveal>
        <div className="mx-auto max-w-[1500px] text-center">
          <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
            Begin today
          </p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your child's journey is already happening.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          See what they understand. Know where to help.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            style={{ backgroundColor: COLORS.blue }}
          >
            Get started
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-14 items-center justify-center rounded-full border border-[#121317]/20 bg-white/60 px-10 font-normal tracking-[0.24px] text-[16px] text-[#121317] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
          >
            Talk to our team
          </Link>
        </div>
          <p className="mt-6 text-center font-normal tracking-[0.24px] text-[13px]" style={{ color: COLORS.grey }}>
            Free to start. Private by design.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
});

/* ═══════════════════════ 13 · EXPLORE ═══════════════════════ */



function ParentExploreSection() {
  const { ref } = UseRevealOnce();
  const { trackRef, canNext, scrollByCard, update } = UseScrollTrack();

  return (
    <section ref={ref} data-section="13-explore" className="relative isolate py-16 lg:py-24 [overflow-x:clip] bg-white rounded-t-[32px]">
      <ScrollReveal>
        <h2 className="px-6 font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)] lg:pl-[6.5%] lg:pr-6" style={{ color: COLORS.ink }}>
          Explore Visionary
        </h2>
        <div className="relative mt-16 lg:mt-20">
          <div
            ref={trackRef}
            onScroll={update}
            className="flex snap-x snap-mandatory gap-8 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-12 lg:pl-[calc(6.5%_+_480px)] lg:pr-6"
          >
            {EXPLORE_CATEGORIES.map((c, index) => (
              <ExploreCard index={index} key={c.slug} category={c} images={EXPLORE_CAT_IMG} />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next categories"
            onClick={() => scrollByCard(1)}
            className={`absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border bg-white elevation-2 transition-opacity hover:bg-[#121317]/5 lg:right-6 ${canNext ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{ borderColor: `${COLORS.ink}1A`, color: COLORS.ink }}
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ParentPage() {
  useSheetStack();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <ParentHeroSection />
        <ParentStruggleSection />
        <ParentJourneySection />
        <ParentIntelligenceSection />
        <ParentClosingSection />
        <ParentLanguageSection />
        <ParentContinuitySection />
        <ParentAchievementSection />
        <ParentJourneyFlowSection />
        <ParentTrustSection />
        <ParentCTASection />
        <ParentExploreSection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
