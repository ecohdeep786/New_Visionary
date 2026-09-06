import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ DESIGN TOKENS (clean) ═══ */
const COLORS = {
  ink: "#121317",
  surface: "#F5F6F8",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  chipBg: "#D2E3FC",
  cardSurface: "#EEF1F6",
  cardSurfaceAlt: "#E9EFFA",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══ CONTROLLERS — camelCase ═══ */
function useCycleIndex(total, intervalMs) {
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i) => setIndex(((i % total) + total) % total), [total]);
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs, index]);
  return { index, goTo };
}
function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
function useRevealContinuous(rootMargin = "-40% 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0, rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
function useActiveStep(total) {
  const nodes = useRef([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const stepIndex = Number(entry.target.dataset.step);
          if (!isNaN(stepIndex)) setActive(stepIndex);
        }
      }),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    nodes.current.slice(0, total).forEach((n) => n && observer.observe(n));
    return () => observer.disconnect();
  }, [total]);
  const setStepRef = useCallback((i) => (node) => { nodes.current[i] = node; }, []);
  return { active, setStepRef };
}
function useScrollTrack() {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const update = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setCanPrev(t.scrollLeft > 4);
    setCanNext(t.scrollLeft < t.scrollWidth - t.clientWidth - 4);
  }, []);
  useEffect(() => { update(); window.addEventListener("resize", update, { passive: true }); return () => window.removeEventListener("resize", update); }, [update]);
  const scrollByCard = useCallback((dir) => {
    const t = trackRef.current;
    if (!t) return;
    const card = t.querySelector("[data-card]");
    if (!card) return;
    const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
    t.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: "smooth" });
  }, []);
  return { trackRef, canPrev, canNext, scrollByCard, update };
}
function useStageIndex(total) {
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i) => setIndex(((i % total) + total) % total), [total]);
  const step = useCallback((d) => setIndex((i) => (i + d + total) % total), [total]);
  return { index, goTo, step };
}

/* ═══ PARENT MODELS (clean strings) ═══ */
const PARENT_HERO_WORDS = ["clarity.", "progress.", "trust."];
const HERO_WORD_MS = 2800;

const PARENT_SLIDES = [
  { word: "Progress", quote: "The report card says fine. I still don't know how to help.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent reviewing a child's progress" },
  { word: "Homework", quote: "We fight over homework every night. I don't know the right way to explain.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent helping with homework at night" },
  { word: "Understanding", quote: "She says she understood. The test says something else.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent talking with a child about a test" },
  { word: "Confidence", quote: "He used to love learning. Now he hides his books.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent encouraging a discouraged child" },
  { word: "Reports", quote: "I meet the teacher once a year. I want to know every week.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent at a parent-teacher meeting" },
];
const CYCLE_MS = 4000;

const PARENT_JOURNEY_STAGES = [
  { title: "Early Years", copy: "First questions, first letters, first wins — you see them all, and Visionary helps you make the most of them.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Parent with a young child learning" },
  { title: "Primary", copy: "When homework begins, you can follow what they're learning and help without taking over.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Parent following primary school learning" },
  { title: "Secondary", copy: "Subjects get harder and conversations get shorter. Visionary keeps you part of the journey.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Parent supporting a secondary student" },
  { title: "Higher Secondary", copy: "Streams, boards, and big decisions — understand what they're working toward and how to support it.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Parent discussing higher secondary choices" },
  { title: "Competitive Exams", copy: "See how preparation is moving, not just the mock score, and know when to push and when to pause.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Parent supporting exam preparation" },
  { title: "Beyond School", copy: "Whatever they choose next, the understanding they've built travels with them — and so does your support.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Parent celebrating a child's next step" },
];

const PARENT_INTELLIGENCE_WORDS = ["Every step connected.", "Every week connected.", "Every win connected.", "Every worry connected."];
const INTELLIGENCE_WORD_MS = 3000;

