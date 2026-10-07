import React, { useCallback, useState } from "react";
import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import teacherHero from "@/assets/teacher-hero-main-2400w.webp";
import teacherHeroContent from "@/assets/teacher-hero-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import teacherProblem1 from "@/assets/teacher-problem-1.webp";
import teacherProblem2 from "@/assets/teacher-problem-2.webp";
import teacherProblem3 from "@/assets/teacher-problem-3.webp";
import teacherProblem4 from "@/assets/teacher-problem-4.webp";
import PersonaHero from "@/components/landing/NewPersona";
import useSheetStack from "@/components/landing/system/useSheetStack";
import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";

/**
 * Problem Section
 */

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
import teacherachivenment from "@/assets/achievenment-achieve.webp";
import teacherbuild from "@/assets/achivenment-build.webp";

/**
 * Explore Category
 */
import studentmeet from "@/assets/student-face-main.webp";
import parentmeet from "@/assets/parent-face-main.webp";
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
  FadeReveal,
} from "@/components/landing/persona/PersonaSections";

const EXPLORE_CAT_IMG = [studentmeet, parentmeet, promeet, orgmeet];

/* ═══════════════════════════════════════════════════════════════════
 * SECTION MAP (render order) — each <section> has data-section for DevTools
 * 01 hero · 02 struggle · 03 promise · 04 journey · 05 intelligence ·
 * 06 closing · 07 language · 08 continuity · 09 achievement ·
 * 10 journey-flow · 11 trust · 12 cta · 13 explore
 * ═══════════════════════════════════════════════════════════════════ */

/* ── DESIGN TOKENS ── */
const COLORS = {
  ink: "#121317",
  surface: "#F5F6F8",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  chipBg: "#D2E3FC",
  white: "#ffffff",
  cardSurface: "#EEF1F6",
  cardSurfaceAlt: "#E9EFFA",
  mist: "#E5E7EB", /* border.subtle (MASTER_SPEC §3.1) */
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";

/* ═══════════════════════ CONTROLLERS ═══════════════════════ */













/* ═══════════════════════ MODELS ═══════════════════════ */

const TEACHER_HERO_WORDS = ["Teaching.", "to grow.", "to reach."];
const HERO_WORD_MS = 2800;

const STRUGGLE_LINES = ["Every","teacher","wonders","about"];

const SLIDES = [
  { word: "understanding", quote: "I taught the whole class. Half of them still left lost.", image: teacherProblem1, alt: "Teacher looking overwhelmed after class" },
  { word: "engagement", quote: "I can see the eyes glaze over. I just don't know whose.", image: teacherProblem2, alt: "Teacher puzzled by disengaged students" },
  { word: "pace", quote: "I finish the syllabus. I never finish the learning.", image: teacherProblem3, alt: "Teacher stressed about lesson pacing" },
  { word: "practice", quote: "They copy the steps. They can't start the problem alone.", image: teacherProblem4, alt: "Teacher reviewing student practice work" },
  { word: "results", quote: "The exam shows the gap I never saw coming.", image: teacherProblem2, alt: "Teacher searching for the gap in exam results" },
];

const CYCLE_MS = 4000;
const JOURNEY_WORD_MS = 3000;
const INTELLIGENCE_WORD_MS = 3000;
const KEEPS_WORD_MS = 2500;
const QUESTION_MS = 3200;
const CATEGORY_MS = 4200;

const JOURNEY_WORDS = [
  "moves with your class.",
  "meets your questions.",
  "changes with your goals.",
  "grows with your learners.",
  "opens what comes next.",
];

const TEACHER_INTELLIGENCE_WORDS = ["Every lesson connected.", "Every learner connected.", "Every question connected.", "Every class connected.", "Every insight connected."];

const TEACHER_ROLE_STEPS = [
  { title: "Understand what your class is learning.", copy: "Visionary continues from where your class is, so every lesson builds on the last." },
  { title: "Show it, hear it, teach it another way.", copy: "When a concept doesn't land, you get the visual, the explanation, the example." },
  { title: "Know who's with you before the exam.", copy: "See who got it, who didn't, and what to change next period." },
];

const TEACHER_LEARNER_STEPS = [
  { title: "Learn what your teaching demands next.", copy: "New syllabus, new subject: your preparation keeps pace with your classroom." },
  { title: "Build what your classroom actually needs.", copy: "Every plan, project, and question you craft becomes part of your growing craft." },
  { title: "Grow your craft, not just your syllabus.", copy: "See what works, and carry it into the next class, year, and decade." },
];

/* Photography per step — the framed-photo anatomy shared with the landing
   and the Organization page, using the same positive classroom scenes the
   journey and category sections carry (never the struggle shots, whose
   expressions belong to the problem chapter, and never the window/art
   fallback). */
const TEACHER_INTEL_IMG = [secondaryStudent, primaryStudent, competitiveStudent];

const TEACHER_KEEPS_WORDS = ["teaching", "adapting", "supporting"];

const LANGUAGE_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];

