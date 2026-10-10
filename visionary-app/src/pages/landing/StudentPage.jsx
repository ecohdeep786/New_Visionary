import React, { useCallback, useEffect, useRef, useState } from "react";
import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import studentHero from "@/assets/student-hero-main-2400w.webp";
import studentHeroContent from "@/assets/student-hero-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import PersonaHero from "@/components/landing/NewPersona";
import { ShieldCheck, HeartHandshake, Scale, ChevronDown } from "lucide-react";

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
import { useCycleIndex as UseCycleIndex, useRevealOnce as UseRevealOnce, useRevealContinuous as UseRevealContinuous, useHorizontalTrack as UseScrollTrack } from "@/components/landing/system/hooks";
import {
  StruggleChapter,
  JourneyGallery,
  JourneyModal,
  JourneyCategoryCard,
  ChevronIcon,
  ScrollReveal,
  RevealItem,
} from "@/components/landing/persona/PersonaSections";

const EXPLORE_CAT_IMG = [teachermeet, parentmeet, promeet, orgmeet];

const StudentExploreCard = React.memo(function StudentExploreCard({ index, category, images }) {
  return (
    <Link
      to={`/${category.slug}`}
      data-card
      className="group block w-[260px] shrink-0 snap-start sm:w-[320px]"
    >
      <div className="overflow-hidden rounded-[30px] bg-[#f5f5f7]">
        <img src={images[index]} alt={category.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-google group-hover:scale-[1.04]" />
      </div>
      <div className="flex flex-col items-start pt-5 text-left">
        <p className="font-normal tracking-[0] leading-[20px] text-[14px]" style={{ color: COLORS.grey }}>
          {category.chip}
        </p>
        <p className="mt-2 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
          {category.copy}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 font-normal tracking-[0] leading-[22px] text-[17px]" style={{ color: COLORS.blue }}>
          Learn more
          <ChevronIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
});

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

/* Reduced motion — the dial and carousels read click-driven / instant under it */
function UsePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

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
const QUESTION_MS = 3200;
const CATEGORY_MS = 4200;

const JOURNEY_WORDS = [
  "moves with \nyou.",
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

const ACHIEVEMENT_TABS = [
  { title: "Understand what matters.", copy: "A clear picture of the subjects and skills that matter today." },
  { title: "Achieve what you're working toward.", copy: "Set your goal and keep moving, with support that adapts." },
  { title: "Build something from what you know.", copy: "Turn what you know into real projects, real skills, real work." },
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
    srSentence="Learning, to master, to build."
    sub="Every concept you understand becomes the foundation for the next."
    img={studentHero}
    alt="A student smiling while carrying a new laptop"
    ctaLabel="Start learning free"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */










function StudentStruggleSection() {
  /* The problem chapter is static — no rotating slides, no auto-advance.
     The visitor reads one challenge at a time while staying on the page
     (Apple never auto-steps a problem/story section). Dots still allow
     manual selection. */
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i) => setIndex(Math.min(SLIDES.length - 1, Math.max(0, i))), []);
  const { ref } = UseRevealContinuous();

  return (
    <section ref={ref} data-section="02-struggle" className="relative overflow-x-clip bg-white">
      {/* the bridge's compact band (02-struggle) carries the chapter breath;
          the chapter leads in on Apple's hero-scroll-linked reveal */}
      <StruggleChapter
        linked
        slides={SLIDES}
        index={index}
        goTo={goTo}
        lines={STRUGGLE_LINES}
        label="Student learning challenges"
        kicker="Where understanding slips"
        copy="Studying isn't the difficulty. Knowing it landed is."
      />
    </section>
  );
}

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */
/* The turn from the problem chapter lands directly here: the struggle ends
   in a first-person quote, and this chapter answers it with the product —
   "Learning that moves with you." No promise/question beat between them:
   the hero already carries the promise (…becomes the foundation for the
   next), and a "what if" with no antecedent reads as a fragment. Apple
   turns with statements, not rhetorical questions. */

const JOURNEY_STAGES = [
  { title: "Primary", statement: "Build the basics. Build them right.", copy: "From your first questions to the ideas you're ready to explore next.", image: primaryStudent, alt: "Young student drawing on a tablet" },
  { title: "Secondary and higher secondary", statement: "One place for every subject.", copy: "When lessons get difficult, understanding keeps up through every chapter and every exam.", image: secondaryStudent, alt: "Teenager working on a laptop in a library" },
  { title: "Competitive exams", statement: "Prepare for the exam. Not just the syllabus.", copy: "Strengthen the reasoning you need when the question changes.", image: competitiveStudent, alt: "Aspirant solving a mock test beside prep books" },
  { title: "Vocational and skills", statement: "Learn by doing. Skills that work.", copy: "Practice, projects, and skills you can take into the real world.", image: vocationStudent, alt: "Student practising hands-on in a workshop" },
  { title: "Higher education", statement: "Go deeper. Build further.", copy: "Turn what you know into research, projects, and new ideas.", image: higherStudent, alt: "University student reviewing research papers" },
  { title: "Learning on your own", statement: "Your pace. Your path.", copy: "Start with what you want to understand. The path takes shape from there.", image: higherStudent, alt: "Adult learning independently at home" },
];

const JOURNEY_CATEGORIES = ["Primary", "Secondary and higher secondary", "Competitive exams", "Vocational and skills", "Higher education", "Learning on your own"];

/* Icons per journey-flow card (10 · JOURNEY FLOW) */
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
        <div className="mx-auto w-full px-6 min-[735px]:max-w-[692px] min-[735px]:px-0 min-[1069px]:max-w-[980px]">
          <h2 className="font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
            <span className="block">Learning that</span>
            <span key={index} className="hero-fade-up block min-h-[1.06em] [animation-duration:1s]" style={{ color: COLORS.blue }}>{JOURNEY_WORDS[index]}</span>
          </h2>
          <p className="mt-4 max-w-[640px] font-normal tracking-[0] leading-[25px] text-[17.5px]"
            style={{ color: COLORS.grey }}
          >
            Wherever you begin, Visionary helps your learning move forward from there.
          </p>
        </div>
      </ScrollReveal>

      <JourneyGallery stages={JOURNEY_STAGES} onOpen={setOpenStage} label="Learning stages" iconMap={STAGE_META} />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Primary" secondaryLabel="Start free" />}
    </section>
  );
}

