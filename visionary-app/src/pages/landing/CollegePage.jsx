import React, { useCallback, useState } from "react";
import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import proHero from "@/assets/pro-face-main-2400w.webp";
import proHeroContent from "@/assets/pro-face-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import proProblem1 from "@/assets/professional-problem-1-1600w.webp";
import proProblem2 from "@/assets/professional-problem-2-1600w.webp";
import proProblem3 from "@/assets/professional-problem-3-1600w.webp";
import proProblem4 from "@/assets/professional-problem-4-1600w.webp";
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
 * Journey / visuals pool
 */
import primaryStudent from "@/assets/student-primary.webp";
import secondaryStudent from "@/assets/student-secondary.webp";
import competitiveStudent from "@/assets/student-competitive.webp";
import higherStudent from "@/assets/student-higher.webp";
import vocationStudent from "@/assets/student-vocational.webp";

/**
 * Achievement Section
 */
import achieveImg from "@/assets/achievenment-achieve.webp";
import buildImg from "@/assets/achivenment-build.webp";

/**
 * Explore Category
 */
import studentmeet from "@/assets/student-hero-main-2400w.webp";
import teachermeet from "@/assets/teacher-face-main.webp";
import parentmeet from "@/assets/parent-face-main.webp";
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

const EXPLORE_CAT_IMG = [studentmeet, teachermeet, parentmeet, orgmeet];

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

const HERO_WORDS = ["Building.", "to apply.", "to grow."];
const HERO_WORD_MS = 2800;

const STRUGGLE_LINES = ["Every","professional","wonders","about"];

const SLIDES = [
  { word: "application", quote: "I took three courses. I still don't know how to use them at work.", image: proProblem1, alt: "Professional struggling to apply coursework at work" },
  { word: "relevance", quote: "I read every article. The next project still feels like the first.", image: proProblem2, alt: "Professional overwhelmed by learning resources" },
  { word: "growth", quote: "Five years in, and I can't show what I've actually learned.", image: proProblem3, alt: "Professional reflecting on career growth" },
  { word: "focus", quote: "Between meetings and deadlines, learning keeps getting postponed.", image: proProblem4, alt: "Professional juggling work deadlines and learning" },
  { word: "results", quote: "My team ships. I still don't know if we're building it right.", image: proProblem2, alt: "Professional uncertain about team output" },
];

const CYCLE_MS = 4000;
const JOURNEY_WORD_MS = 3000;
const INTELLIGENCE_WORD_MS = 3000;
const KEEPS_WORD_MS = 2500;
const QUESTION_MS = 3200;
const CATEGORY_MS = 4200;

const JOURNEY_WORDS = [
  "moves with your career.",
  "meets your challenges.",
  "grows with your goals.",
  "builds on your skills.",
  "opens what comes next.",
];

const JOURNEY_STAGES = [
  { title: "Early career", copy: "Turn every first project into real skill, not just another line on your resume.", image: secondaryStudent, alt: "Early career professional at work" },
  { title: "Mid-Level", copy: "Harder questions, bigger decisions, reasoned through with you.", image: higherStudent, alt: "Mid-level professional solving problems" },
  { title: "Senior", copy: "Your judgement, sharpened by everything you've done.", image: vocationStudent, alt: "Senior professional mentoring and leading" },
  { title: "Leadership", copy: "See what your team understands and where they're stuck.", image: competitiveStudent, alt: "Leader reviewing team progress" },
  { title: "Specialist", copy: "Go deep. Every paper and project builds on the last.", image: higherStudent, alt: "Specialist deep in their domain" },
  { title: "Entrepreneur", copy: "Turn ideas into shipped work, with every lesson remembered.", image: primaryStudent, alt: "Entrepreneur building something real" },
];

const INTELLIGENCE_WORDS = ["Every project connected.", "Every skill connected.", "Every decision connected.", "Every idea connected."];

const INTELLIGENCE_STEPS = [
  { title: "Understand the work before you do it.", copy: "Visionary remembers what you've done and helps you reason through the problem." },
  { title: "Turn every project into a lesson.", copy: "Every decision and every failure becomes part of what you understand next." },
  { title: "Carry your expertise across teams and tools.", copy: "Your knowledge survives every project, company, and stack change." },
  { title: "Know what your work is actually building toward.", copy: "See whether your skills are growing, and what comes next." },
];