const TEACHER_LANGUAGE_QUESTIONS = [
  { hi: "Is concept ko simple tarike se kaise samjhaun?", en: "How do I explain this concept simply?", bn: "এই ধারণাটি সহজে কীভাবে বোঝাব?", ta: "இந்தக் கருத்தை எப்படி எளிதாக விளக்குவது?", kn: "ಈ ಪರಿಕಲ್ಪನೆಯನ್ನು ಸುಲಭವಾಗಿ ಹೇಗೆ ವಿವರಿಸುವುದು?", pa: "ਇਸ ਧਾਰਨਾ ਨੂੰ ਸੌਖੇ ਢੰਗ ਨਾਲ ਕਿਵੇਂ ਸਮਝਾਵਾਂ?" },
  { hi: "Kis bachche ko aur madad chahiye?", en: "Which child needs more help?", bn: "কোন শিশুর আরও সাহায্য দরকার?", ta: "எந்த குழந்தைக்கு மேலும் உதவி தேவை?", kn: "ಯಾವ ಮಗುವಿಗೆ ಇನ್ನಷ್ಟು ಸಹಾಯ ಬೇಕು?", pa: "ਕਿਹੜੇ ਬੱਚੇ ਨੂੰ ਹੋਰ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?" },
  { hi: "Agla lesson kaise behtar banaun?", en: "How do I make the next lesson better?", bn: "পরবর্তী পাঠ আরও ভালো কীভাবে করব?", ta: "அடுத்த பாடத்தை எப்படி மேம்படுத்துவது?", kn: "ಮುಂದಿನ ಪಾಠವನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸುವುದು ಹೇಗೆ?", pa: "ਅਗਲਾ ਪਾਠ ਹੋਰ ਵਧੀਆ ਕਿਵੇਂ ਬਣਾਵਾਂ?" },
];

const CONTINUITY_STAGES = [
  { name: "Primary", previous: "Their foundations", now: "Your classroom", next: "Their next class" },
  { name: "Secondary", previous: "Last unit", now: "This unit", next: "The exam" },
  { name: "Competitive exams", previous: "Concepts", now: "Your coaching", next: "The test" },
  { name: "Vocational and skills", previous: "Their basics", now: "Your training", next: "The job" },
  { name: "Higher education", previous: "Their degree", now: "Your course", next: "Their research" },
  { name: "Independent learning", previous: "Their goals", now: "Your mentoring", next: "Their path" },
];

const TEACHER_ACHIEVEMENT_TABS = [
  { black: "Understand", blue: "your classroom.", copy: "A clear picture of the learners and gaps that shape your classroom." },
  { black: "Achieve what", blue: "you're teaching toward.", copy: "Set your goal and keep every learner moving." },
  { black: "Build something from", blue: "what you teach.", copy: "Turn what you teach into projects and skills that grow with your students." },
];

const JOURNEY_CATEGORIES = ["Primary", "Secondary", "Higher secondary", "Competitive exams", "Vocational and skills", "Higher education", "Independent learning"];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and keep your place.", alt: "Student learning with a laptop" },
  { slug: "parent", chip: "Parent", copy: "See progress clearly and know when to help.", alt: "Parents helping students at a classroom desk" },
  { slug: "professional", chip: "Professional", copy: "Turn what you learn into work you can use.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Help teams share context across projects.", alt: "Leader talking at an organization table" },
];

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */







