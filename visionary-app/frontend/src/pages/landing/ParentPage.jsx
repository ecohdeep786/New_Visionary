import React, { useCallback, useState } from "react";
import { Lock, ShieldCheck, HeartHandshake } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import parentHero from "@/assets/parent-hero-main-2400w.webp";
import parentHeroContent from "@/assets/parent-hero-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
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
import parentachivenment from "@/assets/achievenment-achieve.webp";
import parentbuild from "@/assets/achivenment-build.webp";

/* Explore Category */
import studentmeet from "@/assets/student-hero-main-2400w.webp";
import teachermeet from "@/assets/teacher-face-main.webp";
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

import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, GraduationCap, Target, Brain } from "lucide-react";
import { color, fontStack } from "@/components/landing/system/tokens";

const EXPLORE_CAT_IMG = [studentmeet, teachermeet, promeet, orgmeet];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and build with confidence.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Plan lessons and see who needs support.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "professional", chip: "Professional", copy: "Turn what you learn into work you can use.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Help teams share context across projects.", alt: "Leader talking at an organization table" },
];

/* Design tokens come from system/tokens.js (the measured Apple-neutral
   system) — see APPLE_MEASURED_REFERENCE_2026-10-21.md. */

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

const JOURNEY_WORD_MS = 3000;

const JOURNEY_WORDS = [
  "moves with them.",
  "meets their questions.",
  "changes with their goals.",
  "grows with their understanding.",
  "opens what comes next.",
];

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

const INTELLIGENCE_STEPS = [
  { title: "What your child understood this week.", copy: "Not just what was covered. What actually made sense, in minutes." },
  { title: "Know where your child is stuck.", copy: "See the exact idea that stopped them before it becomes a grade." },
  { title: "See which way learning is moving.", copy: "Understand whether confidence is building or slipping, and what changed along the way." },
  { title: "You see more when everyone shares one view.", copy: "When you, your child, and the teacher share one view, support gets simple." },
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
  { hi: "Priya iss hafte physics mein kaisi rahi?", en: "How did Priya do in physics this week?", bn: "এই সপ্তাহে প্রিয়া পদার্থবিদ্যায় কেমন করল?", ta: "இந்த வாரம் இயற்பியலில் பிரியா எப்படி செய்தார்?", kn: "ಈ ವಾರ ಭೌತಶಾಸ್ತ್ರದಲ್ಲಿ ಪ್ರಿಯಾ ಹೇಗೆ ಮಾಡಿದಳು?", pa: "ਇਸ ਹਫ਼ਤੇ ਭੌਤਿਕ ਵਿਗਿਆਨ ਵਿੱਚ ਪ੍ਰਿਯਾ ਕਿਵੇਂ ਰਹੀ?" },
  { hi: "Homework mein main kaise madad karoon?", en: "How do I help with homework?", bn: "হোমওয়ার্কে আমি কীভাবে সাহায্য করব?", ta: "வீட்டுப் பாடத்தில் எப்படி உதவுவது?", kn: "ಮನೆಪಾಠದಲ್ಲಿ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡುವುದು?", pa: "ਹੋਮਵਰਕ ਵਿੱਚ ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?" },
  { hi: "Parent-teacher meeting se pehle kya jaanna chahiye?", en: "What should I know before the parent-teacher meeting?", bn: "অভিভাবক-শিক্ষক সভার আগে আমার কী জানা উচিত?", ta: "பெற்றோர்-ஆசிரியர் சந்திப்புக்கு முன் நான் என்ன அறிய வேண்டும்?", kn: "ಪೋಷಕ-ಶಿಕ್ಷಕ ಸಭೆಗೆ ಮೊದಲು ನಾನು ಏನು ತಿಳಿಯಬೇಕು?", pa: "ਮਾਪੇ-ਅਧਿਆਪਕ ਮੀਟਿੰਗ ਤੋਂ ਪਹਿਲਾਂ ਮੈਂ ਕੀ ਜਾਣਨਾ ਚਾਹੀਦਾ ਹੈ?" },
];

const ACHIEVEMENT_TABS = [
  { title: "Understand what your child is learning.", copy: "A clear picture of what shaped your child's week, no report card needed." },
  { title: "Support where they need it most.", copy: "Know when to help, how to explain, and when to step back." },
  { title: "Celebrate every step forward.", copy: "See the wins, and turn them into lasting confidence." },
];

const ACHIEVEMENT_IMAGE = [parentHeroContent, parentachivenment, parentbuild];

const TRUST_VALUES = [
  { title: "Privacy", copy: "We design every part of Visionary so that what your child shares stays personal.", Icon: Lock, to: "/privacy" },
  { title: "Safety", copy: "We keep Visionary safe to grow with — from the first question to what's next.", Icon: ShieldCheck, to: "/security" },
  { title: "Responsibility", copy: "We believe intelligence should help people learn, never work against them.", Icon: HeartHandshake, to: "/terms" },
];

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
        label="Parent concerns"
        kicker="What report cards miss"
        copy="Caring isn't the difficulty. Seeing it is."
      />
    </section>
  );
}

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

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
        <div className="mx-auto w-full px-6 min-[735px]:max-w-[692px] min-[735px]:px-0 min-[1069px]:max-w-[980px]">
          <h2
            className="font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)] text-balance"
            style={{ color: color.ink, maxWidth: "24ch" }}
          >
            <span className="block">Learning that</span>
            <span key={index} className="hero-fade-up accent-gradient block min-h-[1.06em] [animation-duration:1s]">{JOURNEY_WORDS[index]}</span>
          </h2>
          <p
            className="mt-4 max-w-[40ch] text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
            style={{ color: color.slate }}
          >
            Wherever your child begins, Visionary helps their learning move forward from there.
          </p>
        </div>
      </ScrollReveal>

      <JourneyGallery stages={JOURNEY_STAGES} onOpen={setOpenStage} label="Learning stages" iconMap={STAGE_META} />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Primary" secondaryLabel="Start as a parent" />}
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ParentPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <ParentHeroSection />
        <ParentStruggleSection />
        <ParentJourneySection />
        <PremiumIntelligenceSection
          steps={INTELLIGENCE_STEPS}
          sub="From the first question to the moment they can use what they've learned."
        />
        <PremiumLanguageSection
          chips={LANGUAGE_CHIPS}
          questions={LANGUAGE_QUESTIONS}
          line1="Your child's progress."
          accent="In your language"
          tail="."
          sub="Follow your child's journey in the language you think in."
        />
        <PremiumAchievementSection
          heading={<>See what your child can <span className="accent-gradient">achieve.</span></>}
          tabs={ACHIEVEMENT_TABS}
          images={ACHIEVEMENT_IMAGE}
        />
        <PremiumJourneyFlowSection
          stages={JOURNEY_STAGES}
          eyebrow="Your journey"
          heading={<>New stage.<br /><span className="accent-gradient">Same understanding.</span></>}
          sub="When the stage changes, your understanding comes with you."
        />
        <PremiumTrustSection
          heading={<>Your child's learning stays <span className="accent-gradient">theirs.</span></>}
          sub="Your child's questions, conversations, and progress are personal. We keep it that way."
          values={TRUST_VALUES}
        />
        <PremiumCTASection
          heading="Your child's journey is already happening."
          sub="See what they understand. Know where to help."
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
