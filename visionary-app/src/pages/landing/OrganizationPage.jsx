import React, { useCallback, useState } from "react";
import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import orgHero from "@/assets/org-face-main-2400w.webp";
import orgHeroContent from "@/assets/org-face-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import orgProblem1 from "@/assets/organization-problem-1-1600w.webp";
import orgProblem2 from "@/assets/organization-problem-2-1600w.webp";
import orgProblem3 from "@/assets/organization-problem-3-1600w.webp";
import orgProblem4 from "@/assets/organization-problem-4-1600w.webp";
import orgProblem5 from "@/assets/organization-problem-5-1600w.webp";
import PersonaHero from "@/components/landing/NewPersona";
import useSheetStack from "@/components/landing/system/useSheetStack";
import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";

/**
 * Problem Section
 */

/**
 * Journey Section images (local)
 */
import primaryStudent from "@/assets/student-primary.webp";
import secondaryStudent from "@/assets/student-secondary.webp";
import competitiveStudent from "@/assets/student-competitive.webp";
import higherStudent from "@/assets/student-higher.webp";
import vocationStudent from "@/assets/student-vocational.webp";
import proFace from "@/assets/pro-face-main-2400w.webp";

/**
 * Achievement Section
 */
import orgachivenment from "@/assets/achievenment-achieve.webp";
import orgbuild from "@/assets/achivenment-build.webp";

/**
 * Explore Category
 */
import studentmeet from "@/assets/student-hero-main-2400w.webp";
import teachermeet from "@/assets/teacher-face-main.webp";
import parentmeet from "@/assets/parent-face-main.webp";
import promeet from "@/assets/pro-face-main-2400w.webp";
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

const EXPLORE_CAT_IMG = [studentmeet, teachermeet, parentmeet, promeet];

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

const ORG_HERO_WORDS = ["Leading.", "to scale.", "to last."];
const HERO_WORD_MS = 2800;

const STRUGGLE_LINES = ["Every","organization","wonders","about"];

const SLIDES = [
  { word: "adoption", quote: "We rolled out three learning tools. Nobody knows if anyone is learning.", image: orgProblem1, alt: "Leader facing low tool adoption" },
  { word: "progress", quote: "Every department reports green. The outcomes still surprise us.", image: orgProblem2, alt: "Leaders reviewing conflicting progress reports" },
  { word: "gaps", quote: "We find the learning gaps at the exit interview, not in week two.", image: orgProblem3, alt: "Team discovering skill gaps too late" },
  { word: "support", quote: "Our best mentors can only be in one classroom at a time.", image: orgProblem4, alt: "Mentor stretched across many learners" },
  { word: "outcomes", quote: "We measure attendance and completion. We still can't see understanding.", image: orgProblem5, alt: "Leader measuring outcomes without insight" },
];

const CYCLE_MS = 4000;
const JOURNEY_WORD_MS = 3000;
const INTELLIGENCE_WORD_MS = 3000;
const KEEPS_WORD_MS = 2500;
const QUESTION_MS = 3200;
const CATEGORY_MS = 4200;

const JOURNEY_WORDS = ["Visionary adapts to each.", "Schools see it first", "Colleges build on it", "Coaching scales with it", "Workplaces grow from it"];

/* The four nav sub-sections — anchored for /organization#schools etc. */
const JOURNEY_STAGES = [
  { id: "schools", title: "Schools", copy: "Connect students, teachers, parents, and school leaders around the same learning picture.", connected: "Students, teachers, parents, and leaders", image: primaryStudent, alt: "School learning environment" },
  { id: "colleges", title: "Colleges and universities", copy: "Help departments, faculty, and students understand progress across programs, skills, and outcomes.", connected: "Students, faculty, departments, and placement", image: higherStudent, alt: "University campus learning" },
  { id: "coaching", title: "Coaching", copy: "Scale personalized support across batches, mentors, learners, and parent conversations.", connected: "Learners, mentors, parents, and coaches", image: competitiveStudent, alt: "Coaching institute classroom" },
  { id: "workplace", title: "Workplace learning", copy: "Help teams build real skills, apply learning to work, and see capability grow over time.", connected: "Professionals, managers, teams, and learning leads", image: proFace, alt: "Workplace learning session" },
];

