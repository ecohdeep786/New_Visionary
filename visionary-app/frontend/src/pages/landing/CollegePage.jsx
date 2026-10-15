import React, { useCallback, useState } from "react";
import { Lock, ShieldCheck, HeartHandshake } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import proHero from "@/assets/pro-face-main-2400w.webp";
import proHeroContent from "@/assets/pro-face-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import PersonaHero from "@/components/landing/NewPersona";

/* Problem Section */
import proProblem1 from "@/assets/professional-problem-1-1600w.webp";
import proProblem2 from "@/assets/professional-problem-2-1600w.webp";
import proProblem3 from "@/assets/professional-problem-3-1600w.webp";
import proProblem4 from "@/assets/professional-problem-4-1600w.webp";

/* Journey / visuals pool */
import primaryStudent from "@/assets/student-primary.webp";
import secondaryStudent from "@/assets/student-secondary.webp";
import competitiveStudent from "@/assets/student-competitive.webp";
import higherStudent from "@/assets/student-higher.webp";
import vocationStudent from "@/assets/student-vocational.webp";

/* Achievement Section */
import achieveImg from "@/assets/achievenment-achieve.webp";
import buildImg from "@/assets/achivenment-build.webp";

/* Explore Category */
import studentmeet from "@/assets/student-hero-main-2400w.webp";
import teachermeet from "@/assets/teacher-face-main.webp";
import parentmeet from "@/assets/parent-face-main.webp";
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

import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain, Zap } from "lucide-react";
import { fontStack } from "@/components/landing/system/tokens";

const EXPLORE_CAT_IMG = [studentmeet, teachermeet, parentmeet, orgmeet];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Know how Visionary fits into your learning.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Know how Visionary fits into your classroom.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "Know how Visionary fits into your child's journey.", alt: "Parent helping a child at a desk" },
  { slug: "organization", chip: "Organization", copy: "Know how Visionary fits across your organization.", alt: "Leader talking at an organization table" },
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

const HERO_WORDS = ["Building.", "to apply.", "to grow."];
const HERO_WORD_MS = 2800;

const STRUGGLE_LINES = ["Every", "professional", "wonders", "about"];

const SLIDES = [
  { word: "Application", quote: "I took three courses. I still don't know how to use them at work.", image: proProblem1, alt: "Professional struggling to apply coursework at work" },
  { word: "Relevance", quote: "I read every article. The next project still feels like the first.", image: proProblem2, alt: "Professional overwhelmed by learning resources" },
  { word: "Growth", quote: "Five years in, and I can't show what I've actually learned.", image: proProblem3, alt: "Professional reflecting on career growth" },
  { word: "Focus", quote: "Between meetings and deadlines, learning keeps getting postponed.", image: proProblem4, alt: "Professional juggling work deadlines and learning" },
  { word: "Results", quote: "My team ships. I still don't know if we're building it right.", image: proProblem2, alt: "Professional uncertain about team output" },
];

const JOURNEY_WORD_MS = 3000;

const JOURNEY_WORDS = [
  "moves with your career.",
  "meets your challenges.",
  "grows with your goals.",
  "compounds with your skills.",
  "opens what comes next.",
];

const JOURNEY_STAGES = [
  { title: "Early Career", statement: "Turn every first role into real skill.", copy: "Turn every first project into real skill — not just another line on your resume.", image: secondaryStudent, alt: "Early career professional at work" },
  { title: "Mid-Level", statement: "Reason through the harder decisions.", copy: "When the questions get harder and the decisions matter more, Visionary helps you reason through them.", image: higherStudent, alt: "Mid-level professional solving problems" },
  { title: "Senior", statement: "Your judgment, sharpened.", copy: "Your judgment is your product. Visionary sharpens it by connecting what you've done to what comes next.", image: vocationStudent, alt: "Senior professional mentoring and leading" },
  { title: "Leadership", statement: "Lead with clear sight.", copy: "See what your team understands, where they're stuck, and what they're ready for.", image: competitiveStudent, alt: "Leader reviewing team progress" },
  { title: "Specialist", statement: "Go deep without losing context.", copy: "Go deep without losing context. Every paper, project, and problem builds on the last.", image: higherStudent, alt: "Specialist deep in their domain" },
  { title: "Entrepreneur", statement: "Ship ideas. Keep the lessons.", copy: "Turn ideas into shipped work — with intelligence that remembers every decision and every lesson.", image: primaryStudent, alt: "Entrepreneur building something real" },
];