/* ═══════════════════════ 05 · INTELLIGENCE ═══════════════════════ */
/* Apple's dark technology chapter, final anatomy (Vision Pro measured,
   Oct 2026): a calm statement opens the chapter — one gradient wordmark,
   one subhead capped at two lines — then the product story: four beats
   that walk the learner through the flow (understand → see it → practise
   → build), each beat swapping one sticky product stage. The stage is
   video-ready: drop the product clip into INTELLIGENCE_CLIPS and it plays
   while its beat is centred; until then the scene art holds the frame.
   Step dots under the stage, inactive beats dimmed, one muted link
   closes the chapter. */

const INTELLIGENCE_STEPS = [
  { title: "Understand what you're learning.", copy: "Visionary continues from where you are, and every lesson becomes understanding." },
  { title: "See it. Hear it.\nAsk it another way.", copy: "Open today's lesson. Visionary already understands where you are and where you're going next." },
  { title: "Practice what you're learning.", copy: "Every answer becomes a chance to practise, with feedback that listens and adapts at your pace." },
  { title: "Build from what you know.", copy: "Turn every lesson into real thinking, projects, and creative work that keeps growing with you." },
];

const IntelligenceDrawer = React.memo(function IntelligenceDrawer({ step, index, total, active = false }) {
  /* frost tokens for the dark stage — explicit so nothing leans on the
     bridge's inherited overrides (spans escape those anyway) */
  const frost = "rgba(245,247,250,0.72)";
  const frostDim = "rgba(245,247,250,0.45)";
  return (
    <div key={`${index}-${step.title}`} className="hero-fade-up w-full">
      <p className="text-[13px] font-medium tracking-[0.14em]">
        <span style={{ color: active ? "#8ab4f8" : frostDim }}>{String(index + 1).padStart(2, "0")}</span>
        <span style={{ color: frostDim }}> · {String(total).padStart(2, "0")}</span>
      </p>
      <h3 className="mt-4 whitespace-pre-line font-semibold tracking-[-0.009em] leading-[1.14] text-[clamp(26px,2.4vw,32px)]" style={{ color: "#f5f7fa" }}>
        {step.title}
      </h3>
      <p className="mt-4 font-normal tracking-[0] leading-[25px] text-[17px]" style={{ color: frost }}>
        {step.copy}
      </p>
    </div>
  );
});

/* Four scenes of ONE intelligence — the same mark evolving, on Apple's dark
   technology-chapter stage: near-black field, a blue glow breathing behind
   the artifact, hairline white rings, frost core, glowing blue satellites.
   Each beat recomposes the artifact so the intelligence visibly grows with
   the scroll, the way Apple's dark chapters transform a single product
   scene. These hold the frame until the product clips land. */
