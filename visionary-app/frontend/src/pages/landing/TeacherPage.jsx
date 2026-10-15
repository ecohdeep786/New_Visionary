import React, { useCallback, useState } from "react";
import { Lock, ShieldCheck, HeartHandshake } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import teacherHero from "@/assets/teacher-hero-main-2400w.webp";
import teacherHeroContent from "@/assets/teacher-hero-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import PersonaHero from "@/components/landing/NewPersona";

/* Problem Section */
import teacherProblem1 from "@/assets/teacher-problem-1.webp";
import teacherProblem2 from "@/assets/teacher-problem-2.webp";
import teacherProblem3 from "@/assets/teacher-problem-3.webp";
import teacherProblem4 from "@/assets/teacher-problem-4.webp";

/* Our Journey Section */
import primaryStudent from "@/assets/student-primary.webp";
import secondaryStudent from "@/assets/student-secondary.webp";
import competitiveStudent from "@/assets/student-competitive.webp";
import higherStudent from "@/assets/student-higher.webp";
import vocationStudent from "@/assets/student-vocational.webp";

/* Achievement Section */
import teacherachivenment from "@/assets/achievenment-achieve.webp";
import teacherbuild from "@/assets/achivenment-build.webp";

/* Explore Category */
import studentmeet from "@/assets/student-face-main.webp";
import parentmeet from "@/assets/parent-face-main.webp";
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

import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, Target, Brain, TrendingUp } from "lucide-react";
import { fontStack } from "@/components/landing/system/tokens";

const EXPLORE_CAT_IMG = [studentmeet, parentmeet, promeet, orgmeet];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and keep your place.", alt: "Student learning with a laptop" },
  { slug: "parent", chip: "Parent", copy: "See progress clearly and know when to help.", alt: "Parents helping students at a classroom desk" },
  { slug: "professional", chip: "Professional", copy: "Turn what you learn into work you can use.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Help teams share context across projects.", alt: "Leader talking at an organization table" },
];

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

/* ═══════════════════════ MODELS ═══════════════════════ */

const HERO_WORDS = ["Teaching.", "to grow.", "to reach."];
const HERO_WORD_MS = 2800;

const STRUGGLE_LINES = ["Every","teacher","wonders","about"];

const SLIDES = [
  { word: "understanding", quote: "I taught the whole class. Half of them still left lost.", image: teacherProblem1, alt: "Teacher looking overwhelmed after class" },
  { word: "engagement", quote: "I can see the eyes glaze over. I just don't know whose.", image: teacherProblem2, alt: "Teacher puzzled by disengaged students" },
  { word: "pace", quote: "I finish the syllabus. I never finish the learning.", image: teacherProblem3, alt: "Teacher stressed about lesson pacing" },
  { word: "practice", quote: "They copy the steps. They can't start the problem alone.", image: teacherProblem4, alt: "Teacher reviewing student practice work" },
  { word: "results", quote: "The exam shows the gap I never saw coming.", image: teacherProblem2, alt: "Teacher searching for the gap in exam results" },
];

const JOURNEY_WORD_MS = 3000;
const QUESTION_MS = 3200;

const JOURNEY_WORDS = [
  "moves with your class.",
  "meets your questions.",
  "changes with your goals.",
  "grows with your learners.",
  "opens what comes next.",
];

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

const INTELLIGENCE_STEPS = [
  { title: "Understand what your class is learning.", copy: "Visionary continues from where your class is, so every lesson builds on the last." },
  { title: "Show it, hear it, teach it another way.", copy: "When a concept doesn't land, you get the visual, the explanation, the example." },
  { title: "Know who's with you before the exam.", copy: "See who got it, who didn't, and what to change next period." },
  { title: "Learn what your teaching demands next.", copy: "New syllabus, new subject: your preparation keeps pace with your classroom." },
];

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

const ACHIEVEMENT_TABS = [
  { title: "Understand your classroom.", copy: "A clear picture of the learners and gaps that shape your classroom." },
  { title: "Achieve what you're teaching toward.", copy: "Set your goal and keep every learner moving toward it." },
  { title: "Build from what you teach.", copy: "Turn what you teach into projects and skills that grow with your students." },
];

const ACHIEVEMENT_IMAGE = [teacherHeroContent, teacherachivenment, teacherbuild];

const TRUST_VALUES = [
  { title: "Privacy", copy: "We design every part of Visionary so that what you and your class share stays personal.", Icon: Lock, to: "/privacy" },
  { title: "Safety", copy: "We keep Visionary safe to grow with — from the first question to what's next.", Icon: ShieldCheck, to: "/security" },
  { title: "Responsibility", copy: "We believe intelligence should help people learn, never work against them.", Icon: HeartHandshake, to: "/terms" },
];

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

/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const TeacherHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Teaching, to grow, to reach."
    sub="One class, many minds. See who is with you before the next bell."
    img={teacherHero}
    alt="A teacher presenting at a whiteboard"
    ctaLabel="Start teaching free"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */

function TeacherStruggleSection() {
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
        label="Teacher challenges"
        kicker="What the classroom hides"
        copy="Teaching isn't the difficulty. Knowing it landed is."
      />
    </section>
  );
}

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

function TeacherJourneySection() {
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
            style={{ color: COLORS.ink, maxWidth: "24ch" }}
          >
            <span className="block">Teaching that</span>
            <span key={index} className="hero-fade-up accent-gradient block min-h-[1.06em] [animation-duration:1s]">{JOURNEY_WORDS[index]}</span>
          </h2>
          <p
            className="mt-4 max-w-[40ch] text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
            style={{ color: COLORS.grey }}
          >
            Wherever your class begins, Visionary helps your teaching move forward from there.
          </p>
        </div>
      </ScrollReveal>

      <JourneyGallery stages={JOURNEY_STAGES} onOpen={setOpenStage} label="Teaching stages" iconMap={STAGE_META} />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Lesson planning" secondaryLabel="Start free" />}
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function TeacherPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <TeacherHeroSection />
        <TeacherStruggleSection />
        <TeacherJourneySection />
        <PremiumIntelligenceSection
          steps={INTELLIGENCE_STEPS}
          sub="For you and your class, from first question to real understanding."
        />
        <PremiumLanguageSection
          chips={LANGUAGE_CHIPS}
          questions={TEACHER_LANGUAGE_QUESTIONS}
          line1="Teach your way."
          accent="Explain"
          tail=" your way."
          sub="Plan, teach, and adapt in the language you think in."
        />
        <PremiumAchievementSection
          heading={<>See what your class can <span className="accent-gradient">achieve.</span></>}
          tabs={ACHIEVEMENT_TABS}
          images={ACHIEVEMENT_IMAGE}
        />
        <PremiumJourneyFlowSection
          stages={JOURNEY_STAGES}
          eyebrow="Your journey"
          heading={<>New stage.<br /><span className="accent-gradient">Same teaching.</span></>}
          sub="When the stage changes, your teaching comes with you."
        />
        <PremiumTrustSection
          heading={<>Your teaching stays <span className="accent-gradient">yours.</span></>}
          sub="Your classes, conversations, ideas, and progress are personal. We keep it that way."
          values={TRUST_VALUES}
        />
        <PremiumCTASection
          heading="Your teaching starts with where your class is."
          sub="See who understands. Adapt the next lesson."
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
