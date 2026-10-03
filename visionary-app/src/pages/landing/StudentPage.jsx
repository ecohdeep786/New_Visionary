import React, { useCallback, useState } from "react";
import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import studentHero from "@/assets/student-hero-main-2400w.webp";
import studentHeroContent from "@/assets/student-hero-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
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
import studentachivenment from "@/assets/achievenment-achieve.webp";
import studentbuild from "@/assets/achivenment-build.webp";

/**
 * Explore Category
 */
import teachermeet from "@/assets/teacher-hero-main-2400w.webp";
import parentmeet from "@/assets/parent-hero-main-2400w.webp";
import promeet from "@/assets/pro-face-main-2400w.webp";
import orgmeet from "@/assets/org-face-main-2400w.webp";
import { useCycleIndex as UseCycleIndex, useRevealOnce as UseRevealOnce, useRevealContinuous as UseRevealContinuous, useActiveStep as UseActiveStep, useHorizontalTrack as UseScrollTrack, useStageIndex as UseStageIndex } from "@/components/landing/system/hooks";
import {
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
} from "@/components/landing/persona/PersonaSections";

const EXPLORE_CAT_IMG = [teachermeet, parentmeet, promeet, orgmeet];

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
  mist: "#dadce0",
  white: "#ffffff",
  cardSurface: "#EEF1F6",
  cardSurfaceAlt: "#E9EFFA",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";

/* ═══════════════════════ CONTROLLERS ═══════════════════════ */













/* ═══════════════════════ MODELS ═══════════════════════ */

const HERO_WORDS = ["Learning,", "to master.", "to build."];
const HERO_WORD_MS = 2800;

const STRUGGLE_LINES = ["Every","student","struggles","with"];

const SLIDES = [
  { word: "understanding", quote: "I studied for hours. I still couldn't explain it.", image: problemunderstanding, alt: "Student studying on a tablet" },
  { word: "remembering", quote: "I understood it in class. I forgot it by evening.", image: problemrevision, alt: "Student reviewing notes on a laptop" },
  { word: "practice", quote: "I knew the formula. I didn't know when to use it.", image: problempractice, alt: "Student practising problems at a desk" },
  { word: "exams", quote: "I just needed someone to explain it differently.", image: problemexam, alt: "Student preparing before an exam" },
];

const CYCLE_MS = 4000;
const JOURNEY_WORD_MS = 3000;
const INTELLIGENCE_WORD_MS = 3000;
const KEEPS_WORD_MS = 2500;
const QUESTION_MS = 3200;
const CATEGORY_MS = 4200;

const JOURNEY_WORDS = [
  "moves with you.",
  "meets your questions.",
  "changes with your goals.",
  "grows with your understanding.",
  "opens what comes next.",
];

const JOURNEY_STAGES1 = [
  { title: "Primary", copy: "From your first questions to the ideas you're ready to explore next.", image: primaryStudent, alt: "Young student drawing on a tablet" },
  { title: "Secondary", copy: "When a lesson gets difficult, you can keep going until the idea finally makes sense.", image: secondaryStudent, alt: "Teenager working on a laptop in a library" },
  { title: "Higher secondary", copy: "Connect difficult ideas, go deeper into the subject, and build the understanding that carries forward.", image: higherStudent, alt: "Student writing notes from an open textbook" },
  { title: "Competitive exams", copy: "Move beyond familiar questions and strengthen the reasoning you need when the question changes.", image: competitiveStudent, alt: "Aspirant solving a mock test beside prep books" },
  { title: "Vocational and skills", copy: "Connect what you learn with practice, projects, and the skills you want to take into the real world.", image: vocationStudent, alt: "Student practising hands-on in a workshop" },
  { title: "Higher education", copy: "Go deeper, explore your field, and turn what you know into research, projects, and new ideas.", image: higherStudent, alt: "University student reviewing research papers" },
  { title: "Learning on your own", copy: "Start with what you want to understand, build, or become better at, and let your learning take shape from there.", image: higherStudent, alt: "Adult learning independently at home" },
];

const INTELLIGENCE_WORDS = ["Every step connected.", "Every question connected.", "Every idea connected.", "Every attempt connected.", "Every discovery connected."];

const INTELLIGENCE_STEPS = [
  { title: "Understand what you're learning.", copy: "Visionary continues from where you are, and every lesson becomes understanding." },
  { title: "See it.\nHear it.\nAsk it another way.", copy: "Open today's lesson. Visionary already understands where you are and where you're going next." },
  { title: "Practice what you're learning.", copy: "Visionary keeps teaching, listening, adapting, and encouraging until understanding becomes confidence." },
  { title: "Build from what you know.", copy: "Turn every lesson into real thinking, projects, and creative work that keeps growing with you." },
];

