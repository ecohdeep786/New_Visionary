import React, { useCallback, useState } from "react";
import { Lock, ShieldCheck, HeartHandshake } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import studentHero from "@/assets/student-hero-main-2400w.webp";
import studentHeroContent from "@/assets/student-hero-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import PersonaHero from "@/components/landing/NewPersona";

/* Problem Section */
import problemexam from "@/assets/problem-exam.webp";
import problempractice from "@/assets/problem-practice.webp";
import problemrevision from "@/assets/problem-revision.webp";
import problemunderstanding from "@/assets/problem-understanding.webp";

/* Our Journey Section */
import primaryStudent from "@/assets/student-primary.webp";
import secondaryStudent from "@/assets/student-secondary.webp";
import competitiveStudent from "@/assets/student-competitive.webp";
import higherStudent from "@/assets/student-higher.webp";
import vocationStudent from "@/assets/student-vocational.webp";

/* Achievement Section */
import studentachivenment from "@/assets/achievenment-achieve.webp";
import studentbuild from "@/assets/achivenment-build.webp";

/* Explore Category */
import teachermeet from "@/assets/teacher-hero-main-2400w.webp";
import parentmeet from "@/assets/parent-hero-main-2400w.webp";
import promeet from "@/assets/pro-face-main-2400w.webp";
import orgmeet from "@/assets/org-face-main-2400w.webp";
import { useCycleIndex as UseCycleIndex, useRevealOnce as UseRevealOnce, useRevealContinuous as UseRevealContinuous } from "@/components/landing/system/hooks";
import {
  StruggleChapter,
  JourneyGallery,
  JourneyModal,
  ScrollReveal,
} from "@/components/landing/persona/PersonaSections";
import {
  PremiumIntelligenceSection,
  PremiumLanguageSection,
  PremiumAchievementSection,
  PremiumJourneyFlowSection,
  PremiumTrustSection,
  PremiumCTASection,
  PremiumExploreSection,
} from "@/components/landing/persona/PremiumPersonaSections";

import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain } from "lucide-react";
import { fontStack } from "@/components/landing/system/tokens";

const EXPLORE_CAT_IMG = [teachermeet, parentmeet, promeet, orgmeet];