const INTELLIGENCE_WORDS = ["People connected.", "Progress connected.", "Support connected.", "Outcomes connected."];

const INTELLIGENCE_STEPS = [
  { title: "See what people understand.", copy: "Learning activity becomes a clear picture of understanding across your institution." },
  { title: "Find gaps before they spread.", copy: "Know where people are stuck before small gaps become outcomes." },
  { title: "Support every role from one system.", copy: "Every role sees what matters to them, on one shared picture." },
  { title: "Improve the next decision.", copy: "Use real learning activity to improve lessons, programs, coaching, and planning." },
];

const KEEPS_WORDS = ["learning", "support", "progress"];

const LANGUAGE_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];

const LANGUAGE_QUESTIONS = [
  { hi: "Hamare learners kahan atak rahe hain?", en: "Where are our learners getting stuck?", bn: "আমাদের শিক্ষার্থীরা কোথায় আটকে আছে?", ta: "எங்கள் கற்பவர்கள் எங்கே சிக்கிக்கொண்டிருக்கிறார்கள்?", kn: "ನಮ್ಮ ಕಲಿಯುವವರು ಎಲ್ಲಿ ಸಿಕ್ಕಿಹಾಕಿಕೊಂಡಿದ್ದಾರೆ?", pa: "ਸਾਡੇ ਸਿੱਖਿਆਰਥੀ ਕਿੱਥੇ ਅੜਕੇ ਹੋਏ ਹਨ?" },
  { hi: "Kaunsi class ko zyada support chahiye?", en: "Which class needs more support?", bn: "কোন শ্রেণির বেশি সাহায্য দরকার?", ta: "எந்த வகுப்புக்கு அதிக உதவி தேவை?", kn: "ಯಾವ ತರಗತಿಗೆ ಹೆಚ್ಚಿನ ಸಹಾಯ ಬೇಕು?", pa: "ਕਿਹੜੀ ਜਮਾਤ ਨੂੰ ਵੱਧ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?" },
  { hi: "Training ka impact kahan dikh raha hai?", en: "Where is the training impact showing?", bn: "প্রশিক্ষণের প্রভাব কোথায় দেখা যাচ্ছে?", ta: "பயிற்சியின் தாக்கம் எங்கே தெரிகிறது?", kn: "ತರಬೇತಿಯ ಪ್ರಭಾವ ಎಲ್ಲಿ ಕಾಣುತ್ತಿದೆ?", pa: "ਸਿਖਲਾਈ ਦਾ ਅਸਰ ਕਿੱਥੇ ਦਿਖ ਰਿਹਾ ਹੈ?" },
];

const CONTINUITY_STAGES = [
  { name: "School", previous: "Last class", now: "Current learning", next: "Next grade" },
  { name: "College", previous: "Foundation", now: "Program skills", next: "Career readiness" },
  { name: "Coaching", previous: "Concept gaps", now: "Practice", next: "Exam confidence" },
  { name: "Workplace", previous: "Training", now: "Application", next: "Capability" },
  { name: "District", previous: "One school", now: "Every school", next: "Every district" },
];

const ACHIEVEMENT_TABS = [
  { black: "Understand", blue: "what people actually know.", copy: "Move beyond completion rates and see real understanding across your organization." },
  { black: "Support", blue: "the people who need it early.", copy: "Give teachers, coaches, and leaders what they need before results drop." },
  { black: "Improve", blue: "every program with evidence.", copy: "Use connected learning activity to improve curriculum, training, and coaching." },
];

const JOURNEY_CATEGORIES = ["Student", "Teacher", "Parent", "Professional", "Organization"];

const TRUST_WORDS = ["people.", "data.", "trust."];
const TRUST_WORD_MS = 6000;