const STAGE_META = {
  "Early Career": { Icon: GraduationCap },
  "Mid-Level": { Icon: BookOpen },
  "Senior": { Icon: Brain },
  "Leadership": { Icon: UsersRound },
  "Specialist": { Icon: Target },
  "Entrepreneur": { Icon: Zap },
};

const INTELLIGENCE_STEPS = [
  { title: "Understand the work before you do it.", copy: "Visionary reads the context, remembers what you've done before, and helps you reason through the problem — not just execute it." },
  { title: "Turn every project into a lesson.", copy: "Every decision, every failure, every shipped feature becomes part of what you understand next." },
  { title: "Carry your expertise across teams and tools.", copy: "Your knowledge shouldn't reset every time you switch projects, companies, or tech stacks. Visionary keeps the continuity." },
  { title: "Know what your work is actually building.", copy: "See whether your skills are compounding or stalling — and what the next meaningful step looks like." },
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
  { hi: "Iss project ka architecture kaise behtar karun?", en: "How do I improve the architecture of this project?", bn: "এই প্রজেক্টের আর্কিটেকচার কীভাবে উন্নত করব?", ta: "இந்த திட்டத்தின் கட்டமைப்பை எப்படி மேம்படுத்துவது?", kn: "ಈ ಯೋಜನೆಯ ವಾಸ್ತುಶಿಲ್ಪವನ್ನು ಹೇಗೆ ಸುಧಾರಿಸುವುದು?", pa: "ਇਸ ਪ੍ਰੋਜੈਕਟ ਦਾ ਆਰਕੀਟੈਕਚਰ ਕਿਵੇਂ ਬਿਹਤਰ ਬਣਾਵਾਂ?" },
  { hi: "Mera team is problem ko kaise solve kare?", en: "How should my team solve this problem?", bn: "আমার দল এই সমস্যা কীভাবে সমাধান করবে?", ta: "என் குழு இந்த பிரச்சினையை எப்படி தீர்க்க வேண்டும்?", kn: "ನನ್ನ ತಂಡ ಈ ಸಮಸ್ಯೆಯನ್ನು ಹೇಗೆ ಪರಿಹರಿಸಬೇಕು?", pa: "ਮੇਰੀ ਟੀਮ ਇਸ ਸਮੱਸਿਆ ਨੂੰ ਕਿਵੇਂ ਹੱਲ ਕਰੇ?" },
  { hi: "Next quarter ke liye main kaunsi skill seekhun?", en: "Which skill should I learn for next quarter?", bn: "পরবর্তী কোয়ার্টারের জন্য আমি কোন দক্ষতা শিখব?", ta: "அடுத்த காலாண்டிற்கு நான் எந்த திறனை கற்க வேண்டும்?", kn: "ಮುಂದಿನ ತ್ರೈಮಾಸಿಕಕ್ಕೆ ನಾನು ಯಾವ ಕೌಶಲ್ಯ ಕಲಿಯಬೇಕು?", pa: "ਅਗਲੀ ਤਿਮਾਹੀ ਲਈ ਮੈਂ ਕਿਹੜਾ ਹੁਨਰ ਸਿੱਖਾਂ?" },
];

const ACHIEVEMENT_TABS = [
  { title: "Understand the problems you're working on.", copy: "See every problem through the lens of what you've solved before — and what you still need to learn." },
  { title: "Solve with intelligence behind you.", copy: "Get past the stuck moment faster. Visionary surfaces the exact concept, example, or previous decision that unlocks the next step." },
  { title: "Build what you actually came to build.", copy: "Turn learning into shipped work — real projects, real products, real skills that compound over your career." },
];

const ACHIEVEMENT_IMAGE = [proHeroContent, achieveImg, buildImg];