const EXPLORE_CATEGORIES = [
  { slug: "teacher", chip: "Teacher", copy: "See who needs another explanation.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "See where your child needs support.", alt: "Parents helping students at a classroom desk" },
  { slug: "professional", chip: "Professional", copy: "Turn what you know into useful work.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Help teams carry knowledge forward.", alt: "Leader talking at an organization table" },
];

/* ── DESIGN TOKENS ── */
const COLORS = {
  ink: "#1d1d1f",
  surface: "#F5F6F8",
  blue: "#0066cc",
  grey: "#6e6e73",
  lightGrey: "#86868b",
  chipBg: "#rgba(0,102,204,0.10)",
  mist: "#d2d2d7",
  white: "#ffffff",
  cardSurface: "#EEF1F6",
  cardSurfaceAlt: "#E9EFFA",
};

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

const JOURNEY_WORD_MS = 3000;

const JOURNEY_WORDS = [
  "moves with \nyou.",
  "meets your questions.",
  "changes with your goals.",
  "grows with your understanding.",
  "opens what comes next.",
];

const JOURNEY_STAGES = [
  { title: "Primary", statement: "Build the basics. Build them right.", copy: "From your first questions to the ideas you're ready to explore next.", image: primaryStudent, alt: "Young student drawing on a tablet" },
  { title: "Secondary and higher secondary", statement: "One place for every subject.", copy: "When lessons get difficult, understanding keeps up through every chapter and every exam.", image: secondaryStudent, alt: "Teenager working on a laptop in a library" },
  { title: "Competitive exams", statement: "Prepare for the exam. Not just the syllabus.", copy: "Strengthen the reasoning you need when the question changes.", image: competitiveStudent, alt: "Aspirant solving a mock test beside prep books" },
  { title: "Vocational and skills", statement: "Learn by doing. Skills that work.", copy: "Practice, projects, and skills you can take into the real world.", image: vocationStudent, alt: "Student practising hands-on in a workshop" },
  { title: "Higher education", statement: "Go deeper. Build further.", copy: "Turn what you know into research, projects, and new ideas.", image: higherStudent, alt: "University student reviewing research papers" },
  { title: "Learning on your own", statement: "Your pace. Your path.", copy: "Start with what you want to understand. The path takes shape from there.", image: higherStudent, alt: "Adult learning independently at home" },
];

const STAGE_META = {
  "Primary": { Icon: GraduationCap },
  "Secondary and higher secondary": { Icon: BookOpen },
  "Competitive exams": { Icon: Target },
  "Vocational and skills": { Icon: Layers3 },
  "Higher education": { Icon: Brain },
  "Learning on your own": { Icon: Sparkles },
};

const INTELLIGENCE_STEPS = [
  { title: "Understand what you're learning.", copy: "Visionary continues from where you are, and every lesson becomes understanding." },
  { title: "See it. Hear it.\nAsk it another way.", copy: "Open today's lesson. Visionary already understands where you are and where you're going next." },
  { title: "Practice what you're learning.", copy: "Every answer becomes a chance to practise, with feedback that listens and adapts at your pace." },
  { title: "Build from what you know.", copy: "Turn every lesson into real thinking, projects, and creative work that keeps growing with you." },
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
  { title: "Understand what matters.", copy: "Get a clear picture of the subjects and skills that matter today." },
  { title: "Achieve what you're working toward.", copy: "Set your goal and keep moving, with support that adapts to you." },
  { title: "Build something from what you know.", copy: "Turn what you know into real projects, real skills, and real work." },
];

const ACHIEVEMENT_IMAGE = [studentHeroContent, studentachivenment, studentbuild];

const TRUST_VALUES = [
  { title: "Privacy", copy: "We design every part of Visionary so that what you share stays personal.", Icon: Lock, to: "/privacy" },
  { title: "Safety", copy: "We keep Visionary safe to grow with — from the first question to what's next.", Icon: ShieldCheck, to: "/security" },
  { title: "Responsibility", copy: "We believe intelligence should help people learn, never work against them.", Icon: HeartHandshake, to: "/terms" },
];

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
          <h2
            className="font-semibold tracking-[-0.009em] leading-[1.0625] text-[clamp(40px,5vw,64px)] text-balance"
            style={{ color: COLORS.ink, maxWidth: "24ch" }}
          >
            <span className="block">Learning that</span>
            <span key={index} className="hero-fade-up accent-gradient block min-h-[1.06em] [animation-duration:1s]">{JOURNEY_WORDS[index]}</span>
          </h2>
          <p
            className="mt-4 max-w-[40ch] text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
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

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function StudentPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <StudentHeroSection />
        <StudentStruggleSection />
        <StudentJourneySection />
        <PremiumIntelligenceSection
          steps={INTELLIGENCE_STEPS}
          sub="From the first question to using what you know."
        />
        <PremiumLanguageSection
          chips={LANGUAGE_CHIPS}
          questions={LANGUAGE_QUESTIONS}
          line1="The words change."
          accent="Understanding"
          tail=" doesn't."
          sub="Ask in the language you think in. The understanding that comes back is the same."
        />
        <PremiumAchievementSection
          heading={<>See what you can <span className="accent-gradient">achieve.</span></>}
          tabs={ACHIEVEMENT_TABS}
          images={ACHIEVEMENT_IMAGE}
        />
        <PremiumJourneyFlowSection
          stages={JOURNEY_STAGES}
          eyebrow="Your journey"
          heading={<>New stage.<br /><span className="accent-gradient">Same intelligence.</span></>}
          sub="When the stage changes, your intelligence comes with you."
        />
        <PremiumTrustSection
          heading={<>Your intelligence stays <span className="accent-gradient">yours.</span></>}
          sub="Your questions, conversations, ideas, and progress are personal. We keep it that way."
          values={TRUST_VALUES}
        />
        <PremiumCTASection
          heading="Your learning starts with where you are."
          sub="Ask your first question. Start building from what you know."
        />
        <PremiumExploreSection
          heading={<>Explore <span className="accent-gradient">Visionary.</span></>}
          categories={EXPLORE_CATEGORIES}
          images={EXPLORE_CAT_IMG}
        />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