/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const TeacherHeroSection = React.memo(() => (
  <PersonaHero
    words={TEACHER_HERO_WORDS}
    srSentence="Teaching, to grow, to reach."
    sub="One class, many minds. See who is with you before the next bell."
    img={teacherHero}
    alt="A teacher presenting at a whiteboard"
    ctaLabel="Start teaching free"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */










function TeacherStruggleSection() {
  const { index, goTo } = UseCycleIndex(SLIDES.length, CYCLE_MS);
  const { ref, visible } = UseRevealContinuous();

  return (
    <section ref={ref} data-section="02-struggle" className="relative overflow-x-clip bg-white">
      <FadeReveal visible={visible}>
        {/* the bridge's compact band (02-struggle) carries the chapter breath */
        }
        <StruggleChapter
          slides={SLIDES}
          index={index}
          goTo={goTo}
          lines={STRUGGLE_LINES}
          label="Teacher challenges"
        />
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 03 · PROMISE ═══════════════════════ */

const TeacherPromiseSection = React.memo(function TeacherPromiseSection() {
  const { ref, visible } = UseRevealOnce();
  return (
    <section ref={ref} data-section="03-promise" className="relative isolate overflow-hidden px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <h2
        className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        style={{ color: COLORS.ink }}
      >
        What if you could see who understood —{" "}
        <span className="accent-gradient">and who didn't?</span>
      </h2>
    </section>
  );
});

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

/* Icons per journey stage — reuses icons already imported in this file */
const JOURNEY_STAGE_ICONS = {
  "Lesson planning": BookOpen,
  "In class": Sparkles,
  "Checking understanding": Eye,
  "Adapting": RefreshCw,
  "Supporting individuals": UsersRound,
  "Growing": TrendingUp,
  /* journey-flow categories */
  "Primary": GraduationCap,
  "Secondary": BookOpen,
  "Higher secondary": Layers3,
  "Competitive exams": Target,
  "Vocational and skills": Layers3,
  "Higher education": Brain,
  "Independent learning": Clock,
};

const JOURNEY_STAGES = [
  { title: "Lesson planning", statement: "Plan the lesson. From where they are.", copy: "Start from what your class already knows, and build the lesson on top of it.", image: teacherHeroContent, alt: "Teacher planning a lesson at a desk" },
  { title: "In class", statement: "Teach it. Another way, any time.", copy: "Explain it visually, hear the questions, and teach it another way when you need to.", image: secondaryStudent, alt: "Teacher presenting at a whiteboard" },
  { title: "Checking understanding", statement: "Know who's with you. Before the exam does.", copy: "See who got it and who needs another explanation, before the exam tells you.", image: primaryStudent, alt: "Teacher checking student work" },
  { title: "Adapting", statement: "Change the pace. Not the standard.", copy: "Change the pace, the example, or the grouping the moment your class needs it.", image: higherStudent, alt: "Teacher adapting a lesson in real time" },
  { title: "Supporting individuals", statement: "Reach every learner. Even the quiet ones.", copy: "Reach the quiet ones, the fast ones, and the ones who never raise their hand.", image: vocationStudent, alt: "Teacher supporting an individual student" },
  { title: "Growing", statement: "This year's teaching, next year's craft.", copy: "Turn this year's teaching into next year's craft. Every lesson builds on the last.", image: competitiveStudent, alt: "Teacher reflecting and growing" },
];

const STAGE_META = {
  "Lesson planning": { Icon: BookOpen },
  "In class": { Icon: Sparkles },
  "Checking understanding": { Icon: Eye },
  "Adapting": { Icon: RefreshCw },
  "Supporting individuals": { Icon: UsersRound },
  "Growing": { Icon: TrendingUp },
};

const JOURNEY_MODALS = {
  "Lesson planning": {
    top: "Plan the lesson.", accent: "From where they are.",
    intro: "The best lesson starts from what the class already knows. Visionary shows you where your learners are, so every plan builds on real understanding.",
    primary: { label: "See how Visionary plans", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Start from the class.", c: "See what your learners understood last time before you plan what comes next.", l: "See how it works", to: "/how-it-works" },
      { Icon: Layers3, t: "Build on it.", c: "Structure the lesson so each idea connects to the one before it.", l: "Start planning free", to: "/register" },
      { Icon: Globe2, t: "In their language.", c: "Prepare explanations in the language your class actually thinks in.", l: "Language support", to: "/how-it-works" },
      { Icon: UsersRound, t: "Share the plan.", c: "Keep colleagues, parents, and learners aligned on where the class is going.", l: "Get support", to: "/help" },
    ],
  },
  "In class": {
    top: "Teach it.", accent: "Another way, any time.",
    intro: "When a concept doesn't land the first time, you need another way, not another period. Visionary gives you the visual, the explanation, and the example on demand.",
    primary: { label: "See a teaching example", to: "/how-it-works" },
    blocks: [
      { Icon: Sparkles, t: "Show it visually.", c: "Turn the hardest idea into something the whole class can see.", l: "See how it works", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Hear the questions.", c: "Learners ask naturally, in their own words and language.", l: "Talk to us", to: "/contact" },
      { Icon: RefreshCw, t: "Teach it another way.", c: "A second explanation, a new example, a simpler start. Instantly.", l: "Start teaching free", to: "/register" },
      { Icon: Clock, t: "Keep the pace.", c: "Stay in flow while the whole class stays with you.", l: "Get support", to: "/help" },
    ],
  },
  "Checking understanding": {
    top: "Know who's with you.", accent: "Before the exam does.",
    intro: "Exams report the gap too late. Visionary shows you which learners got it, which didn't, and what to change while the teaching is still happening.",
    primary: { label: "See how Visionary checks", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See it as it happens.", c: "Understanding becomes visible: per learner, per concept, per class.", l: "See how it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise with purpose.", c: "Practice that shows you exactly where the class stands.", l: "Start teaching free", to: "/register" },
      { Icon: Target, t: "Know what to change.", c: "Clear signals for the next period, not just the next report.", l: "Keep the thread", to: "/how-it-works" },
      { Icon: Clock, t: "Act in time.", c: "Intervene before the gap becomes the exam result.", l: "Get support", to: "/help" },
    ],
  },
  "Adapting": {
    top: "Change the pace.", accent: "Not the standard.",
    intro: "Every class shifts mid-lesson. Visionary helps you change the pace, the example, or the grouping the moment your class needs it.",
    primary: { label: "See how Visionary adapts", to: "/how-it-works" },
    blocks: [
      { Icon: RefreshCw, t: "Adapt in the moment.", c: "A different example or a slower path, without leaving the lesson behind.", l: "See how it works", to: "/how-it-works" },
      { Icon: Layers3, t: "Group with intent.", c: "Know which learners are ready to move and which need another round.", l: "Start teaching free", to: "/register" },
      { Icon: BookOpen, t: "Keep the thread.", c: "Adapting never breaks the continuity of the unit.", l: "Keep the thread", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Explain in context.", c: "Adapted explanations that still land in the language of your class.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Supporting individuals": {
    top: "Reach every learner.", accent: "Even the quiet ones.",
    intro: "The learners who need you most rarely raise their hands. Visionary helps you see them, hear them, and give each one what they need.",
    primary: { label: "See how Visionary supports", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See the quiet ones.", c: "Every learner's understanding is visible, not only the volunteers.", l: "See how it works", to: "/how-it-works" },
      { Icon: UsersRound, t: "Support the fast ones.", c: "Ready-for-more learners keep moving while others catch up.", l: "Start teaching free", to: "/register" },
      { Icon: Globe2, t: "Meet them in their language.", c: "Support lands best in the language each learner thinks in.", l: "Language support", to: "/how-it-works" },
      { Icon: HeartHandshake, t: "Involve the family.", c: "Parents see the progress and know how to help at home.", l: "For parents", to: "/parent" },
    ],
  },
  "Growing": {
    top: "This year's teaching,", accent: "next year's craft.",
    intro: "Great teachers keep growing. Visionary turns every lesson, every class, and every year into insight you carry forward.",
    primary: { label: "See how Visionary grows", to: "/how-it-works" },
    blocks: [
      { Icon: TrendingUp, t: "See what worked.", c: "Understand which teaching moves moved which learners.", l: "See how it works", to: "/how-it-works" },
      { Icon: BookOpen, t: "Keep what works.", c: "Your best explanations and plans stay with you, ready to reuse.", l: "Keep the thread", to: "/how-it-works" },
      { Icon: Brain, t: "Learn what's next.", c: "New syllabus, new methods: your own learning keeps pace.", l: "Start teaching free", to: "/register" },
      { Icon: Building2, t: "Grow with your school.", c: "Visionary supports departments, coaching centres, and institutions.", l: "For organizations", to: "/organization" },
    ],
  },
};





function TeacherJourneySection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_WORDS.length, JOURNEY_WORD_MS);
  const [openStage, setOpenStage] = useState(null);

  return (
    <section ref={ref} data-section="04-journey" className="relative isolate overflow-hidden py-24 lg:py-32 bg-white">
      <FadeReveal visible={visible}>
        {/* header — Apple's card-chapter treatment (education: "From grade
            school to grad school."): statement LEFT-aligned at the measured
            gutter, and the gallery's track carries the same gutter so the
            first card starts exactly at the heading's left edge — one spine. */}
        <div className="px-6 lg:px-[clamp(24px,6.25vw,90px)]">
          <h2 className="min-h-[3.15em] font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(34px,4.45vw,64px)] md:min-h-0" style={{ color: COLORS.ink }}>
            What happens when teaching
            <br className="hidden md:block" />{" "}
            <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{JOURNEY_WORDS[index]}</span>
          </h2>
          <p className="mt-4 max-w-[640px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
            Wherever your class begins, Visionary helps your teaching move forward from there.
          </p>
        </div>
      </FadeReveal>

      <JourneyGallery stages={JOURNEY_STAGES} onOpen={setOpenStage} label="Teaching stages" />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Lesson planning" secondaryLabel="Start free" />}
    </section>
  );
}

/* ═══════════════════════ 05 · INTELLIGENCE ═══════════════════════ */





function TeacherIntelligenceSection() {
  const { ref: headRef, visible } = UseRevealOnce();
  const { index: wordIndex } = UseCycleIndex(TEACHER_INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);

  /* Tab state — "role" or "learner" */
  const [tab, setTab] = useState("role");
  const activeSteps = tab === "role" ? TEACHER_ROLE_STEPS : TEACHER_LEARNER_STEPS;

  /* Pinned-scroll observer scoped to the active tab's steps */
  const { active, setStepRef } = UseActiveStep(activeSteps.length);
  const current = activeSteps[active];

  return (
    <section ref={headRef} data-section="05-intelligence" className="relative isolate [overflow-x:clip] bg-white rounded-t-[32px]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible} className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          The intelligence behind your teaching
        </p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
            {TEACHER_INTELLIGENCE_WORDS[wordIndex]}
          </span>
        </h2>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          For you and your class, from first question to real understanding.
        </p>

        {/* Tab switcher — two equal pills, centered under the header */}
        <div className="mx-auto mt-14 flex max-w-[520px] overflow-hidden rounded-full border p-1" style={{ borderColor: `${COLORS.ink}26` }}>
          <button
            type="button"
            onClick={() => setTab("role")}
            className={`flex-1 rounded-full py-3 text-[14px] tracking-[0.24px] transition-colors ${tab === "role" ? "font-medium text-white" : "font-normal"}`}
            style={{
              backgroundColor: tab === "role" ? COLORS.ink : "transparent",
              color: tab === "role" ? "#ffffff" : COLORS.ink,
            }}
          >
            You as a teacher
          </button>
          <button
            type="button"
            onClick={() => setTab("learner")}
            className={`flex-1 rounded-full py-3 text-[14px] tracking-[0.24px] transition-colors ${tab === "learner" ? "font-medium text-white" : "font-normal"}`}
            style={{
              backgroundColor: tab === "learner" ? COLORS.ink : "transparent",
              color: tab === "learner" ? "#ffffff" : COLORS.ink,
            }}
          >
            You as a learner
          </button>
        </div>
      </FadeReveal>

      {/* Pinned-scroll — re-renders with the active tab's steps */}
      <div key={tab} className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-20 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-14 flex h-[calc(100vh-2rem)] items-center">
            <IntelligenceCopy step={current} />
          </div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {activeSteps.map((s, i) => (
            <div key={s.title}>
              <IntelligenceVisual step={s} index={i} setStepRef={setStepRef} image={TEACHER_INTEL_IMG[i % TEACHER_INTEL_IMG.length]} />
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

const TeacherClosingSection = React.memo(function TeacherClosingSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(TEACHER_KEEPS_WORDS.length, KEEPS_WORD_MS);
  return (
    <section ref={ref} data-section="06-closing" className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <p
        className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        style={{ color: COLORS.ink }}
      >
        Visionary keeps{" "}
        <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
          {TEACHER_KEEPS_WORDS[index]}
        </span>{" "}
        with you until every learner moves forward.
      </p>
    </section>
  );
});

/* ═══════════════════════ 07 · LANGUAGE ═══════════════════════ */



function TeacherLanguageSection() {
  const { ref, visible } = UseRevealOnce();
  const [lang, setLang] = useState("hi");
  const { index } = UseCycleIndex(TEACHER_LANGUAGE_QUESTIONS.length, QUESTION_MS);
  const question = TEACHER_LANGUAGE_QUESTIONS[index][lang];
  const activeLabel = LANGUAGE_CHIPS.find((c) => c.code === lang)?.label || lang;

  return (
    <section ref={ref} data-section="07-language" className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <FadeReveal visible={visible}>
        {/* header unit — tight */}
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Every language</p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Teach your way.<br />Explain your way.
        </h2>
        <p className="mx-auto max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          Plan, teach, and adapt in the language you think in.
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

          {/* the utterance — blue type, keyed fade on change */}
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
              Teach your way: voice or text, in the language you're comfortable with.
            </p>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 08 · CONTINUITY ═══════════════════════ */



const CATEGORY_SECTION_IMG = [primaryStudent, secondaryStudent, competitiveStudent, vocationStudent, higherStudent];



function TeacherContinuitySection() {
  const { ref, visible } = UseRevealOnce();
  const { index, goTo, step } = UseStageIndex(CONTINUITY_STAGES.length);
  const stage = CONTINUITY_STAGES[index];

  return (
    <section ref={ref} data-section="08-continuity" className="relative isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          Keep the thread
        </p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          What you teach stays with them.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[700px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          What your class understands becomes part of what comes next. They never start over.
        </p>
        <div className="mt-14 flex justify-center lg:mt-20">
          <StageDropdown stages={CONTINUITY_STAGES} active={index} onSelect={goTo} />
        </div>
        <div className="mt-14 grid grid-cols-1 gap-16 px-6 lg:mt-20 lg:grid-cols-3 lg:gap-12 lg:px-0">
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Previous" caption="What they learned" text={stage.previous} imgClass="lg:h-[400px]" className="lg:-ml-[6vw]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Now" caption="What you're teaching" text={stage.now} imgClass="lg:h-[600px]" className="lg:mt-[100px]" />
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
          Your class keeps its place.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 09 · ACHIEVEMENT ═══════════════════════ */

const ACHIEVEMENT_IMAGE = [teacherHeroContent, teacherachivenment, teacherbuild];

/* icon per achievement tab — reuses icons already imported in this file */
const ACHIEVEMENT_META = [
  { Icon: Eye },      /* Understand */
  { Icon: Target },   /* Achieve */
  { Icon: Layers3 },  /* Build */
];




function TeacherAchievementSection() {
  const { ref, visible } = UseRevealOnce();
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState(0);

  const toggle = useCallback((i) => {
    const next = open === i ? (i === 0 ? 1 : i - 1) : i;
    setOpen(next);
    setActive(next);
  }, [open]);

  return (
    <section ref={ref} data-section="09-achievement" className="relative isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Your achievement</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>See what your class can achieve.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Turn understanding into results, skills, and progress you can see.
        </p>

        {/* Breath 2 — accordion + image, balanced columns */}
        <div className="mx-auto mt-14 grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 lg:mt-28 lg:grid-cols-2 lg:items-center lg:gap-24 lg:px-[var(--frame-x)]">
          <AchievementAccordion meta={ACHIEVEMENT_META} tabs={TEACHER_ACHIEVEMENT_TABS} open={open} onToggle={toggle} />
          <div key={active} className="hero-fade-up overflow-hidden rounded-[48px]">
            <img
              src={ACHIEVEMENT_IMAGE[active]}
              alt={`${TEACHER_ACHIEVEMENT_TABS[active].black} ${TEACHER_ACHIEVEMENT_TABS[active].blue}`}
              loading="lazy"
              decoding="async"
              className="h-[320px] w-full rounded-[14px] object-contain sm:h-[440px] lg:h-[620px]"
              style={{ objectPosition: "center center" }}
            />
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 10 · JOURNEY FLOW ═══════════════════════ */




function TeacherJourneyFlowSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];

  return (
    <section ref={ref} data-section="10-journey-flow" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your classroom changes.<br />Your teaching stays with you.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          As your classes and goals change, Visionary is the place to continue.
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
              Wherever your classroom goes, your teaching can continue with you.
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
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 11 · TRUST ═══════════════════════ */
/* words now map 1:1 to cards — heading narrates the visible card */
const TRUST_WORDS = ["control.", "teaching.", "intelligence."];
const TRUST_WORD_MS = 6000;

const TRUST_CARDS = [
  { title: "Private by design.", copy: "We treat your personal information with care.", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Safe to grow with.", copy: "Built from the first question to what's next.", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Built responsibly.", copy: "Intelligence should help people, never work against them.", Icon: Scale, to: "/terms", link: "Read our commitments" },
];



function TeacherTrustSection() {
  const { ref, visible } = UseRevealOnce();
  const { index, goTo } = UseCycleIndex(TRUST_CARDS.length, TRUST_WORD_MS);
  const active = TRUST_CARDS[index];
  const next = TRUST_CARDS[(index + 1) % TRUST_CARDS.length];
  const stepCards = useCallback((d) => goTo(index + d), [goTo, index]);

  return (
    <section ref={ref} data-section="11-trust" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Trust and safety</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{TRUST_WORDS[index]}</span>
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Your classes, conversations, ideas, and progress are personal. Visionary keeps it that way.
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
            <div key={`a-${index}`} className="hero-fade-up w-full max-w-[780px]"><TrustCard card={active} /></div>
            <div key={`b-${index}`} className="hero-fade-up hidden w-full max-w-[780px] 2xl:block [animation-delay:80ms] [animation-fill-mode:both]"><TrustCard card={next} /></div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 12 · CTA ═══════════════════════ */

const TeacherCTASection = React.memo(function TeacherCTASection() {
  const { ref, visible } = UseRevealOnce();
  return (
    <section ref={ref} data-section="12-cta" className="relative isolate px-6 py-24 lg:py-32 rounded-t-[32px]" style={{ backgroundImage: "linear-gradient(180deg, #d9e6fd 0%, #e8f0fe 48%, #f5f9ff 100%)" }}>
      <div
        className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      >
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          Begin today
        </p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your teaching starts with where your class is.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          See who understands. Adapt the next lesson.
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
    </section>
  );
});

/* ═══════════════════════ 13 · EXPLORE ═══════════════════════ */



function TeacherExploreSection() {
  const { ref, visible } = UseRevealOnce();
  const { trackRef, canNext, scrollByCard, update } = UseScrollTrack();

  return (
    <section ref={ref} data-section="13-explore" className="relative isolate py-16 lg:py-24 [overflow-x:clip] bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
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
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function TeacherPage() {
  useSheetStack();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <TeacherHeroSection />
        <TeacherStruggleSection />
        <TeacherPromiseSection />
        <TeacherJourneySection />
        <TeacherIntelligenceSection />
        <TeacherClosingSection />
        <TeacherLanguageSection />
        <TeacherContinuitySection />
        <TeacherAchievementSection />
        <TeacherJourneyFlowSection />
        <TeacherTrustSection />
        <TeacherCTASection />
        <TeacherExploreSection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