const TRUST_VALUES = [
  { title: "Privacy", copy: "We design every part of Visionary so that your work — and what you share with it — stays personal.", Icon: Lock, to: "/privacy" },
  { title: "Safety", copy: "We keep Visionary safe to grow with — from the first project to what's next.", Icon: ShieldCheck, to: "/security" },
  { title: "Responsibility", copy: "We believe intelligence should help professionals work, never work against them.", Icon: HeartHandshake, to: "/terms" },
];

const JOURNEY_MODALS = {
  "Early Career": {
    top: "Turn first roles", accent: "into real skill.",
    intro: "Your first years set the pattern for everything after. Visionary turns every first project into understanding that compounds.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Learn on the job.", c: "Understand the code, the client, and the decision — not just the ticket.", l: "How it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise deliberately.", c: "Short, focused practice on the skills your work actually demands.", l: "Start practising free", to: "/register" },
      { Icon: Globe2, t: "In your language.", c: "Ask, reason, and learn in the language you think in.", l: "Language support", to: "/how-it-works" },
      { Icon: UsersRound, t: "Learn from your team.", c: "Bring what you learn back into the work you share with others.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Mid-Level": {
    top: "Reason through", accent: "the harder decisions.",
    intro: "The questions get harder and the decisions matter more. Visionary helps you reason through them with the full context of what you've done.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Brain, t: "Decisions with context.", c: "Every choice builds on what you've already solved.", l: "See how it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise what matters.", c: "Deepen the skills your next role will ask for.", l: "Start practising free", to: "/register" },
      { Icon: BookOpen, t: "Remember every project.", c: "Yesterday's work stays available for today's decision.", l: "Your continuity", to: "/how-it-works" },
      { Icon: MessageCircle, t: "When you're stuck.", c: "Clear explanations when the problem is unfamiliar.", l: "Get support", to: "/help" },
    ],
  },
  "Senior": {
    top: "Your judgment,", accent: "sharpened.",
    intro: "Your judgment is your product. Visionary sharpens it by connecting what you've done to what comes next.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See the pattern.", c: "Understand why past decisions worked, so new ones feel familiar.", l: "See how it works", to: "/how-it-works" },
      { Icon: BookOpen, t: "Learn from every call.", c: "Each decision becomes context for the next one.", l: "Your continuity", to: "/how-it-works" },
      { Icon: Layers3, t: "Mentor with clarity.", c: "Explain what you know to the people you're helping grow.", l: "Talk to us", to: "/contact" },
      { Icon: Clock, t: "Stay steady.", c: "Clear thinking when pressure is high and time is short.", l: "Get support", to: "/help" },
    ],
  },
  "Leadership": {
    top: "Lead with", accent: "clear sight.",
    intro: "Lead with clarity — see what your team understands, where they're stuck, and what they're ready for.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: UsersRound, t: "See your team.", c: "Understand where each person is and what they need next.", l: "For organizations", to: "/organization" },
      { Icon: BookOpen, t: "Keep the threads.", c: "Context carries across projects, quarters, and teams.", l: "Your continuity", to: "/how-it-works" },
      { Icon: Layers3, t: "Build on what you know.", c: "Turn your experience into strategy, process, and teaching.", l: "Start building free", to: "/register" },
      { Icon: Building2, t: "Bring it to your organization.", c: "Visionary can support teams, departments, and whole companies.", l: "For organizations", to: "/organization" },
    ],
  },
  "Specialist": {
    top: "Go deep", accent: "without losing context.",
    intro: "Every paper, project, and problem builds on the last. Visionary keeps the depth connected across your domain.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Understand at depth.", c: "Explanations that support serious domain work, not summaries.", l: "See how it works", to: "/how-it-works" },
      { Icon: BookOpen, t: "Research with context.", c: "Keep threads across papers, projects, and years.", l: "Your continuity", to: "/how-it-works" },
      { Icon: Target, t: "Practise the hard parts.", c: "Focus on the edge of your skill, where growth happens.", l: "Start practising free", to: "/register" },
      { Icon: Clock, t: "Learn at your pace.", c: "The experience adapts to your time, language, and depth.", l: "Get support", to: "/help" },
    ],
  },
  "Entrepreneur": {
    top: "Ship ideas.", accent: "Keep the lessons.",
    intro: "Turn ideas into shipped work — with intelligence that remembers every decision and every lesson.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Sparkles, t: "Start where you are.", c: "Visionary begins from your problem, not a curriculum.", l: "See how it works", to: "/how-it-works" },
      { Icon: Zap, t: "Move fast, understand deeply.", c: "Speed and depth together — decisions you can defend later.", l: "Start building free", to: "/register" },
      { Icon: BookOpen, t: "Every pivot teaches.", c: "What you learned in the last attempt carries into the next.", l: "Your continuity", to: "/how-it-works" },
      { Icon: UsersRound, t: "Find your people.", c: "Communities and partners help you build in real contexts.", l: "Find a partner", to: "/partners" },
    ],
  },
};