/* Photography per step — the framed-photo anatomy shared with the landing
   and the Organization page (never the window/art fallback). */
const INTELLIGENCE_IMG = [higherStudent, secondaryStudent, competitiveStudent, vocationStudent];

const KEEPS_WORDS = ["teaching", "listening", "adapting"];

const LANGUAGE_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];

const LANGUAGE_QUESTIONS = [
  { hi: "Why do objects fall?", en: "Why do objects fall?", bn: "বস্তু কেন পড়ে?", ta: "பொருட்கள் ஏன் விழுகின்றன?", kn: "ವಸ್ತುಗಳು ಏಕೆ ಬೀಳುತ್ತವೆ?", pa: "ਚੀਜ਼ਾਂ ਕਿਉਂ ਡਿੱਗਦੀਆਂ ਹਨ?" },
  { hi: "What is Python's list comprehension?", en: "What is Python's list comprehension?", bn: "Python-এ list comprehension কী?", ta: "Python-இல் list comprehension என்றால் என்ன?", kn: "Python ನಲ್ಲಿ list comprehension ಏನು?", pa: "Python ਦੀ list comprehension ਕੀ ਹੈ?" },
  { hi: "Transformer mein primary winding ka kaam kya hai?", en: "What does the primary winding do in a transformer?", bn: "Transformer-এ primary winding-এর কাজ কী?", ta: "Transformer-இல் primary winding-இன் பணி என்ன?", kn: "Transformer ನಲ್ಲಿ primary winding ನ ಕೆಲಸ ಏನು?", pa: "Transformer ਵਿੱਚ primary winding ਦਾ ਕੰਮ ਕੀ ਹੈ?" },
  { hi: "DCF valuation ke steps kya hain?", en: "What are the steps of DCF valuation?", bn: "DCF valuation-এর ধাপগুলো কী?", ta: "DCF valuation-இன் படிகள் எவை?", kn: "DCF valuation ನ ಹಂತಗಳು ಯಾವುವು?", pa: "DCF valuation ਦੇ ਕਦਮ ਕੀ ਹਨ?" },
  { hi: "Integration by parts kab use karte hain?", en: "When do you use integration by parts?", bn: "Integration by parts কখন ব্যবহার করা হয়?", ta: "Integration by parts எப்போது பயன்படுத்துவது?", kn: "Integration by parts ಅನ್ನು ಯಾವಾಗ ಬಳಸುವುದು?", pa: "Integration by parts ਕਦੋਂ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ?" },
];

const CONTINUITY_STAGES = [
  { name: "Primary", previous: "Fractions", now: "Decimals", next: "Percentages" },
  { name: "Secondary", previous: "Linear equations", now: "Graphs", next: "Equations" },
  { name: "Competitive exams", previous: "Concept", now: "Difficult problem", next: "New problem" },
  { name: "Vocational and skills", previous: "Basic skill", now: "Practice", next: "Real project" },
  { name: "Higher education", previous: "Research", now: "Analysis", next: "Project / discovery" },
  { name: "Independent learning", previous: "Goal", now: "Progress", next: "New direction" },
];

const ACHIEVEMENT_TABS = [
  { black: "Understand", blue: "what matters.", copy: "A clear picture of the subjects and skills that matter today." },
  { black: "Achieve what", blue: "you're working toward.", copy: "Set your goal and keep moving, with support that adapts." },
  { black: "Build something from", blue: "what you know.", copy: "Turn what you know into real projects, real skills, real work." },
];

const JOURNEY_CATEGORIES1 = ["Primary", "Secondary", "Higher secondary", "Competitive exams", "Vocational and skills", "Higher education", "Independent learning"];

// const TRUST_WORDS = ["learning", "intelligence.", "control."];
// const TRUST_WORD_MS = 3000;

// const TRUST_CARDS = [
//   { title: "Private by Design", copy: "We treat your personal information with care." },
//   { title: "Safe to grow with", copy: "Built from the first question to what's next." },
//   { title: "Built responsibly.", copy: "Intelligence should help people without compromising matters to them." },
// ];