const PARENT_INTELLIGENCE_STEPS = [
  { title: "What your child understood this week.", copy: "Not just what was covered in class — what actually made sense. Visionary turns the week into a picture you can understand in minutes." },
  { title: "Know where your child is stuck.", copy: "See the exact idea that stopped them, before it becomes a gap, and before the gap becomes a grade." },
  { title: "See which way learning is moving.", copy: "Understand whether confidence is building or slipping — and what changed along the way." },
  { title: "You see more when everyone sees the same picture.", copy: "When you, your child, and the teacher share the same view, support becomes simple — at home and in class." },
];

const PARENT_KEEPS_WORDS = ["supporting", "explaining", "celebrating"];
const KEEPS_WORD_MS = 2500;

const LANGUAGE_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];
const PARENT_LANGUAGE_QUESTIONS = [
  { hi: "Priya iss hafte physics mein kaisi rahi?", en: "How did Priya do in physics this week?", bn: "এই সপ্তাহে প্রিয়া পদার্থবিদ্যায় কেমন করল?", ta: "இந்த வாரம் இயற்பியலில் பிரியா எப்படி செய்தார்?", kn: "ಈ ವಾರ ಭೌತಶಾಸ್ತ್ರದಲ್ಲಿ ಪ್ರಿಯಾ ಹೇಗೆ ಮಾಡಿದಳು?", pa: "ਇਸ ਹਫ਼ਤੇ ਭੌਤਿਕ ਵਿਗਿਆਨ ਵਿੱਚ ਪ੍ਰਿਯਾ ਕਿਵੇਂ ਰਹੀ?" },
  { hi: "Homework mein main kaise madad karoon?", en: "How do I help with homework?", bn: "হোমওয়ার্কে আমি কীভাবে সাহায্য করব?", ta: "வீட்டுப் பாடத்தில் எப்படி உதவுவது?", kn: "ಮನೆಪಾಠದಲ್ಲಿ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡುವುದು?", pa: "ਹੋਮਵਰਕ ਵਿੱਚ ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?" },
  { hi: "Parent-teacher meeting se pehle kya jaanna chahiye?", en: "What should I know before the parent-teacher meeting?", bn: "অভিভাবক-শিক্ষক সভার আগে আমার কী জানা উচিত?", ta: "பெற்றோர்-ஆசிரியர் சந்திப்புக்கு முன் நான் என்ன அறிய வேண்டும்?", kn: "ಪೋಷಕ-ಶಿಕ್ಷಕ ಸಭೆಗೆ ಮೊದಲು ನಾನು ಏನು ತಿಳಿಯಬೇಕು?", pa: "ਮਾਪੇ-ਅਧਿਆਪਕ ਮੀਟਿੰਗ ਤੋਂ ਪਹਿਲਾਂ ਮੈਂ ਕੀ ਜਾਣਨਾ ਚਾਹੀਦਾ ਹੈ?" },
];
const QUESTION_MS = 3200;

const PARENT_CONTINUITY_STAGES = [
  { name: "Primary", previous: "Factors", now: "Decimals", next: "Percentages" },
  { name: "Secondary", previous: "Linear equations", now: "Graphs", next: "Equations" },
  { name: "Competitive Exams", previous: "Concept", now: "Difficult problem", next: "New problem" },
  { name: "Vocational & Skills", previous: "Basic skill", now: "Practice", next: "Real project" },
  { name: "Higher Education", previous: "Foundation", now: "Specialization", next: "Career" },
  { name: "Independent Learning", previous: "Curiosity", now: "Habit", next: "Confidence" },
];

const PARENT_ACHIEVEMENT_TABS = [
  { black: "Understand", blue: "what your child is learning.", copy: "Build a clear picture of the subjects, skills, and ideas shaping your child's week — without waiting for the report card." },
  { black: "Support", blue: "where they need it most.", copy: "Know the exact moment to help, the right way to explain, and when to let them figure it out on their own." },
  { black: "Celebrate", blue: "every step forward.", copy: "See the wins — small and big — and turn them into the confidence that carries your child forward." },
];