const KEEPS_WORDS = ["applying", "building", "solving"];

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

const CONTINUITY_STAGES = [
  { name: "New project", previous: "Last project", now: "Current problem", next: "Next decision" },
  { name: "Mid-Career", previous: "Early lessons", now: "Current work", next: "Next role" },
  { name: "Leadership", previous: "Your craft", now: "Your team", next: "Your vision" },
  { name: "Specialist", previous: "Foundations", now: "Your domain", next: "Your contribution" },
  { name: "Entrepreneur", previous: "Your ideas", now: "Your product", next: "Your company" },
  { name: "Career change", previous: "Your experience", now: "Your transition", next: "Your new path" },
];

const ACHIEVEMENT_TABS = [
  { black: "Understand", blue: "the problems you're working on.", copy: "Every problem, seen through what you've solved before." },
  { black: "Solve", blue: "with intelligence behind you.", copy: "Visionary finds the exact concept or decision that moves you forward." },
  { black: "Build", blue: "what you actually came here to build.", copy: "Turn learning into shipped work, skills that grow over your career." },
];

const JOURNEY_CATEGORIES = ["Early career", "Mid-Level", "Senior", "Leadership", "Specialist", "Entrepreneur", "Career change"];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and build with confidence.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "See who needs another explanation.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "See where your child needs support.", alt: "Parent helping a child at a desk" },
  { slug: "organization", chip: "Organization", copy: "Help teams carry knowledge forward.", alt: "Leader talking at an organization table" },
];

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */







/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const ProHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Learning, to apply what you learn."
    sub="Turn what you learn into work that ships."
    img={proHero}
    alt="A professional writing notes beside a laptop"
    ctaLabel="Start building free"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */










function ProStruggleSection() {
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
          <CarouselDots total={SLIDES.length} active={index} onSelect={goTo} label="Professional work challenges" />
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 03 · PROMISE ═══════════════════════ */

const ProPromiseSection = React.memo(function ProPromiseSection() {
  const { ref, visible } = UseRevealOnce();
  return (
    <section ref={ref} data-section="03-promise" className="sticky bottom-0 isolate overflow-hidden px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <h2
        className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        style={{ color: COLORS.ink }}
      >
        What if every skill you learned actually{" "}
        <span className="accent-gradient">made it into your work?</span>
      </h2>
    </section>
  );
});

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

/* Icons per journey stage — reuses icons already imported in this file */
const JOURNEY_STAGE_ICONS = {
  "Early career": Sparkles,
  "Mid-Level": BookOpen,
  "Senior": Brain,
  "Leadership": UsersRound,
  "Specialist": Target,
  "Entrepreneur": Zap,
  "Career change": RefreshCw,
};

const STAGE_META = {
  "Early career": { Icon: GraduationCap },
  "Mid-Level": { Icon: BookOpen },
  "Senior": { Icon: Brain },
  "Leadership": { Icon: UsersRound },
  "Specialist": { Icon: Target },
  "Entrepreneur": { Icon: Zap },
};

const JOURNEY_MODALS = {
  "Early career": {
    top: "Turn first roles", accent: "into real skill.",
    intro: "Your first years set the pattern for everything after. Visionary turns every first project into understanding that grows.",
    primary: { label: "See a work example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Learn on the job.", c: "Understand the code, the client, and the decision, not just the ticket.", l: "How it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise deliberately.", c: "Short, focused practice on the skills your work actually demands.", l: "Start practising free", to: "/register" },
      { Icon: Globe2, t: "In your language.", c: "Ask, reason, and learn in the language you think in.", l: "Language support", to: "/how-it-works" },
      { Icon: UsersRound, t: "Learn from your team.", c: "Bring what you learn back into the work you share with others.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Mid-Level": {
    top: "Reason through", accent: "the harder decisions.",
    intro: "The questions get harder and the decisions matter more. Visionary helps you reason through them with the full context of what you've done.",
    primary: { label: "See a work example", to: "/how-it-works" },
    blocks: [
      { Icon: Brain, t: "Decisions with context.", c: "Every choice builds on what you've already solved.", l: "See how it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise what matters.", c: "Deepen the skills your next role will ask for.", l: "Start practising free", to: "/register" },
      { Icon: BookOpen, t: "Remember every project.", c: "Yesterday's work stays available for today's decision.", l: "Keep the context", to: "/how-it-works" },
      { Icon: MessageCircle, t: "When you're stuck.", c: "Clear explanations when the problem is unfamiliar.", l: "Get support", to: "/help" },
    ],
  },
  "Senior": {
    top: "Your judgement,", accent: "sharpened.",
    intro: "Your judgement is your product. Visionary sharpens it by connecting what you've done to what comes next.",
    primary: { label: "See a work example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See the pattern.", c: "Understand why past decisions worked, so new ones feel familiar.", l: "See how it works", to: "/how-it-works" },
      { Icon: BookOpen, t: "Learn from every call.", c: "Each decision becomes context for the next one.", l: "Keep the context", to: "/how-it-works" },
      { Icon: Layers3, t: "Mentor with clarity.", c: "Explain what you know to the people you're helping grow.", l: "Talk to us", to: "/contact" },
      { Icon: Clock, t: "Stay steady.", c: "Clear thinking when pressure is high and time is short.", l: "Get support", to: "/help" },
    ],
  },
  "Leadership": {
    top: "Lead with", accent: "clear sight.",
    intro: "Lead with clarity: see what your team understands, where they're stuck, and what they're ready for.",
    primary: { label: "See a work example", to: "/how-it-works" },
    blocks: [
      { Icon: UsersRound, t: "See your team.", c: "Understand where each person is and what they need next.", l: "For organizations", to: "/organization" },
      { Icon: BookOpen, t: "Keep the threads.", c: "Context carries across projects, quarters, and teams.", l: "Keep the context", to: "/how-it-works" },
      { Icon: Layers3, t: "Build on what you know.", c: "Turn your experience into strategy, process, and teaching.", l: "Start building free", to: "/register" },
      { Icon: Building2, t: "Bring it to your organization.", c: "Visionary can support teams, departments, and whole companies.", l: "For organizations", to: "/organization" },
    ],
  },
  "Specialist": {
    top: "Go deep", accent: "without losing context.",
    intro: "Every paper, project, and problem builds on the last. Visionary keeps the depth connected across your domain.",
    primary: { label: "See a work example", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Understand at depth.", c: "Explanations that support serious domain work, not summaries.", l: "See how it works", to: "/how-it-works" },
      { Icon: BookOpen, t: "Research with context.", c: "Keep threads across papers, projects, and years.", l: "Keep the context", to: "/how-it-works" },
      { Icon: Target, t: "Practise the hard parts.", c: "Focus on the edge of your skill, where growth happens.", l: "Start practising free", to: "/register" },
      { Icon: Clock, t: "Learn at your pace.", c: "The experience adapts to your time, language, and depth.", l: "Get support", to: "/help" },
    ],
  },
  "Entrepreneur": {
    top: "Ship ideas.", accent: "Keep the lessons.",
    intro: "Turn ideas into shipped work, with intelligence that remembers every decision and every lesson.",
    primary: { label: "See a work example", to: "/how-it-works" },
    blocks: [
      { Icon: Sparkles, t: "Start where you are.", c: "Visionary begins from your problem, not a curriculum.", l: "See how it works", to: "/how-it-works" },
      { Icon: Zap, t: "Move fast, understand deeply.", c: "Speed and depth together, decisions you can defend later.", l: "Start building free", to: "/register" },
      { Icon: BookOpen, t: "Every pivot teaches.", c: "What you learned in the last attempt carries into the next.", l: "Keep the context", to: "/how-it-works" },
      { Icon: UsersRound, t: "Find your people.", c: "Communities and partners help you build in real contexts.", l: "Find a partner", to: "/partners" },
    ],
  },
};





function ProJourneySection() {
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
    <section ref={ref} data-section="04-journey" className="sticky bottom-0 isolate overflow-hidden py-24 lg:py-32 bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
        {/* header — eyebrow / heading / one-line sub */}
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.ink }}>
          Your career, your journey
        </p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          What happens when work
          <br className="hidden md:block" />{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{JOURNEY_WORDS[index]}</span>
        </h2>
        <p
          className="mx-auto mt-6 w-full max-w-[900px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]"
          style={{ color: COLORS.grey }}
        >
          Wherever your career begins, Visionary helps your work move forward from there.
        </p>

        {/* stage rail — even beat under the header */}
        <div className="mt-14 px-6 lg:mt-20">
          <div className="flex gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:justify-center lg:gap-4 lg:overflow-visible lg:py-0" role="group" aria-label="Career stages">
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
                    : { backgroundColor: "#ffffff", borderColor: `${COLORS.ink}26`, color: COLORS.grey }}
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
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Early career" secondaryLabel="Start free" />}
    </section>
  );
}