const TRUST_CARDS = [
  { title: "Private by design.", copy: "Your people and their learning data. Treated with care.", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Built for institutions.", copy: "Designed for responsible use across learners, teachers, teams, and leaders.", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Transparent intelligence.", copy: "Organizations should understand how intelligence supports decisions.", Icon: Scale, to: "/terms", link: "Read our commitments" },
];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and keep your place.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "See who needs another explanation.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "See where your child needs support.", alt: "Parent helping a child at a desk" },
  { slug: "professional", chip: "Professional", copy: "Turn what you know into useful work.", alt: "Professional discussing work with a tablet" },
];

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */







/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const OrgHeroSection = React.memo(() => (
  <PersonaHero
    words={ORG_HERO_WORDS}
    srSentence="Leading, to scale, to last."
    sub="One intelligence across every classroom, team, and program. Understanding stays inside your institution."
    img={orgHero}
    alt="A leader reviewing team progress on a tablet"
    ctaTo="/contact"
    ctaLabel="Talk to us"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */










function OrgStruggleSection() {
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
          <CarouselDots total={SLIDES.length} active={index} onSelect={goTo} label="Organization learning challenges" />
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 03 · PROMISE ═══════════════════════ */

const OrgPromiseSection = React.memo(function OrgPromiseSection() {
  const { ref, visible } = UseRevealOnce();
  return (
    <section ref={ref} data-section="03-promise" className="relative isolate overflow-hidden px-6 py-24 lg:py-32 bg-white rounded-t-[32px]">
      <h2
        className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        style={{ color: COLORS.ink }}
      >
        What if your whole organization could see understanding —{" "}
        <span className="accent-gradient">before it became a gap?</span>
      </h2>
    </section>
  );
});

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

/* Icons per journey stage — reuses icons already imported in this file */
const JOURNEY_STAGE_ICONS = {
  "Schools": GraduationCap,
  "Colleges and universities": BookOpen,
  "Coaching": Target,
  "Workplace learning": Building2,
};

const STAGE_META = {
  "Schools": { Icon: GraduationCap },
  "Colleges and universities": { Icon: BookOpen },
  "Coaching": { Icon: Target },
  "Workplace learning": { Icon: Building2 },
};

const JOURNEY_MODALS = {
  "Schools": {
    top: "One school.", accent: "One picture.",
    intro: "Schools work best when everyone sees the same learning. Visionary connects students, teachers, parents, and leaders around one shared understanding.",
    primary: { label: "See how Visionary works", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See every learner.", c: "A clear picture of understanding across classes, not just attendance.", l: "How it works", to: "/how-it-works" },
      { Icon: UsersRound, t: "Parents stay close.", c: "Progress shared in ways that help at home, not only at report time.", l: "For parents", to: "/parent" },
      { Icon: Globe2, t: "In every language.", c: "Learning and reporting in the language each family thinks in.", l: "Language support", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Bring it to your school.", c: "Start with one class and grow from there.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Colleges and universities": {
    top: "Departments connected.", accent: "Outcomes visible.",
    intro: "Higher education asks for depth across programs and semesters. Visionary helps faculty, departments, and students understand progress across programs, skills, and outcomes.",
    primary: { label: "See how Visionary works", to: "/how-it-works" },
    blocks: [
      { Icon: Brain, t: "Depth, not dashboards.", c: "Real understanding across coursework, projects, and semesters.", l: "How it works", to: "/how-it-works" },
      { Icon: Layers3, t: "Programs that carry forward.", c: "Foundation courses connect to program skills and career readiness.", l: "Keep the record", to: "/how-it-works" },
      { Icon: BookOpen, t: "Faculty see what matters.", c: "Signals that help teaching adjust before outcomes drop.", l: "Get support", to: "/help" },
      { Icon: Building2, t: "Support your institution.", c: "Visionary fits classrooms, labs, and departments.", l: "For organizations", to: "/organization" },
    ],
  },
  "Coaching": {
    top: "Scale the support.", accent: "Keep it personal.",
    intro: "Coaching lives on personalized attention. Visionary scales that support across batches, mentors, learners, and parent conversations.",
    primary: { label: "See how Visionary works", to: "/how-it-works" },
    blocks: [
      { Icon: Target, t: "Every batch, every learner.", c: "Know where each learner is stuck while there is still time to act.", l: "How it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practice with direction.", c: "Mentors see what to revise, skip, and strengthen for each learner.", l: "Start practising free", to: "/register" },
      { Icon: Clock, t: "Exam confidence.", c: "Concept gaps close before the exam, not after the result.", l: "Keep the record", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Talk to us.", c: "Bring Visionary to your batches and mentors.", l: "Contact us", to: "/contact" },
    ],
  },
  "Workplace learning": {
    top: "Real skills.", accent: "Visible capability.",
    intro: "Workplace learning only matters when it changes the work. Visionary helps teams build real skills, apply learning to work, and see capability grow over time.",
    primary: { label: "See how Visionary works", to: "/how-it-works" },
    blocks: [
      { Icon: TrendingUp, t: "From training to application.", c: "See where training turns into capability, and where it stalls.", l: "How it works", to: "/how-it-works" },
      { Icon: UsersRound, t: "Managers see growth.", c: "Signals that help teams and L&D support the people who need it early.", l: "Get support", to: "/help" },
      { Icon: Layers3, t: "Skills that grow.", c: "Each program builds on what your teams already know.", l: "Keep the record", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Start with one team.", c: "Pilot Visionary with one cohort and grow from there.", l: "Talk to us", to: "/contact" },
    ],
  },
};





function OrgJourneySection() {
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
          Your institution, your journey
        </p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Every organization learns differently.
          <br className="hidden md:block" />{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{JOURNEY_WORDS[index]}</span>
        </h2>
        <p
          className="mx-auto mt-6 w-full max-w-[900px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]"
          style={{ color: COLORS.grey }}
        >
          One intelligence, shaped to the way your institution teaches, trains, and grows.
        </p>

        {/* stage rail — even beat under the header */}
        <div className="mt-14 px-6 lg:mt-20">
          <div className="flex gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:justify-center lg:gap-4 lg:overflow-visible lg:py-0" role="group" aria-label="Organization contexts">
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
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Schools" secondaryLabel="Start free" />}
    </section>
  );
}

/* ═══════════════════════ 05 · INTELLIGENCE ═══════════════════════ */

const INTELLIGENCE_IMG = [primaryStudent, secondaryStudent, competitiveStudent, higherStudent];





function OrgIntelligenceSection() {
  const { ref: headRef, visible } = UseRevealOnce();
  const { index: wordIndex } = UseCycleIndex(INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);
  const { active, setStepRef } = UseActiveStep(INTELLIGENCE_STEPS.length);
  const current = INTELLIGENCE_STEPS[active];

  return (
    <section ref={headRef} data-section="05-intelligence" className="relative isolate [overflow-x:clip] bg-white rounded-t-[32px]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible} className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          The intelligence behind your organization
        </p>
        <h2 className="text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
            {INTELLIGENCE_WORDS[wordIndex]}
          </span>
        </h2>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          Every learner, teacher, and professional in one clear picture you can act on.
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

const OrgClosingSection = React.memo(function OrgClosingSection() {
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
        connected until individual progress becomes organizational momentum.
      </p>
    </section>
  );
});

/* ═══════════════════════ 07 · LANGUAGE ═══════════════════════ */



function OrgLanguageSection() {
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
          Your organization.<br />In every language.
        </h2>
        <p className="mx-auto max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          People ask, learn, teach, and report in different languages. Visionary keeps the meaning connected across them.
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
              Use voice or text in the way you're comfortable.
            </p>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 08 · CONTINUITY ═══════════════════════ */



const CATEGORY_SECTION_IMG = [primaryStudent, secondaryStudent, competitiveStudent, vocationStudent, higherStudent];



function OrgContinuitySection() {
  const { ref, visible } = UseRevealOnce();
  const { index, goTo, step } = UseStageIndex(CONTINUITY_STAGES.length);
  const stage = CONTINUITY_STAGES[index];

  return (
    <section ref={ref} data-section="08-continuity" className="relative isolate py-24 lg:py-32 [overflow-x:clip] bg-white rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>
          Keep the record
        </p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          What your organization learns stays with it.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[700px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          What your people understand becomes part of what comes next.
        </p>
        <div className="mt-14 flex justify-center lg:mt-20">
          <StageDropdown stages={CONTINUITY_STAGES} active={index} onSelect={goTo} />
        </div>
        <div className="mt-14 grid grid-cols-1 gap-16 px-6 lg:mt-20 lg:grid-cols-3 lg:gap-12 lg:px-0">
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Previous" caption="What came before" text={stage.previous} imgClass="lg:h-[400px]" className="lg:-ml-[6vw]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Now" caption="What's happening now" text={stage.now} imgClass="lg:h-[600px]" className="lg:mt-[100px]" />
          <ContinuityCard images={CATEGORY_SECTION_IMG} index={index} label="Next" caption="What comes next" text={stage.next} imgClass="lg:h-[370px]" className="lg:-mr-[6vw] lg:mt-[20px]" />
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
          Your institution keeps its place.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 09 · ACHIEVEMENT ═══════════════════════ */

const ACHIEVEMENT_IMAGE = [orgHeroContent, orgachivenment, orgbuild];

/* icon per achievement tab — reuses icons already imported in this file */
const ACHIEVEMENT_META = [
  { Icon: Eye },           /* Understand */
  { Icon: UsersRound },    /* Support */
  { Icon: TrendingUp },    /* Improve */
];




function OrgAchievementSection() {
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
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>See what your organization can achieve.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Connected learning, stronger results for everyone you serve.
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

const JOURNEY_FLOW_ICONS = {
  "Student": GraduationCap,
  "Teacher": BookOpen,
  "Parent": UsersRound,
  "Professional": Zap,
  "Organization": Building2,
};



function OrgJourneyFlowSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];

  return (
    <section ref={ref} data-section="10-journey-flow" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Individual journeys.<br />Shared intelligence.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Every role in your organization sees what matters to them — while the same intelligence connects them all.
        </p>

        {/* Breath 2 — cascade + closing column */}
        <div className="mx-auto mt-14 grid w-full max-w-[1900px] grid-cols-1 items-center gap-16 px-6 lg:mt-28 lg:grid-cols-[7fr_5fr] lg:gap-24 lg:pl-[10%] lg:pr-12">
          {/* cascade: card → connector → card (in-flow, never overlapping) */}
          <div className="relative">
            <JourneyCategoryCard iconMap={JOURNEY_FLOW_ICONS} images={CATEGORY_SECTION_IMG} index={index} text={first} className="mx-auto max-w-[430px] lg:mx-0" />
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
            <JourneyCategoryCard iconMap={JOURNEY_FLOW_ICONS} images={CATEGORY_SECTION_IMG} index={index + 1} text={second} className="ml-[10%] max-w-[430px] lg:ml-[28%]" />
          </div>

          {/* closing column — statement + action, balanced against the cascade */}
          <div className="max-w-[500px]">
            <p className="font-normal tracking-[0] leading-[1.2] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
              A student's question helps a teacher adjust. A teacher's insight helps a parent support. A professional's progress helps an organization plan. One intelligence, connected.
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



function OrgTrustSection() {
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
          Your people's questions, conversations, and progress are personal. Visionary keeps it that way.
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

const OrgCTASection = React.memo(function OrgCTASection() {
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
          Bring Visionary to your organization.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Start with one class, one team, and build from there.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/contact"
            className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5"
            style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
          >
            Contact sales
          </Link>
          <Link
            to="/register"
            className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            style={{ backgroundColor: COLORS.blue }}
          >
            Get started
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



function OrgExploreSection() {
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

export default function OrganizationPage() {
  useSheetStack();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <OrgHeroSection />
        <OrgStruggleSection />
        <OrgPromiseSection />
        <OrgJourneySection />
        <OrgIntelligenceSection />
        <OrgClosingSection />
        <OrgLanguageSection />
        <OrgContinuitySection />
        <OrgAchievementSection />
        <OrgJourneyFlowSection />
        <OrgTrustSection />
        <OrgCTASection />
        <OrgExploreSection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