const JOURNEY_CATEGORIES = ["Primary", "Secondary", "Higher Secondary", "Competitive Exams", "Vocational & Skills", "Higher Education", "Independent Learning"];
const CATEGORY_MS = 4200;

const PARENT_TRUST_WORDS = ["child's", "progress.", "trust."];
const TRUST_WORD_MS = 3000;
const PARENT_TRUST_CARDS = [
  { title: "Private by Design", copy: "Your child's information. Treated with care." },
  { title: "Safe to grow with", copy: "Built from the first question to what's next." },
  { title: "Built responsibly.", copy: "Intelligence should help children without compromising matters to them." },
];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Know how Visionary fits into your learning.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Know how Visionary fits into your classroom.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "professional", chip: "Professional", copy: "Know how Visionary fits into the work you do.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Know how Visionary fits across your organization.", alt: "Leader talking at an organization table" },
];

/* ═══ SHARED VIEWS ═══ */
const ChevronIcon = React.memo(function ChevronIcon({ direction = "right", className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${className} ${direction === "left" ? "rotate-180" : ""}`}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
});
const VoiceIcon = React.memo(function VoiceIcon({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M25 7l-5 9 6 4-5 9 3 3-2 7" />
      <path d="M31 19c2.5 2.5 2.5 7.5 0 10" />
      <path d="M35.5 15.5c4.5 4.5 4.5 12 0 16.5" />
    </svg>
  );
});
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* ═══ 01 · HERO (self-contained) ═══ */
const ParentHeroSection = React.memo(function ParentHeroSection() {
  const { index } = useCycleIndex(PARENT_HERO_WORDS.length, HERO_WORD_MS);
  const display = "hero-fade-up block whitespace-nowrap font-medium leading-[1] tracking-[-0.01em] text-[clamp(56px,9.5vw,168px)]";
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1756px] flex-col justify-center px-6 py-24 lg:block lg:px-0 lg:py-0">
        <h1 className="sr-only">Supporting, to clarity.</h1>
        <span aria-hidden="true" className={`${display} lg:absolute lg:left-[6.5%] lg:top-[23%]`} style={{ color: COLORS.ink }}>Supporting,</span>
        <span aria-hidden="true" className={`${display} mt-4 lg:mt-0 lg:absolute lg:left-[45%] lg:top-[49.5%]`} style={{ color: COLORS.ink }}>
          to{" "}
          <span key={index} className="hero-fade-up inline-block">{PARENT_HERO_WORDS[index]}</span>
        </span>
        <p className="hero-fade-up mt-10 max-w-[320px] font-normal tracking-[0] leading-[1.6] text-[16px] lg:absolute lg:left-[7%] lg:top-[53%] lg:mt-0 xl:max-w-[410px]" style={{ color: COLORS.grey }}>
          Every question you ask, every worry you carry, every win you celebrate — Visionary helps you understand your child's learning, for as long as they keep growing.
        </p>
      </div>
    </section>
  );
});

/* ═══ 02 · STRUGGLE ═══ */
const StruggleHeading = React.memo(function StruggleHeading({ word, slideKey }) {
  return (
    <h2 className="font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
      <span className="block">Every</span>
      <span className="block">Parent</span>
      <span className="block">Wonders</span>
      <span className="block">About</span>
      <span className="block whitespace-nowrap">
        <span key={slideKey} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{word}</span>
      </span>
    </h2>
  );
});
const StruggleMedia = React.memo(function StruggleMedia({ slide, slideKey }) {
  return (
    <figure className="m-0">
      <div key={slideKey} className="hero-fade-up [animation-delay:120ms] [animation-fill-mode:both]">
        <img src={slide.image} alt={slide.alt} loading="lazy" decoding="async" className="aspect-[16/9] w-full max-w-[640px] mx-auto rounded-[50px] object-cover" />
      </div>
      <figcaption key={`q-${slideKey}`} aria-live="polite" className="hero-fade-up mx-auto mt-10 w-full max-w-[560px] text-center font-normal tracking-[0] leading-[1.27] text-[clamp(16px,1.39vw,20px)] [animation-delay:200ms] [animation-fill-mode:both]" style={{ color: COLORS.ink }}>
        {slide.quote}
      </figcaption>
    </figure>
  );
});
const CarouselDots = React.memo(function CarouselDots({ total, active, onSelect }) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Carousel slides">
      {Array.from({ length: total }, (_, i) => (
        <button key={i} type="button" role="tab" aria-label={`Go to slide ${i + 1}`} aria-selected={i === active} onClick={() => onSelect(i)}
          className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-10" : "w-2 hover:opacity-70"}`}
          style={{ backgroundColor: i === active ? COLORS.ink : `${COLORS.ink}33` }} />
      ))}
    </div>
  );
});
function ParentStruggleSection() {
  const { index, goTo } = useCycleIndex(PARENT_SLIDES.length, CYCLE_MS);
  const { ref, visible } = useRevealContinuous();
  const slide = PARENT_SLIDES[index];
  return (
    <section ref={ref} className="relative overflow-hidden bg-white py-24" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1756px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-12 lg:gap-10 lg:px-0">
          <div className="lg:col-span-4 lg:pl-[6.5%]"><StruggleHeading word={slide.word} slideKey={index} /></div>
          <div className="lg:col-span-8 lg:pr-[6%]"><StruggleMedia slide={slide} slideKey={index} /></div>
        </div>
        <div className="mt-14 flex justify-center"><CarouselDots total={PARENT_SLIDES.length} active={index} onSelect={goTo} /></div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 03 · PROMISE ═══ */
const ParentPromiseSection = React.memo(function ParentPromiseSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY }}>
      <h2 className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        What if you could see who understood — <span style={{ color: COLORS.blue }}>and who didn't?</span>
      </h2>
    </section>
  );
});