/* ═══════════════════════ 05 · INTELLIGENCE ═══════════════════════ */



const INTELLIGENCE_STEP_IMG = [problemunderstanding, problemrevision, problempractice, problemexam];



function ProIntelligenceSection() {
  const { ref: headRef, visible } = UseRevealOnce();
  const { index: wordIndex } = UseCycleIndex(INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);
  const { active, setStepRef } = UseActiveStep(INTELLIGENCE_STEPS.length);
  const current = INTELLIGENCE_STEPS[active];

  return (
    <section ref={headRef} data-section="05-intelligence" className="sticky bottom-0 isolate [overflow-x:clip] bg-white rounded-t-[32px]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible} className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          The intelligence behind your work
        </p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
            {INTELLIGENCE_WORDS[wordIndex]}
          </span>
        </h2>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          From today's problem to the skills that define your career.
        </p>
      </FadeReveal>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-20 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-2rem)] items-center">
            <IntelligenceCopy step={current} />
          </div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {INTELLIGENCE_STEPS.map((s, i) => (
            <div key={s.title}>
              <IntelligenceVisual step={s} index={i} setStepRef={setStepRef} image={INTELLIGENCE_STEP_IMG[i % INTELLIGENCE_STEP_IMG.length]} />
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

const ProClosingSection = React.memo(function ProClosingSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(KEEPS_WORDS.length, KEEPS_WORD_MS);
  return (
    <section ref={ref} data-section="06-closing" className="sticky bottom-0 isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <p
        className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        style={{ color: COLORS.ink }}
      >
        Visionary keeps{" "}
        <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
          {KEEPS_WORDS[index]}
        </span>{" "}
        with you until every skill grows into the work you came here to do.
      </p>
    </section>
  );
});

/* ═══════════════════════ 07 · LANGUAGE ═══════════════════════ */



function ProLanguageSection() {
  const { ref, visible } = UseRevealOnce();
  const [lang, setLang] = useState("en");
  const { index } = UseCycleIndex(LANGUAGE_QUESTIONS.length, QUESTION_MS);
  const question = LANGUAGE_QUESTIONS[index][lang];
  const activeLabel = LANGUAGE_CHIPS.find((c) => c.code === lang)?.label || lang;

  return (
    <section ref={ref} data-section="07-language" className="sticky bottom-0 isolate px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <FadeReveal visible={visible}>
        {/* header unit — tight */}
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Every language</p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your work.<br />In your language.
        </h2>
        <p className="mx-auto max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          Think, ask, and solve in the language you think in.
        </p>

        {/* Breath 1 — control first */}
        <div className="mt-14 lg:mt-20">
          <LanguageChips active={lang} onSelect={setLang} chips={LANGUAGE_CHIPS} />
        </div>

        {/* Breath 2 — FLAT Google voice surface: no card, no border, type on the page */}
        <div className="mx-auto mt-16 w-full max-w-[860px] lg:mt-24">
          {/* Assistant-signature four-bar voice indicator */}
          <div className="flex items-end justify-center gap-2" aria-hidden="true">
            {["#4285F4", "#EA4335", "#FBBC05", "#34A853"].map((c, i) => (
              <span
                key={i}
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



function ProContinuitySection() {
  const { ref, visible } = UseRevealOnce();
  const { index, goTo, step } = UseStageIndex(CONTINUITY_STAGES.length);
  const stage = CONTINUITY_STAGES[index];

  return (
    <section ref={ref} data-section="08-continuity" className="sticky bottom-0 isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          Keep the context
        </p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          What you build stays with you.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[700px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          What you ship and what you learn becomes part of what comes next.
        </p>
        <div className="mt-14 flex justify-center lg:mt-20">
          <StageDropdown stages={CONTINUITY_STAGES} active={index} onSelect={goTo} />
        </div>
        <div className="mt-14 grid grid-cols-1 gap-16 px-6 lg:mt-20 lg:grid-cols-3 lg:gap-12 lg:px-0">
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Previous" caption="What you learned" text={stage.previous} imgClass="lg:h-[400px]" className="lg:-ml-[6vw]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Now" caption="What you're building" text={stage.now} imgClass="lg:h-[600px]" className="lg:mt-[100px]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Next" caption="Where you're heading" text={stage.next} imgClass="lg:h-[370px]" className="lg:-mr-[6vw] lg:mt-[20px]" />
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
          Your work keeps its place.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 09 · ACHIEVEMENT ═══════════════════════ */

const ACHIEVEMENT_IMAGE = [proHeroContent, achieveImg, buildImg];

/* icon per achievement tab — reuses icons already imported in this file */
const ACHIEVEMENT_META = [
  { Icon: Eye },      /* Understand */
  { Icon: Target },   /* Solve */
  { Icon: Layers3 },  /* Build */
];



function ProAchievementSection() {
  const { ref, visible } = UseRevealOnce();
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState(0);

  const toggle = useCallback((i) => {
    const next = open === i ? (i === 0 ? 1 : i - 1) : i;
    setOpen(next);
    setActive(next);
  }, [open]);

  return (
    <section ref={ref} data-section="09-achievement" className="sticky bottom-0 isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Your achievement</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>See what you can achieve.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Turn understanding into shipped work and a career that grows.
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



function ProJourneyFlowSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];

  return (
    <section ref={ref} data-section="10-journey-flow" className="sticky bottom-0 isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your work changes.<br />Your intelligence grows with you.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          As your role and goals evolve, Visionary is the place to continue.
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
              Wherever your career goes, your intelligence travels with you.
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
const TRUST_WORDS = ["work.", "ideas.", "career."];
const TRUST_WORD_MS = 6000;

const TRUST_CARDS = [
  { title: "Private by design.", copy: "Your work. Your ideas. Treated with care.", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Safe to grow with.", copy: "Built from the first project to what's next.", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Built responsibly.", copy: "Intelligence should help people, never work against them.", Icon: Scale, to: "/terms", link: "Read our commitments" },
];



function ProTrustSection() {
  const { ref, visible } = UseRevealOnce();
  const { index, goTo } = UseCycleIndex(TRUST_CARDS.length, TRUST_WORD_MS);
  const active = TRUST_CARDS[index];
  const next = TRUST_CARDS[(index + 1) % TRUST_CARDS.length];
  const stepCards = useCallback((d) => goTo(index + d), [goTo, index]);

  return (
    <section ref={ref} data-section="11-trust" className="sticky bottom-0 isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Trust and safety</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{TRUST_WORDS[index]}</span>
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Your projects, ideas, and career decisions are personal. Visionary keeps it that way.
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

const ProCTASection = React.memo(function ProCTASection() {
  const { ref, visible } = UseRevealOnce();
  return (
    <section ref={ref} data-section="12-cta" className="sticky bottom-0 isolate px-6 py-24 lg:py-32 rounded-t-[32px]" style={{ backgroundImage: "linear-gradient(180deg, #d9e6fd 0%, #e8f0fe 48%, #f5f9ff 100%)" }}>
      <div
        className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      >
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          Begin today
        </p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your next project is already in front of you.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Understand it faster. Solve it with intelligence. Ship it and carry the lesson forward.
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



function ProExploreSection() {
  const { ref, visible } = UseRevealOnce();
  const { trackRef, canNext, scrollByCard, update } = UseScrollTrack();

  return (
    <section ref={ref} data-section="13-explore" className="sticky bottom-0 isolate py-16 lg:py-24 [overflow-x:clip] bg-white rounded-t-[32px]">
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

export default function ProfessionalPage() {
  useSheetStack();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <ProHeroSection />
        <ProStruggleSection />
        <ProPromiseSection />
        <ProJourneySection />
        <ProIntelligenceSection />
        <ProClosingSection />
        <ProLanguageSection />
        <ProContinuitySection />
        <ProAchievementSection />
        <ProJourneyFlowSection />
        <ProTrustSection />
        <ProCTASection />
        <ProExploreSection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