const IntelligenceBeats = React.memo(function IntelligenceBeats({ index, label }) {
  const core = "#f5f7fa", blue = "#8ab4f8", hairline = "rgba(255,255,255,0.14)", track = "rgba(255,255,255,0.12)";
  const stage = {
    background:
      "radial-gradient(58% 52% at 50% 44%, rgba(66,133,244,0.2) 0%, rgba(66,133,244,0.06) 46%, rgba(13,16,23,0) 74%)",
  };
  if (index === 0) {
    // Understand — ideas converging on one center
    return (
      <div role="img" aria-label={label} className="relative h-full w-full overflow-hidden" style={stage}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke={hairline} strokeWidth="0.4" strokeDasharray="3 5" />
          <circle cx="50" cy="50" r="34" fill="none" stroke={blue} strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="2 6" />
          <circle cx="50" cy="50" r="22" fill="rgba(255,255,255,0.03)" stroke={core} strokeOpacity="0.12" strokeWidth="0.4" />
          {[[50,6],[81,30],[81,70],[50,94],[19,70],[19,30]].map(([cx,cy],i)=>(
            <g key={i}>
              <line x1="50" y1="50" x2={cx} y2={cy} stroke={blue} strokeOpacity="0.45" strokeWidth="0.4" strokeDasharray="2 3" />
              <circle cx={cx} cy={cy} r={i===0?2.1:1.5} fill={blue} fillOpacity={i===0?1:0.5} />
            </g>
          ))}
          <circle cx="50" cy="50" r="6.5" fill={blue} fillOpacity="0.22" />
          <circle cx="50" cy="50" r="3.4" fill={core} />
        </svg>
      </div>
    );
  }
  if (index === 1) {
    // See / Hear / Ask — three ways to one idea
    return (
      <div role="img" aria-label={label} className="relative h-full w-full overflow-hidden" style={stage}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke={hairline} strokeWidth="0.4" strokeDasharray="3 5" />
          <circle cx="50" cy="50" r="16" fill="rgba(255,255,255,0.04)" stroke={blue} strokeOpacity="0.55" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="6" fill={blue} fillOpacity="0.2" />
          <circle cx="50" cy="50" r="3" fill={core} />
          {/* three arcs at 120° */}
          {[0,120,240].map((deg,i)=>{
            const rad = (deg-90)*Math.PI/180;
            const r=27, w=11;
            return <path key={i} d={`M ${50+(r)*Math.cos(rad)} ${50+(r)*Math.sin(rad)} L ${50+(r+w)*Math.cos(rad)} ${50+(r+w)*Math.sin(rad)}`} stroke={i===1?blue:core} strokeWidth="2" strokeLinecap="round" strokeOpacity={i===1?0.95:0.5} />;
          })}
          {[0,120,240].map((deg,i)=>{
            const rad = (deg-90+20)*Math.PI/180;
            return <circle key={i} cx={50+43*Math.cos(rad)} cy={50+43*Math.sin(rad)} r={i===0?2.2:1.4} fill={i===0?blue:core} fillOpacity={i===0?1:0.4} />;
          })}
        </svg>
      </div>
    );
  }
  if (index === 2) {
    // Practice — a progress arc building with dots marching
    return (
      <div role="img" aria-label={label} className="relative h-full w-full overflow-hidden" style={stage}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke={hairline} strokeWidth="0.4" strokeDasharray="3 5" />
          {/* ~300° progress arc */}
          <path d="M 50 12 A 38 38 0 1 1 21 73" fill="none" stroke={track} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M 50 8 A 42 42 0 1 1 18 76" fill="none" stroke={blue} strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />
          {/* marching dots along the arc */}
          {[0,40,80,120,160,200,240,280].map((deg,i)=>{
            const rad = (deg-90)*Math.PI/180;
            return <circle key={i} cx={50+40*Math.cos(rad)} cy={50+40*Math.sin(rad)} r={i===7?2.2:1.4} fill={i===7?core:blue} fillOpacity={i===7?1:0.5} />;
          })}
          <circle cx="50" cy="50" r="2.6" fill={core} />
          {/* a check spark near the end of the arc */}
          <path d="M 78 20 l 3 4 7 -8" fill="none" stroke={blue} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  // Build — the artifact radiates out into the work
  return (
    <div role="img" aria-label={label} className="relative h-full w-full overflow-hidden" style={stage}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke={hairline} strokeWidth="0.4" strokeDasharray="3 5" />
        <circle cx="50" cy="50" r="32" fill="none" stroke={blue} strokeOpacity="0.3" strokeWidth="0.5" />
        {[0,45,90,135,180,225,270,315].map((deg,i)=>{
          const rad = (deg-90)*Math.PI/180;
          const hyp = 32 + (i%3===0?6:0);
          const hex = 50 + hyp*Math.cos(rad), hey = 50 + hyp*Math.sin(rad);
          const tex = 50 + 43*Math.cos(rad), tey = 50 + 43*Math.sin(rad);
          const isHub = i===2;
          return (
            <g key={i}>
              <line x1={hex} y1={hey} x2={tex} y2={tey} stroke={isHub?core:blue} strokeWidth={isHub?0.9:0.5} strokeOpacity={isHub?1:0.45} />
              <circle cx={hex} cy={hey} r={isHub?1.8:1.2} fill={isHub?core:blue} fillOpacity={isHub?1:0.55} />
              <circle cx={tex} cy={tey} r={isHub?2.4:1.5} fill={isHub?core:blue} fillOpacity={isHub?1:0.5} />
            </g>
          );
        })}
        <circle cx="50" cy="50" r="6" fill={blue} fillOpacity="0.18" />
        <circle cx="50" cy="50" r="3" fill={core} />
      </svg>
    </div>
  );
});

/* Product clip per beat. Each entry is the internal product video URL for
   that step of the flow; while a clip is unset the beat's scene art stays
   in the frame. */
const INTELLIGENCE_CLIPS = [null, null, null, null];

/* One sticky product stage — the chapter's video rectangle. Hairline chrome
   on a raised ink field; every beat is stacked and cross-faded by `active`
   with a settle-scale (Apple's product-scene resolve), a clip plays only
   while its beat is active, and reduced motion snaps everything to instant.
   The 30px radius matches the journey story cards exactly. */
const IntelligenceFrame = React.memo(function IntelligenceFrame({ active, autoplay = true }) {
  const reduced = UsePrefersReducedMotion();
  const videos = useRef([]);
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (autoplay && i === active && !reduced) v.play().catch(() => {});
      else v.pause();
    });
  }, [active, autoplay, reduced]);
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[30px] border"
      style={{ backgroundColor: "#0d1017", borderColor: "rgba(255,255,255,0.1)" }}
    >
      {INTELLIGENCE_STEPS.map((s, i) => (
        <div
          key={s.title}
          aria-hidden={i !== active}
          className="absolute inset-0"
          style={{
            opacity: i === active ? 1 : 0,
            transform: i === active ? "none" : "scale(0.97)",
            transition: reduced
              ? "none"
              : "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {INTELLIGENCE_CLIPS[i] ? (
            <video
              ref={(el) => (videos.current[i] = el)}
              src={INTELLIGENCE_CLIPS[i]}
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={s.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <IntelligenceBeats index={i} label={s.title} />
          )}
        </div>
      ))}
    </div>
  );
});