/* ═══ 05 · INTELLIGENCE ═══ */
const IntelligenceCopy = React.memo(function IntelligenceCopy({ step }) {
  return (
    <div key={step.title} className="hero-fade-up max-w-[460px]">
      <h3 className="whitespace-pre-line font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>{step.title}</h3>
      <p className="mt-10 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{step.copy}</p>
    </div>
  );
});
const IntelligenceVisual = React.memo(function IntelligenceVisual({ step, index, setStepRef }) {
  return (
    <figure ref={setStepRef(index)} data-step={index} className="m-0">
      <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[60px] lg:mx-0 lg:max-w-none">
        <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={step.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover lg:aspect-[15/16]" />
      </div>
    </figure>
  );
});
function ParentIntelligenceSection() {
  const { ref: headRef, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(PARENT_INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);
  const { active, setStepRef } = useActiveStep(PARENT_INTELLIGENCE_STEPS.length);
  const current = PARENT_INTELLIGENCE_STEPS[active];
  return (
    <section ref={headRef} className="relative [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible} className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>The intelligence behind your child's learning</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{PARENT_INTELLIGENCE_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Visionary keeps the learning moving from the first question to the moment your child can use what they've learned.
        </p>
      </FadeReveal>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-60 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center"><IntelligenceCopy step={current} /></div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {PARENT_INTELLIGENCE_STEPS.map((s, i) => (
            <div key={s.title}>
              <IntelligenceVisual step={s} index={i} setStepRef={setStepRef} />
              <div className="mt-10 lg:hidden"><IntelligenceCopy step={s} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ 06 · CLOSING ═══ */
const ParentClosingSection = React.memo(function ParentClosingSection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(PARENT_KEEPS_WORDS.length, KEEPS_WORD_MS);
  return (
    <section ref={ref} className="relative px-6 py-24 pt-10 lg:py-32 lg:pt-14" style={{ fontFamily: FONT_FAMILY }}>
      <p className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        Visionary keeps{" "}
        <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{PARENT_KEEPS_WORDS[index]}</span>{" "}
        with you until understanding becomes confidence.
      </p>
    </section>
  );
});

/* ═══ 07 · LANGUAGE ═══ */
const LanguageChips = React.memo(function LanguageChips({ active, onSelect }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Language selection">
      {LANGUAGE_CHIPS.map((lang) => (
        <button key={lang.code} type="button" aria-pressed={active === lang.code} onClick={() => onSelect(lang.code)}
          className={`rounded-full px-5 py-2 font-normal uppercase tracking-[0] leading-[14px] text-[10px] transition-colors ${active === lang.code ? "" : "border hover:bg-[#121317]/5"}`}
          style={{ backgroundColor: active === lang.code ? COLORS.chipBg : "transparent", color: COLORS.ink, borderColor: active === lang.code ? "transparent" : `${COLORS.ink}40` }}>
          {lang.label}
        </button>
      ))}
      <span className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.ink }}>+20 languages</span>
    </div>
  );
});
function ParentLanguageSection() {
  const { ref, visible } = useRevealOnce();
  const [lang, setLang] = useState("hi");
  const { index } = useCycleIndex(PARENT_LANGUAGE_QUESTIONS.length, QUESTION_MS);
  const question = PARENT_LANGUAGE_QUESTIONS[index][lang];
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Our language</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your child's progress.<br />In your language.
        </h2>
        <p className="mx-auto mt-6 max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Understand your child's journey in the language you think. Visionary keeps the meaning, the context, and the journey connected.
        </p>
        <div className="mx-auto mt-24 max-w-[760px] lg:mt-32">
          <p className="text-left font-normal tracking-[0] leading-[16px] text-[12px]" style={{ color: COLORS.lightGrey }}>Listening........</p>
          <p className="mt-4 text-center font-normal tracking-[0] leading-[1.15] text-[clamp(30px,3.75vw,54px)]" style={{ color: COLORS.blue }}>
            <span key={`${lang}-${index}`} className="hero-fade-up inline decoration-[2px]">{question}</span>
          </p>
        </div>
        <div className="mt-14 flex justify-center" style={{ color: COLORS.ink }}><VoiceIcon /></div>
        <div className="mt-16"><LanguageChips active={lang} onSelect={setLang} /></div>
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-5 rounded-[70px] px-10 py-6" style={{ backgroundColor: `${COLORS.ink}05` }}>
            <VoiceIcon className="h-8 w-8 shrink-0" />
            <div>
              <p className="font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>Ask your way</p>
              <p className="mt-1 font-normal tracking-[0] leading-[19px] text-[13px]" style={{ color: COLORS.grey }}>Use voice or text in the way you're comfortable.</p>
            </div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}