const EXPLORE_CATEGORIES = [
  { slug: "teacher", chip: "Teacher", copy: "See who needs another explanation.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "See where your child needs support.", alt: "Parents helping students at a classroom desk" },
  { slug: "professional", chip: "Professional", copy: "Turn what you know into useful work.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Help teams carry knowledge forward.", alt: "Leader talking at an organization table" },
];

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */







/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const StudentHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Learning, to mastery."
    sub="Every concept you understand becomes the foundation for the next."
    img={studentHero}
    alt="A student smiling while carrying a new laptop"
    ctaLabel="Start learning free"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */










function StudentStruggleSection() {
  const { index, goTo } = UseCycleIndex(SLIDES.length, CYCLE_MS);
  const { ref, visible } = UseRevealContinuous();
  const slide = SLIDES[index];

  return (
    <section ref={ref} data-section="02-struggle" className="relative overflow-x-clip bg-white py-24 lg:py-32">
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-10">
          <div className="mx-auto w-full max-w-[420px] lg:col-span-5 lg:mx-0 lg:max-w-none lg:pl-[4%] xl:pl-[6.5%]">
            <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
              The problem
            </p>
            <div className="mt-6">
              <StruggleHeading word={slide.word} slideKey={index} lines={STRUGGLE_LINES} />
            </div>
          </div>

          <div className="relative w-full lg:col-span-7 lg:pr-[2%] xl:pr-[4%]">
            <StruggleCluster slide={slide} slideKey={index} />
          </div>
        </div>

        <div className="mt-12 flex justify-center px-6 lg:mt-14">
          <CarouselDots total={SLIDES.length} active={index} onSelect={goTo} label="Student learning challenges" />
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 03 · PROMISE ═══════════════════════ */

const StudentPromiseSection = React.memo(function StudentPromiseSection() {
  const { ref, visible } = UseRevealOnce();
  return (
    <section ref={ref} data-section="03-promise" className="relative isolate overflow-hidden px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <h2
        className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        style={{ color: COLORS.ink }}
      >
        What if it never forgot{" "}
        <span className="accent-gradient">where you left off?</span>
      </h2>
    </section>
  );
});

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

/* Icons per journey stage — reuses icons already imported in this file */
const JOURNEY_STAGE_ICONS = {
  "Primary": Sparkles,
  "Secondary": BookOpen,
  "Secondary and higher secondary": BookOpen,
  "Higher secondary": Layers3,
  "Competitive exams": Target,
  "Vocational and skills": RefreshCw,
  "Higher education": Brain,
  "Learning on your own": Clock,
  "Independent learning": Clock,
};

const JOURNEY_STAGES = [
  { title: "Primary", copy: "From your first questions to the ideas you're ready to explore next.", image: primaryStudent, alt: "Young student drawing on a tablet" },
  { title: "Secondary and higher secondary", copy: "When lessons get difficult, understanding keeps up through every chapter and every exam.", image: secondaryStudent, alt: "Teenager working on a laptop in a library" },
  { title: "Competitive exams", copy: "Strengthen the reasoning you need when the question changes.", image: competitiveStudent, alt: "Aspirant solving a mock test beside prep books" },
  { title: "Vocational and skills", copy: "Practice, projects, and skills you can take into the real world.", image: vocationStudent, alt: "Student practising hands-on in a workshop" },
  { title: "Higher education", copy: "Turn what you know into research, projects, and new ideas.", image: higherStudent, alt: "University student reviewing research papers" },
  { title: "Learning on your own", copy: "Start with what you want to understand. The path takes shape from there.", image: higherStudent, alt: "Adult learning independently at home" },
];

const JOURNEY_CATEGORIES = ["Primary", "Secondary and higher secondary", "Competitive exams", "Vocational and skills", "Higher education", "Learning on your own"];

const STAGE_META = {
  "Primary": { Icon: GraduationCap },
  "Secondary and higher secondary": { Icon: BookOpen },
  "Competitive exams": { Icon: Target },
  "Vocational and skills": { Icon: Layers3 },
  "Higher education": { Icon: Brain },
  "Learning on your own": { Icon: Sparkles },
};

const JOURNEY_MODALS = {
  "Primary": {
    top: "Build the basics.", accent: "Build them right.",
    intro: "Primary learning sets the pattern for everything after. Visionary makes first understanding visual, gentle, and connected.",
    primary: { label: "See an example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See it first.", c: "Numbers and words begin as pictures, stories, and voice.", l: "How it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise gently.", c: "Short, encouraging practice that rewards effort, not speed.", l: "Start practising free", to: "/register" },
      { Icon: Globe2, t: "In your language.", c: "First learning happens best in the language a child thinks in.", l: "Language support", to: "/how-it-works" },
      { Icon: UsersRound, t: "Parents stay close.", c: "Progress shared in ways that help at home, not only at report time.", l: "For parents", to: "/parent" },
    ],
  },
  "Secondary and higher secondary": {
    top: "One place for", accent: "every subject.",
    intro: "From class 6 to class 12, lessons get deeper and exams get closer. Visionary keeps understanding connected across every chapter, board, and subject.",
    primary: { label: "See an example", to: "/how-it-works" },
    blocks: [
      { Icon: Sparkles, t: "When it gets difficult.", c: "Explanations adapt until the idea finally makes sense.", l: "See how it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise what matters.", c: "Practice tied to your syllabus and the way your exams ask.", l: "Start practising free", to: "/register" },
      { Icon: BookOpen, t: "Remember it later.", c: "Yesterday's understanding stays available for today's lesson.", l: "Keep your place", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Boards and beyond.", c: "The same understanding carries into competitive preparation.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Competitive exams": {
    top: "Prepare for the exam.", accent: "Not just the syllabus.",
    intro: "Competitive preparation is reasoning under pressure. Visionary strengthens the thinking that holds when the question changes shape.",
    primary: { label: "See an example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Reasoning over memorising.", c: "Understand why a method works, so new questions feel familiar.", l: "See how it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise under real conditions.", c: "Accuracy, speed, and confidence built together.", l: "Start practising free", to: "/register" },
      { Icon: BookOpen, t: "Learn from every attempt.", c: "Each mock becomes context: what to revise, skip, strengthen.", l: "Keep your place", to: "/how-it-works" },
      { Icon: Clock, t: "Stay steady.", c: "Clear explanations when pressure is high and time is short.", l: "Get support", to: "/help" },
    ],
  },
  "Vocational and skills": {
    top: "Learn by doing.", accent: "Skills that work.",
    intro: "Vocational learning works best when you use it. Visionary connects practice, projects, and real work into one continuing journey.",
    primary: { label: "See an example", to: "/how-it-works" },
    blocks: [
      { Icon: RefreshCw, t: "Practise the real thing.", c: "Skills build through doing. Guidance never gives the answer away.", l: "See how it works", to: "/how-it-works" },
      { Icon: Layers3, t: "Build a portfolio.", c: "Turn what you learn into work you can actually show.", l: "Start building free", to: "/register" },
      { Icon: BookOpen, t: "Skills that carry forward.", c: "What you practise now connects to the next skill and job.", l: "Keep your place", to: "/how-it-works" },
      { Icon: UsersRound, t: "Learn with others.", c: "Communities and partners help you practise in real contexts.", l: "Find a partner", to: "/partners" },
    ],
  },
  "Higher education": {
    top: "Go deeper.", accent: "Build further.",
    intro: "University work asks for depth: research, analysis, and original thinking. Visionary keeps the threads connected across semesters.",
    primary: { label: "See an example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Understand at depth.", c: "Explanations that support serious subject work, not summaries.", l: "See how it works", to: "/how-it-works" },
      { Icon: BookOpen, t: "Research with context.", c: "Keep threads across papers, projects, and semesters.", l: "Keep your place", to: "/how-it-works" },
      { Icon: Layers3, t: "Build from what you know.", c: "Turn coursework into research, projects, and new ideas.", l: "Start building free", to: "/register" },
      { Icon: Building2, t: "Work with your institution.", c: "Visionary can support classrooms, labs, and departments.", l: "For organizations", to: "/organization" },
    ],
  },
  "Learning on your own": {
    top: "Your pace.", accent: "Your path.",
    intro: "No syllabus required. Start with what you want to understand, build, or become better at, and let the learning take shape from there.",
    primary: { label: "See an example", to: "/how-it-works" },
    blocks: [
      { Icon: Sparkles, t: "Start where you are.", c: "Visionary begins from your question, not a curriculum.", l: "See how it works", to: "/how-it-works" },
      { Icon: Clock, t: "Learn at your pace.", c: "The experience adapts to your time, language, and depth.", l: "Start learning free", to: "/register" },
      { Icon: BookOpen, t: "Keep your place.", c: "Return after weeks away and continue where you stopped.", l: "Keep your place", to: "/how-it-works" },
      { Icon: UsersRound, t: "Find your people.", c: "Communities and updates keep independent learners connected.", l: "Join the community", to: "/community" },
    ],
  },
};





function StudentJourneySection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_WORDS.length, JOURNEY_WORD_MS);
  const [openStage, setOpenStage] = useState(null);
  const [activeStage, setActiveStage] = useState(0);
  const { trackRef, canPrev, canNext, scrollByCard, update } = UseScrollTrack();

  /* scroll → active chip */
  const handleScroll = useCallback(() => {
    update();
    const t = trackRef.current;
    if (!t) return;
    const cards = Array.from(t.querySelectorAll("[data-card]"));
    if (!cards.length) return;
    const align = parseFloat(getComputedStyle(t).paddingLeft) || 0;
    const tLeft = t.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const d = Math.abs(card.getBoundingClientRect().left - tLeft - align);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setActiveStage(best);
  }, [update, trackRef]);

  /* chip → scroll track */
  const goToStage = useCallback((i) => {
    const t = trackRef.current;
    if (!t) return;
    const card = t.querySelectorAll("[data-card]")[i];
    if (!card) return;
    const align = parseFloat(getComputedStyle(t).paddingLeft) || 0;
    const tLeft = t.getBoundingClientRect().left;
    t.scrollTo({ left: t.scrollLeft + (card.getBoundingClientRect().left - tLeft) - align, behavior: "smooth" });
    setActiveStage(i);
  }, [trackRef]);

  return (
    <section ref={ref} data-section="04-journey" className="relative isolate overflow-hidden py-24 lg:py-32 bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
        {/* header — eyebrow / heading / one-line sub */}
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.ink }}>
          Your learning, your journey
        </p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Learning that
          <br className="hidden md:block" />{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{JOURNEY_WORDS[index]}</span>
        </h2>
        <p
          className="mx-auto mt-6 w-full max-w-[900px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]"
          style={{ color: COLORS.grey }}
        >
          Wherever you begin, Visionary helps your learning move forward from there.
        </p>

        {/* stage rail — even beat under the header */}
        <div className="mt-14 px-6 lg:mt-20">
          <div className="flex gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:justify-center lg:gap-4 lg:overflow-visible lg:py-0" role="group" aria-label="Learning stages">
            {JOURNEY_STAGES.map((stage, i) => {
              const Icon = JOURNEY_STAGE_ICONS[stage.title] || Sparkles;
              const active = i === activeStage;
              return (
                <button
                  key={stage.title}
                  type="button"
                  aria-pressed={active}
                  onClick={() => goToStage(i)}
                  className="flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-[13px] tracking-[0.2px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  style={active
                    ? { backgroundColor: COLORS.ink, borderColor: COLORS.ink, color: "#ffffff" }
                    : { backgroundColor: "#f5f5f7", borderColor: "transparent", color: COLORS.ink }}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  {stage.title}
                </button>
              );
            })}
          </div>
        </div>
      </FadeReveal>

      <JourneyCarousel
        stages={JOURNEY_STAGES}
        onOpen={setOpenStage}
        trackRef={trackRef}
        onScroll={handleScroll}
        canPrev={canPrev}
        canNext={canNext}
        scrollByCard={scrollByCard}
        iconMap={JOURNEY_STAGE_ICONS}
      />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Primary" secondaryLabel="Start free" />}
    </section>
  );
}