/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const ProHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Building, to apply, to grow."
    sub="Turn what you learn into work that ships — skills, solutions, and projects that compound with your career."
    img={proHero}
    alt="A professional writing notes beside a laptop"
    ctaLabel="Start building free"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */

function ProStruggleSection() {
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
        label="Career learning challenges"
        kicker="What work doesn't show"
        copy="Working isn't the difficulty. Showing it is."
      />
    </section>
  );
}

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

function ProJourneySection() {
  const { ref } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_WORDS.length, JOURNEY_WORD_MS);
  const [openStage, setOpenStage] = useState(null);

  return (
    <section ref={ref} data-section="04-journey" className="relative isolate overflow-hidden py-24 lg:py-32 bg-white">
      <ScrollReveal>
        {/* header — Apple's card-chapter treatment: statement LEFT-aligned at
            the measured gutter, and the gallery's track carries the same
            gutter so the first card starts exactly at the heading's left
            edge — one spine. */}
        <div className="mx-auto w-full px-6 min-[735px]:max-w-[692px] min-[735px]:px-0 min-[1069px]:max-w-[980px]">
          <h2
            className="font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)] text-balance"
            style={{ color: COLORS.ink, maxWidth: "24ch" }}
          >
            <span className="block">Work that</span>
            <span key={index} className="hero-fade-up accent-gradient block min-h-[1.06em] [animation-duration:1s]">{JOURNEY_WORDS[index]}</span>
          </h2>
          <p
            className="mt-4 max-w-[40ch] text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
            style={{ color: COLORS.grey }}
          >
            Wherever your career begins, Visionary helps your work move forward from there.
          </p>
        </div>
      </ScrollReveal>

      <JourneyGallery stages={JOURNEY_STAGES} onOpen={setOpenStage} label="Career stages" iconMap={STAGE_META} />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Early Career" secondaryLabel="Start free" />}
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function CollegePage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <ProHeroSection />
        <ProStruggleSection />
        <ProJourneySection />
        <PremiumIntelligenceSection
          steps={INTELLIGENCE_STEPS}
          sub="From the first problem to using what you know."
        />
        <PremiumLanguageSection
          chips={LANGUAGE_CHIPS}
          questions={LANGUAGE_QUESTIONS}
          eyebrow="Every language"
          line1="Your work."
          accent="In your language"
          tail="."
          sub="Think, ask, and solve in the language that feels natural to you."
        />
        <PremiumAchievementSection
          heading={<>See what you can <span className="accent-gradient">achieve.</span></>}
          tabs={ACHIEVEMENT_TABS}
          images={ACHIEVEMENT_IMAGE}
        />
        <PremiumJourneyFlowSection
          stages={JOURNEY_STAGES}
          eyebrow="Your journey"
          heading={<>New stage.<br /><span className="accent-gradient">Same work.</span></>}
          sub="When the stage changes, your work comes with you."
        />
        <PremiumTrustSection
          heading={<>Your work stays <span className="accent-gradient">yours.</span></>}
          sub="Your projects, ideas, and career decisions are personal. We keep it that way."
          values={TRUST_VALUES}
        />
        <PremiumCTASection
          heading="Your next project is already in front of you."
          sub="Understand it faster. Solve it with intelligence. Ship it and carry the lesson forward."
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