/* Active beat = the one whose copy crosses the viewport centre. Computed from
   the beat boxes so the product stage swaps exactly when its copy is centred. */
function UseCentredStep(total) {
  const nodes = useRef([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      nodes.current.slice(0, total).forEach((n, i) => {
        if (!n) return;
        const r = n.getBoundingClientRect();
        const dist = Math.abs((r.top + r.bottom) / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [total]);
  const setStepRef = useCallback(
    (i) => (node) => {
      nodes.current[i] = node;
    },
    []
  );
  return { active, setStepRef, nodes };
}

function StudentIntelligenceSection() {
  const { ref: headRef } = UseRevealOnce();
  const { active, setStepRef, nodes } = UseCentredStep(INTELLIGENCE_STEPS.length);

  /* the step dots jump the scroll to their beat (controls-under-media) */
  const scrollToBeat = useCallback((i) => {
    const node = nodes.current?.[i];
    if (!node) return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }, [nodes]);

  return (
    <section ref={headRef} data-section="05-intelligence" className="scene-dark relative [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      {/* the chapter's one breath of light — blue rising from above the
          statement, so all color lives in the content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{ background: "radial-gradient(52% 74% at 50% 0%, rgba(66,133,244,0.13) 0%, rgba(66,133,244,0.04) 46%, rgba(10,13,20,0) 74%)" }}
      />
      {/* statement opening — one gradient wordmark, one subhead capped at
          two lines; the 40px floor keeps "intelligence." whole at 320px */}
      <ScrollReveal className="relative mx-auto flex w-full max-w-[980px] flex-col items-center px-6 text-center">
        <RevealItem idx={0}>
          <h2 className="text-balance font-medium tracking-[-0.015em] leading-[1.05] text-[clamp(40px,5.55vw,80px)]">
            <span className="accent-gradient-on-dark">One intelligence.</span>
          </h2>
        </RevealItem>
        <RevealItem idx={1}>
          <p className="text-frost mx-auto mt-[var(--gap-title-sub-display)] max-w-[640px] font-normal tracking-[0] leading-[25px] text-[17.5px]">
            From the first question to using what you know.
          </p>
        </RevealItem>
      </ScrollReveal>

      {/* the product flow — four beats scroll past one video-ready stage;
          inactive beats dim like Apple's non-active cards */}
      <div className="relative mx-auto grid w-full grid-cols-1 gap-16 px-6 pt-20 min-[1069px]:max-w-[980px] lg:grid-cols-[5fr_6fr] lg:gap-32 lg:px-0 lg:pt-16">
        <div className="hidden lg:block">
          {INTELLIGENCE_STEPS.map((s, i) => (
            <div
              key={s.title}
              ref={setStepRef(i)}
              data-step={i}
              className="flex min-h-[64vh] items-center py-[8vh]"
            >
              <div
                className="w-full"
                style={{
                  opacity: active === i ? 1 : 0.4,
                  transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <IntelligenceDrawer step={s} index={i} total={INTELLIGENCE_STEPS.length} active={active === i} />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-14 flex h-[calc(100vh-2rem)] flex-col items-center justify-center">
            <div className="aspect-[15/16] w-full">
              <IntelligenceFrame active={active} />
            </div>
            <div className="mt-7 flex items-center gap-2.5" role="group" aria-label="Intelligence steps">
              {INTELLIGENCE_STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  aria-pressed={i === active}
                  onClick={() => scrollToBeat(i)}
                  className="h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8] focus-visible:ring-offset-2"
                  style={{ width: i === active ? 40 : 8, backgroundColor: i === active ? "#8ab4f8" : "rgba(245,247,250,0.3)" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* mobile: each beat stacks its stage above its copy */}
        <div className="flex flex-col gap-24 lg:hidden">
          {INTELLIGENCE_STEPS.map((s, i) => (
            <div key={s.title}>
              <div className="mx-auto aspect-[4/3] w-full max-w-[440px] overflow-hidden rounded-[30px]">
                <IntelligenceFrame active={i} autoplay={false} />
              </div>
              <div className="mt-10">
                <IntelligenceDrawer step={s} index={i} total={INTELLIGENCE_STEPS.length} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* one muted link closes the chapter
      <div className="relative mt-2 flex justify-center px-6 lg:mt-4">
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-1.5 text-[15px] font-normal transition-colors duration-200 hover:text-[#c8dcff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8] focus-visible:ring-offset-2"
          style={{ color: "rgba(138,180,248,0.85)" }}
        >
          Learn more
          <ChevronIcon className="h-3.5 w-3.5" />
        </Link> */}
      {/* </div> */}
    </section>
  );
}


/* ═══════════════════════ 07 · LANGUAGE ═══════════════════════ */
/* The voice dial — the landing's canonical language chapter, final anatomy:
   a centered feature statement (Apple's law for a chapter that opens on one
   symmetric object, measured on the Vision Pro page) with the chapter's one
   muted link, then the dial — six wordless language dots gliding one step
   per beat on a hairline ring, the language landing at 12 o'clock speaking
   its own subject question at the center. The reel auto-advances the way
   Apple's product highlights do, with the bare control row under the stage
   (play/pause left, chevrons right) and goes silent while off-screen. */

const StudentOrbitDots = React.memo(function StudentOrbitDots({ activeIndex, onSelect, reduced }) {
  const stepDeg = 360 / LANGUAGE_CHIPS.length;
  /* dots laid out counterclockwise so each advance spins the ring clockwise
     and still lands the active language at 12 o'clock */
  const rotation = activeIndex * stepDeg;
  return (
    <>
      {/* the orbit track */}
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="49.75" fill="none" stroke={COLORS.ink} strokeOpacity="0.12" strokeWidth="0.25" />
      </svg>
      {/* the rotating dot ring */}
      <div className="absolute inset-0 transition-transform ease-google" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: reduced ? "0ms" : "700ms" }}>
        {LANGUAGE_CHIPS.map((c, i) => {
          const isActive = i === activeIndex;
          return (
            <div key={c.code} className="absolute inset-0" style={{ transform: `rotate(${-i * stepDeg}deg)` }}>
              <button type="button" aria-pressed={isActive} aria-label={`Show ${c.label}`}
                onClick={() => onSelect(i)}
                className="absolute left-1/2 top-0 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                style={{ boxShadow: isActive ? "0 0 0 5px rgba(18,19,23,0.05)" : "none" }}>
                <span className="block rounded-full transition-all duration-500 ease-apple"
                  style={{ width: isActive ? 12 : 7, height: isActive ? 12 : 7, backgroundColor: isActive ? COLORS.ink : `${COLORS.ink}3D` }} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
});

function StudentLanguageSection() {
  const reduced = UsePrefersReducedMotion();
  const { ref } = UseRevealOnce();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const dialRef = useRef(null);
  const inViewRef = useRef(true);
  const active = LANGUAGE_CHIPS[index];
  /* the language at the reading position speaks its own subject question
     (5 subject lines tour across 6 languages, so the bank wraps) */
  const question = LANGUAGE_QUESTIONS[index % LANGUAGE_QUESTIONS.length][active.code];

  /* Apple's highlights anatomy: the reel advances on its own while it is on
     screen and the visitor holds the control — pause stops the tour, the
     chevrons and dots step it by hand. */
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      if (inViewRef.current) setIndex((i) => (i + 1) % LANGUAGE_CHIPS.length);
    }, QUESTION_MS);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const node = dialRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const goTo = useCallback(
    (i) => setIndex(((i % LANGUAGE_CHIPS.length) + LANGUAGE_CHIPS.length) % LANGUAGE_CHIPS.length),
    []
  );
  const step = useCallback(
    (d) => setIndex((i) => (i + d + LANGUAGE_CHIPS.length) % LANGUAGE_CHIPS.length),
    []
  );

  return (
    <section ref={ref} data-section="07-language" className="relative isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <ScrollReveal>
        {/* header — eyebrow, statement, one supporting line, staggered on
            Apple's resolve-out curve like the rest of the page's chapters */}
        {/* <RevealItem idx={0}>
          <p className="text-center text-[15px] font-normal" style={{ color: COLORS.grey }}>Every language</p>
        </RevealItem> */}
        <RevealItem idx={1}>
          <h2 className="text-balance mt-[var(--gap-eyebrow-title-display)] text-center font-semibold tracking-[-0.009em] leading-[1.08] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
            The words change.<br className="hidden sm:block" />Understanding doesn't.
          </h2>
        </RevealItem>
        <RevealItem idx={2}>
          <p className="mx-auto mt-[var(--gap-title-sub-display)] max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
            Ask in the language you think in. The understanding that comes back is the same.
          </p>
        </RevealItem>
        {/* the chapter's one quiet link — Apple's feature-chapter affordance */}
        <RevealItem idx={3}>
          <div className="mt-6 flex justify-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-[15px] font-normal transition-colors duration-200 hover:text-[#0b57d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              style={{ color: COLORS.blue }}
            >
              Learn more
              <ChevronIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </RevealItem>

        {/* the voice dial — the ring grows with the screen; dots ride the
            hairline while the speaking language's question holds the center.
            A whisper of product-wash breathes beneath, and the equalizer is
            monochrome with the zone's single accent — no decorative chrome. */}
        <RevealItem idx={4}>
          <div ref={dialRef} className="mx-auto mt-14 w-full max-w-[min(604px,88vw)] sm:mt-20">
            <div className="relative aspect-square w-full" role="group" aria-label="Language selection">
              <StudentOrbitDots activeIndex={index} onSelect={goTo} reduced={reduced} />
              {/* whisper of product-wash beneath the dial — Apple's soft
                  radial, same recipe as the struggle chapter's floor */}
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(66,133,244,0.06) 0%, rgba(66,133,244,0.02) 46%, rgba(66,133,244,0) 72%)" }} />
              {/* the center — the speaking language's name in Apple's quiet
                  label voice (sentence case, no tracking), its question at
                  statement scale, the one accent listening beneath. The fixed
                  inscribed region is sized for the worst-wrapping script. */}
              <div className="absolute inset-x-[16%] inset-y-[18%] flex flex-col items-center justify-center text-center">
                <span key={`name-${index}`} className="hero-fade-up text-[13px] font-medium tracking-[0] leading-[1.4]" style={{ color: COLORS.grey }}>{active.label}</span>
                <p aria-live="polite" lang={active.code} className="mt-3 flex items-center justify-center text-center font-semibold tracking-[-0.014em] leading-[1.15] text-[clamp(22px,2.2vw,32px)]" style={{ color: COLORS.ink }}>
                  <span key={index} className="hero-fade-up">{question}</span>
                </p>
                <div className="mt-5 flex items-end justify-center gap-1.5" aria-hidden="true">
                  {["#121317", "#4285F4", "#121317", "#121317"].map((c, i) => (
                    <span key={i} className="h-6 w-1.5 rounded-full" style={{ backgroundColor: c, opacity: i === 1 ? 1 : 0.22, transformOrigin: "center", animation: `voiceDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
            {/* the control row — Apple's bare 36px glyphs at the stage's
                edges: play/pause left, prev/next right */}
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                aria-label={playing ? "Pause the languages" : "Play the languages"}
                aria-pressed={!playing}
                onClick={() => setPlaying((v) => !v)}
                className="flex h-9 w-9 items-center justify-center text-[#121317] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
                    <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
                    <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] translate-x-[1px]" aria-hidden="true">
                    <path d="M8 5.5c0-.9 1-1.5 1.8-1l9.6 5.6c.8.5.8 1.7 0 2.2l-9.6 5.6c-.8.5-1.8-.1-1.8-1V5.5z" />
                  </svg>
                )}
              </button>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  aria-label="Previous language"
                  onClick={() => step(-1)}
                  className="flex h-9 w-9 items-center justify-center text-[#121317] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                >
                  <ChevronIcon direction="left" className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label="Next language"
                  onClick={() => step(1)}
                  className="flex h-9 w-9 items-center justify-center text-[#121317] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                >
                  <ChevronIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </RevealItem>

        {/* quiet legend — the chapter's small print sits directly under the
            stage, after the controls (Apple: media → controls → caption) */}
        <RevealItem idx={5}>
          <div className="mx-auto mt-6 w-full max-w-[860px] sm:mt-8">
            <p className="text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
              Listening in {active.label} · understood in every language
            </p>
            <p className="mt-1 text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
              Use voice or text in the way you're comfortable.
            </p>
          </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}


/* ═══════════════════════ 08 · CONTINUITY ═══════════════════════ */
/* The intelligence-stays-with-you chapter — Apple's education "Designed to
   Ignite" trio, measured live Oct 2026: a center-dominant square flanked by
   two smaller wings descending left to right. The composition IS the flow —
   what the intelligence remembers (left wing), what it sits beside you
   working on now (dominant center), where it can take you next (right
   wing). The three sentences are the captions; no picker, the knowledge
   itself is the story. Left editorial header on the fixed spine (education
   law measured: heading and support share one left edge). Mobile stacks
   the trio, Apple's responsive fallback. */

const CATEGORY_SECTION_IMG = [primaryStudent, secondaryStudent, competitiveStudent, vocationStudent, higherStudent];

function StudentContinuitySection() {
  const { ref } = UseRevealOnce();
  const moments = [
    { label: "What you learned", image: primaryStudent, alt: "A student building the basics" },
    { label: "What you're working on", image: secondaryStudent, alt: "A student working through today's lesson" },
    { label: "Where you can go", image: competitiveStudent, alt: "A student preparing for what comes next" },
  ];

  return (
    <section ref={ref} data-section="08-continuity" className="relative isolate py-24 lg:py-32 [overflow-x:clip] bg-white">
      <ScrollReveal>
        <div className="mx-auto w-full px-6 min-[735px]:max-w-[692px] min-[735px]:px-0 min-[1069px]:max-w-[980px]">
          <RevealItem idx={0}>
            <h2 className="font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
              What you learn stays with you.
            </h2>
          </RevealItem>
          <RevealItem idx={1}>
            <p className="mt-[var(--gap-title-sub-display)] max-w-[640px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
              Your intelligence carries every lesson forward — where you've been, where you are, and where you can go.
            </p>
          </RevealItem>
          {/* the Ignite trio — center-dominant, wings descending; each image
              captioned with its sentence */}
          <RevealItem idx={2}>
            <div className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-[0.6fr_1fr_0.6fr] sm:items-start sm:gap-6 lg:mt-20 lg:gap-8">
              {/* past — the left wing */}
              <figure className="m-0">
                <div className="overflow-hidden rounded-[30px] bg-[#f5f5f7] aspect-[15/11]">
                  <img src={moments[0].image} alt={moments[0].alt} loading="lazy" decoding="async" draggable="false" className="h-full w-full select-none object-cover" />
                </div>
                <figcaption className="mt-5 font-medium tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
                  {moments[0].label}
                </figcaption>
              </figure>
              {/* now — the dominant center, set slightly lower on Apple's diagonal */}
              <figure className="m-0 sm:mt-10">
                <div className="overflow-hidden rounded-[30px] bg-[#f5f5f7] aspect-square">
                  <img src={moments[1].image} alt={moments[1].alt} loading="lazy" decoding="async" draggable="false" className="h-full w-full select-none object-cover" />
                </div>
                <figcaption className="mt-5 font-medium tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
                  {moments[1].label}
                </figcaption>
              </figure>
              {/* next — the right wing, lowest on the diagonal */}
              <figure className="m-0 sm:mt-52">
                <div className="overflow-hidden rounded-[30px] bg-[#f5f5f7] aspect-[15/11]">
                  <img src={moments[2].image} alt={moments[2].alt} loading="lazy" decoding="async" draggable="false" className="h-full w-full select-none object-cover" />
                </div>
                <figcaption className="mt-5 font-medium tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
                  {moments[2].label}
                </figcaption>
              </figure>
            </div>
          </RevealItem>
          {/* the bookend — on the same left axis
          <RevealItem idx={3}>
            <p className="mt-16 font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.9vw,42px)] lg:mt-20" style={{ color: COLORS.ink }}>
              You keep your place.
            </p>
          </RevealItem> */}
        </div>
      </ScrollReveal>
    </section>
  );
}


/* ═══════════════════════ 09 · ACHIEVEMENT ═══════════════════════ */
const ACHIEVEMENT_IMAGE = [studentHeroContent, studentachivenment, studentbuild];

function StudentAchievementSection() {
  const { ref } = UseRevealOnce();
  const [active, setActive] = useState(0);

  return (
    <section ref={ref} data-section="09-achievement" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip]">
      <ScrollReveal>
        <div className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
          <RevealItem idx={0}>
            <p className="text-[15px] font-normal" style={{ color: COLORS.grey }}>Every step counts</p>
          </RevealItem>
          <RevealItem idx={1}>
            <h2 className="mt-[var(--gap-eyebrow-title-display)] font-semibold tracking-[-0.009em] leading-[1.08] text-[clamp(40px,4vw,48px)]" style={{ color: COLORS.ink }}>
              See what you can achieve.
            </h2>
          </RevealItem>
          <RevealItem idx={2}>
          <div className="mt-12 overflow-hidden rounded-[30px] bg-[#f5f5f7] lg:mt-16 lg:h-[784px]">
            <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-stretch">
              <ul className="flex flex-col px-6 py-6 lg:px-0 lg:py-0 lg:pl-[69px]">
                {ACHIEVEMENT_TABS.map((tab, i) => {
                  const isOpen = active === i;
                  return (
                    <li key={tab.title} className="border-t first:border-t-0 lg:first:border-t-0" style={{ borderColor: `${COLORS.ink}33` }}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setActive(i)}
                        className="flex w-full items-start justify-between gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f] focus-visible:ring-offset-4 lg:py-8"
                      >
                        <span className="font-semibold tracking-[-0.003em] leading-[1.14] text-[clamp(24px,2.2vw,28px)]" style={{ color: COLORS.ink }}>
                          {tab.title}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className={`mt-2 h-4 w-7 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          style={{ color: "#868689" }}
                          strokeWidth={2}
                        />
                      </button>
                      <div className={`grid transition-all duration-500 ease-google ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <p className="pb-8 font-normal tracking-[0] leading-[25px] text-[17px]" style={{ color: COLORS.ink }}>
                            {tab.copy}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="relative min-h-[360px] lg:min-h-0">
                <img
                  key={active}
                  src={ACHIEVEMENT_IMAGE[active]}
                  alt={ACHIEVEMENT_TABS[active].title}
                  loading="lazy"
                  decoding="async"
                  className="hero-fade-up absolute inset-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)] object-contain lg:inset-10 lg:h-[calc(100%-5rem)] lg:w-[calc(100%-5rem)]"
                />
              </div>
            </div>
          </div>
        </RevealItem>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 10 · JOURNEY FLOW ═══════════════════════ */




function StudentJourneyFlowSection() {
  const { ref } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];

  return (
    <section ref={ref} data-section="10-journey-flow" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        <RevealItem idx={0}>
          <p className="px-6 text-center text-[15px] font-normal" style={{ color: COLORS.grey }}>Your journey</p>
        </RevealItem>
        <RevealItem idx={1}>
          <h2 className="px-6 text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
            New stage.<br />Same intelligence.
          </h2>
        </RevealItem>
        <RevealItem idx={2}>
          <p className="mx-auto mt-[var(--gap-title-sub-display)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
            As your goals change, Visionary is the place to continue.
          </p>
        </RevealItem>

        {/* Breath 2 — cascade + closing column */}
        <RevealItem idx={3}>
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
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 11 · TRUST ═══════════════════════ */
const TRUST_CARDS = [
  { title: "Private by design.", copy: "We treat your personal information with care.", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Safe to grow with.", copy: "Built from the first question to what's next.", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Built responsibly.", copy: "Intelligence should help people, never work against them.", Icon: Scale, to: "/terms", link: "Read our commitments" },
];



function StudentTrustSection() {
  const { ref } = UseRevealOnce();

  return (
    <section ref={ref} data-section="11-trust" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        <RevealItem idx={0}>
          <p className="px-6 text-center text-[15px] font-normal" style={{ color: COLORS.grey }}>Trust and safety</p>
        </RevealItem>
        <RevealItem idx={1}>
          <h2 className="px-6 text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
            Your intelligence.
          </h2>
        </RevealItem>
        <RevealItem idx={2}>
          <p className="mx-auto mt-[var(--gap-title-sub-display)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
            Your questions, conversations, ideas, and progress are personal. Visionary keeps it that way.
          </p>
        </RevealItem>

        <RevealItem idx={3}>
        <div className="mx-auto mt-14 grid w-full max-w-[1200px] grid-cols-1 gap-6 px-6 lg:mt-20 lg:grid-cols-3 lg:px-6">
          {TRUST_CARDS.map((card) => (
            <article key={card.title} className="flex flex-col rounded-[28px] bg-[#f5f5f7] p-8 lg:p-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white" style={{ color: COLORS.blue }}>
                <card.Icon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h3 className="mt-10 font-semibold tracking-[-0.003em] leading-[1.1] text-[clamp(28px,2.4vw,34px)]" style={{ color: COLORS.ink }}>
                {card.title}
              </h3>
              {/* the card sub keeps a gap ratio-locked to its own fluid heading —
                  a fixed 16px over a clamp heading drifts on small screens */}
              <p className="font-normal tracking-[0] leading-[24px] text-[17px]" style={{ color: COLORS.grey, marginTop: "calc(clamp(28px, 2.4vw, 34px) * 0.47)" }}>
                {card.copy}
              </p>
              <Link to={card.to} className="mt-auto inline-flex items-center gap-1.5 pt-8 text-[17px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                {card.link}
                <ChevronIcon className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ 12 · CTA ═══════════════════════ */
/* The closer bookends the hero — the statement on the page's own white
   field, one Apple-black primary pill with the arrow, one quiet path. */

const StudentCTASection = React.memo(function StudentCTASection() {
  const { ref } = UseRevealOnce();
  return (
    <section ref={ref} data-section="12-cta" className="relative isolate bg-[#f5f5f7] px-6 py-24 lg:py-32 rounded-t-[32px]">
      <ScrollReveal>
        <div className="mx-auto max-w-[1500px] text-center">
          <RevealItem idx={0}>
            <p className="text-[15px] font-normal" style={{ color: COLORS.grey }}>
              Begin today
            </p>
          </RevealItem>
          <RevealItem idx={1}>
            <h2 className="mt-[var(--gap-eyebrow-title-display)] font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
              Your learning starts with where you are.
            </h2>
          </RevealItem>
        <RevealItem idx={2}>
        <p className="mx-auto mt-[var(--gap-title-sub-display)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Ask your first question. Start building from what you know.
        </p>
        </RevealItem>
        <RevealItem idx={3}>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#121317] px-7 font-medium tracking-[0.24px] text-[16px] text-white transition-all duration-200 hover:bg-[#2c2d31] hover:scale-[1.01] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]"
          >
            Get started
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]"
          >
            Talk to our team
            <ChevronIcon className="h-4 w-4" />
          </Link>
        </div>
        </RevealItem>
          <RevealItem idx={4}>
          <p className="mt-6 text-center font-normal tracking-[0.24px] text-[13px]" style={{ color: COLORS.grey }}>
            Free to start. Private by design.
          </p>
          </RevealItem>
        </div>
      </ScrollReveal>
    </section>
  );
});

/* ═══════════════════════ 13 · EXPLORE ═══════════════════════ */



function StudentExploreSection() {
  const { ref } = UseRevealOnce();
  const { trackRef, canNext, scrollByCard, update } = UseScrollTrack();

  return (
    <section ref={ref} data-section="13-explore" className="relative isolate py-16 lg:py-24 [overflow-x:clip] bg-white rounded-t-[32px]">
      <ScrollReveal>
        <RevealItem idx={0}>
          <p className="px-6 text-[15px] font-normal lg:pl-[6.5%] lg:pr-6" style={{ color: COLORS.grey }}>
            Keep exploring
          </p>
        </RevealItem>
        <RevealItem idx={1}>
        <h2 className="px-6 font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)] lg:pl-[6.5%] lg:pr-6" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Explore Visionary
        </h2>
        </RevealItem>
        <RevealItem idx={2}>
        <div className="relative mt-16 lg:mt-20">
          <div
            ref={trackRef}
            onScroll={update}
            className="flex snap-x snap-mandatory gap-8 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-12 lg:pl-[calc(6.5%_+_480px)] lg:pr-6"
          >
            {EXPLORE_CATEGORIES.map((c, index) => (
              <StudentExploreCard index={index} key={c.slug} category={c} images={EXPLORE_CAT_IMG} />
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
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function StudentPage() {
  /* the sheet-stack pin is retired here — the page scrolls as one plain
     document, every section in natural flow */
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <StudentHeroSection />
        <StudentStruggleSection />
        <StudentJourneySection />
        <StudentIntelligenceSection />
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