/* ═══════════════════════ 05 · INTELLIGENCE ═══════════════════════ */





function StudentIntelligenceSection() {
  const { ref: headRef, visible } = UseRevealOnce();
  const { index: wordIndex } = UseCycleIndex(INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);
  const { active, setStepRef } = UseActiveStep(INTELLIGENCE_STEPS.length);
  const current = INTELLIGENCE_STEPS[active];

  return (
    <section ref={headRef} className="relative [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible} className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          The intelligence behind your learning
        </p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
            {INTELLIGENCE_WORDS[wordIndex]}
          </span>
        </h2>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          From the first question to the moment you can use what you've learned.
        </p>
      </FadeReveal>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-20 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-14 flex h-[calc(100vh-2rem)] items-center">
            <IntelligenceCopy step={current} />
          </div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {INTELLIGENCE_STEPS.map((s, i) => (
            <div key={s.title}>
              <IntelligenceVisual step={s} index={i} setStepRef={setStepRef} image={INTELLIGENCE_IMG[i % INTELLIGENCE_IMG.length]} />
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

const StudentClosingSection = React.memo(function StudentClosingSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(KEEPS_WORDS.length, KEEPS_WORD_MS);
  return (
    <section ref={ref} data-section="06-closing" className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <p
        className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        style={{ color: COLORS.ink }}
      >
        Visionary keeps{" "}
        <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
          {KEEPS_WORDS[index]}
        </span>{" "}
        until understanding becomes confidence.
      </p>
    </section>
  );
});

/* ═══════════════════════ 07 · LANGUAGE ═══════════════════════ */
/* ═══════════════════════ 07 · LANGUAGE ═══════════════════════ */


function StudentLanguageSection() {
  const { ref, visible } = UseRevealOnce();
  const [lang, setLang] = useState("hi");
  const { index } = UseCycleIndex(LANGUAGE_QUESTIONS.length, QUESTION_MS);
  const question = LANGUAGE_QUESTIONS[index][lang];
  const activeLabel = LANGUAGE_CHIPS.find((c) => c.code === lang)?.label || lang;

  return (
    <section ref={ref} data-section="07-language" className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <FadeReveal visible={visible}>
        {/* header unit — tight */}
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Every language</p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          The words can change.<br />Understanding shouldn't.
        </h2>
        <p className="mx-auto max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          Ask, learn, and practice in the language you think in.
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
              Think your way: voice or text, in the language you're comfortable with.
            </p>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 08 · CONTINUITY ═══════════════════════ */



const CATEGORY_SECTION_IMG = [primaryStudent, secondaryStudent, competitiveStudent, vocationStudent, higherStudent];



function StudentContinuitySection() {
  const { ref, visible } = UseRevealOnce();
  const { index, goTo, step } = UseStageIndex(CONTINUITY_STAGES.length);
  const stage = CONTINUITY_STAGES[index];

  return (
    <section ref={ref} data-section="08-continuity" className="relative isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          Keep your place
        </p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          What you learn stays with you.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[700px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          What you understand becomes part of what comes next. You never start over.
        </p>
        <div className="mt-14 flex justify-center lg:mt-20">
          <StageDropdown stages={CONTINUITY_STAGES} active={index} onSelect={goTo} />
        </div>
        <div className="mt-14 grid grid-cols-1 gap-16 px-6 lg:mt-20 lg:grid-cols-3 lg:gap-12 lg:px-0">
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Previous" caption="What you learned" text={stage.previous} imgClass="lg:h-[400px]" className="lg:-ml-[6vw]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Now" caption="What you're working on" text={stage.now} imgClass="lg:h-[600px]" className="lg:mt-[100px]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Next" caption="Where you can go" text={stage.next} imgClass="lg:h-[370px]" className="lg:-mr-[6vw] lg:mt-[20px]" />
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
          You keep your place.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 09 · ACHIEVEMENT ═══════════════════════ */
const ACHIEVEMENT_IMAGE = [studentHeroContent, studentachivenment, studentbuild];

/* icon per achievement tab — reuses icons already imported in this file */
const ACHIEVEMENT_META = [
  { Icon: Eye },      /* Understand */
  { Icon: Target },   /* Achieve */
  { Icon: Layers3 },  /* Build */
];




function StudentAchievementSection() {
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
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>See what you can achieve.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Turn understanding into results, skills, and progress you can see.
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
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 10 · JOURNEY FLOW ═══════════════════════ */




function StudentJourneyFlowSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];

  return (
    <section ref={ref} data-section="10-journey-flow" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          New stage.<br />Same intelligence.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          As your goals change, Visionary is the place to continue.
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
              Wherever your journey goes, your learning can continue with you.
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
const TRUST_WORDS = ["control.", "learning.", "intelligence."];
const TRUST_WORD_MS = 6000;

const TRUST_CARDS = [
  { title: "Private by design.", copy: "We treat your personal information with care.", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Safe to grow with.", copy: "Built from the first question to what's next.", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Built responsibly.", copy: "Intelligence should help people, never work against them.", Icon: Scale, to: "/terms", link: "Read our commitments" },
];



function StudentTrustSection() {
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
          Your questions, conversations, ideas, and progress are personal. Visionary keeps it that way.
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

const StudentCTASection = React.memo(function StudentCTASection() {
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
          Your learning starts with where you are.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Ask your first question. Start building from what you know.
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



function StudentExploreSection() {
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

export default function StudentPage() {
  useSheetStack();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <StudentHeroSection />
        <StudentStruggleSection />
        <StudentPromiseSection />
        <StudentJourneySection />
        <StudentIntelligenceSection />
        <StudentClosingSection />
        <StudentLanguageSection />
        <StudentContinuitySection />
        <StudentAchievementSection />
        <StudentJourneyFlowSection />
        <StudentTrustSection />
        <StudentCTASection />
        <StudentExploreSection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