/* ═══ 09 · ACHIEVEMENT ═══ */
const AchievementAccordion = React.memo(function AchievementAccordion({ tabs, open, onToggle }) {
  return (
    <div>
      {tabs.map((tab, i) => (
        <div key={tab.black} className="border-b py-10 first:pt-0 lg:py-12" style={{ borderColor: `${COLORS.ink}26` }}>
          <button type="button" aria-expanded={open === i} onClick={() => onToggle(i)} className="flex w-full items-start justify-between gap-6 text-left">
            <h3 className="max-w-[460px] font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
              {tab.black} <span style={{ color: COLORS.blue }}>{tab.blue}</span>
            </h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`mt-3 h-6 w-6 shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} style={{ color: COLORS.grey }}>
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <p className="max-w-[460px] pt-6 font-normal tracking-[0] leading-[22px] text-[15px]" style={{ color: COLORS.ink }}>{tab.copy}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
function ParentAchievementSection() {
  const { ref, visible } = useRevealOnce();
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState(0);
  const toggle = useCallback((i) => {
    const next = open === i ? (i === 0 ? 1 : i - 1) : i;
    setOpen(next);
    setActive(next);
  }, [open]);
  return (
    <section ref={ref} className="relative py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Your achievement</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>See what your child can achieve with intelligence.</h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Turn what your child understands into stronger results, useful skills, and confidence you can see.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 lg:mt-32 lg:grid-cols-2 lg:gap-24 lg:px-0">
          <AchievementAccordion tabs={PARENT_ACHIEVEMENT_TABS} open={open} onToggle={toggle} />
          <div className="relative">
            <div key={active} className="hero-fade-up">
              <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={`${PARENT_ACHIEVEMENT_TABS[active].black} ${PARENT_ACHIEVEMENT_TABS[active].blue}`} loading="lazy" decoding="async" className="h-[320px] w-full object-cover lg:h-[780px]" />
            </div>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="absolute bottom-4 right-4 h-6 w-6 text-white/80">
              <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
            </svg>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 10 · JOURNEY FLOW ═══ */
const JourneyCategoryCard = React.memo(function JourneyCategoryCard({ text, className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-[48px] ${className}`}>
      <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={text} loading="lazy" decoding="async" className="aspect-[20/19] w-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <span key={text} className="text-center font-medium tracking-[0] leading-[1.03] text-white text-[clamp(40px,4.5vw,72px)] animate-[heroFadeUp_0.9s_cubic-bezier(0.22,1,0.36,1)]">{text}</span>
      </div>
    </div>
  );
});
function ParentJourneyFlowSection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];
  return (
    <section ref={ref} className="relative bg-white py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your child's journey changes.<br />Their learning stays with them.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          As their subjects, skills, and goals change, Visionary keeps giving you a place to continue supporting, understanding, and moving forward together.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1900px] grid-cols-1 items-center gap-20 px-6 lg:mt-32 lg:grid-cols-[7fr_5fr] lg:gap-24 lg:pl-[10%] lg:pr-12">
          <div className="relative">
            <div className="relative max-w-[430px]">
              <JourneyCategoryCard text={first} />
              <svg viewBox="0 0 220 260" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute left-[8%] -bottom-[200px] hidden h-[220px] w-[200px] lg:block" style={{ color: COLORS.ink }}>
                <path d="M12 4 C 4 120, 44 196, 188 232" />
                <path d="M188 232 l-16 -6 M188 232 l-10 13" />
              </svg>
            </div>
            <JourneyCategoryCard text={second} className="ml-[28%] mt-24 max-w-[430px] lg:mt-32" />
          </div>
          <p className="max-w-[500px] font-normal tracking-[0] leading-[1.2] text-[clamp(28px,2.78vw,40px)] lg:pr-12" style={{ color: COLORS.ink }}>
            Wherever their journey goes, your support can continue with them.
          </p>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 11 · TRUST ═══ */
const TrustCard = React.memo(function TrustCard({ card }) {
  return (
    <div className="elevation-1 relative w-full max-w-[780px] shrink-0 overflow-hidden rounded-[32px] border bg-white" style={{ borderColor: `${COLORS.ink}1A` }}>
      <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={card.title} loading="lazy" decoding="async" className="aspect-[8/5] w-full object-cover" />
      <p className="absolute left-8 top-8 max-w-[220px] font-normal tracking-[0] leading-[22px] text-[15px]" style={{ color: COLORS.ink }}>{card.copy}</p>
    </div>
  );
});
function ParentTrustSection() {
  const { ref, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(PARENT_TRUST_WORDS.length, TRUST_WORD_MS);
  const [cardIndex, setCardIndex] = useState(0);
  const stepCards = useCallback((d) => setCardIndex((i) => (i + d + PARENT_TRUST_CARDS.length) % PARENT_TRUST_CARDS.length), []);
  const active = PARENT_TRUST_CARDS[cardIndex];
  const next = PARENT_TRUST_CARDS[(cardIndex + 1) % PARENT_TRUST_CARDS.length];
  return (
    <section ref={ref} className="relative bg-white py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Our trust</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{PARENT_TRUST_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Your child's questions, conversations, and progress are personal. Visionary is designed with privacy, security, and transparency at the heart of the experience.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1600px] grid-cols-1 items-start gap-16 px-6 lg:mt-32 lg:grid-cols-[4fr_8fr] lg:gap-24 lg:px-0">
          <div className="lg:pl-2">
            <h3 key={active.title} className="hero-fade-up max-w-[460px] font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>{active.title}</h3>
            <button type="button" aria-label="Next trust card" onClick={() => stepCards(1)} className="mt-12 flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5 lg:ml-24" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
              <ChevronIcon direction="right" />
            </button>
          </div>
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <div key={`a-${cardIndex}`} className="hero-fade-up w-full max-w-[780px] shrink-0"><TrustCard card={active} /></div>
            <div key={`b-${cardIndex}`} className="hero-fade-up w-full max-w-[780px] shrink-0 [animation-delay:80ms] [animation-fill-mode:both]"><TrustCard card={next} /></div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 12 · CTA ═══ */
const ParentCTASection = React.memo(function ParentCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Start where they are</p>
        <h2 className="mt-4 font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Your child's journey is already happening.</h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          See what they understand, know where they need support, and help them grow with confidence — every step of the way.
        </p>
        <div className="mt-12 flex justify-center">
          <Link to="/register" className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: COLORS.blue }}>
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
});

/* ═══ 13 · EXPLORE ═══ */
const ExploreCard = React.memo(function ExploreCard({ category }) {
  return (
    <Link to={`/${category.slug}`} data-card className="elevation-1 block w-[260px] shrink-0 snap-start overflow-hidden rounded-[24px] border bg-white sm:w-[320px]" style={{ borderColor: `${COLORS.ink}1A` }}>
      <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={category.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
      <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>{category.chip}</p>
        <p className="mt-3 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{category.copy}</p>
        <span className="mt-4 font-normal tracking-[0] leading-[22px] text-[16px]" style={{ color: COLORS.blue }}>Explore more</span>
      </div>
    </Link>
  );
});
function ParentExploreSection() {
  const { ref, visible } = useRevealOnce();
  const { trackRef, canNext, scrollByCard, update } = useScrollTrack();
  return (
    <section ref={ref} className="relative py-16 lg:py-20 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <h2 className="px-6 font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)] lg:pl-[6.5%] lg:pr-6" style={{ color: COLORS.ink }}>Explore more categories</h2>
        <div className="relative mt-16 lg:mt-20">
          <div ref={trackRef} onScroll={update} className="flex snap-x snap-mandatory gap-8 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-12 lg:pl-[calc(6.5%_+_480px)] lg:pr-6">
            {EXPLORE_CATEGORIES.map((c) => (<ExploreCard key={c.slug} category={c} />))}
          </div>
          <button type="button" aria-label="Next categories" onClick={() => scrollByCard(1)}
            className={`absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border bg-white elevation-2 transition-opacity hover:bg-[#121317]/5 lg:right-6 ${canNext ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{ borderColor: `${COLORS.ink}1A`, color: COLORS.ink }}>
            <ChevronIcon direction="right" />
          </button>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ PAGE ══ */
export default function ParentPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main>
        <ParentHeroSection />
        <ParentStruggleSection />
        <ParentPromiseSection />
        <ParentIntelligenceSection />
        <ParentClosingSection />
        <ParentLanguageSection />
        
        <ParentAchievementSection />
        <ParentJourneyFlowSection />
        <ParentTrustSection />
        <ParentCTASection />
        <ParentExploreSection />
      </main>
      <LandingFooter />
    </div>
  );
}