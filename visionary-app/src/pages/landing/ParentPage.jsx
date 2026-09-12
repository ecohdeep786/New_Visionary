import React, { useCallback, useEffect, useState, useRef } from "react";
import { Eye, RefreshCw, Globe2, UsersRound, Sparkles, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain, TrendingUp, Award, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import parentHero from "@/assets/parent-hero-main.png";
import PersonaHero from "@/components/landing/NewPersona";
import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";

/**
 * Problem Section
 */
import problemexam from "@/assets/problem-exam.png";
import problempractice from "@/assets/problem-practice.png";
import problemrevision from "@/assets/problem-revision.png";
import problemunderstanding from "@/assets/problem-understanding.png";

/**
 * Our Journey Section 
 */
import primaryStudent from "@/assets/student-primary.png";
import secondaryStudent from "@/assets/student-secondary.png";
import competitiveStudent from "@/assets/student-competitive.png";
import higherStudent from "@/assets/student-higher.png";
import vocationStudent from "@/assets/student-vocational.png";

/**
 * Achievement Section
 */
import studentachivenment from "@/assets/achievenment-achieve.png";
import studentbuild from "@/assets/achivenment-build.png";

/**
 * Explore Category
 */
import teachermeet from "@/assets/teacher-hero-main.png";
import parentmeet from "@/assets/parent-hero-main.png";
import promeet from "@/assets/pro-face-main.png";
import orgmeet from "@/assets/org-face-main.png";

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
  cardSurface: "#EEF1F6",
  cardSurfaceAlt: "#E9EFFA",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══════════════════════ CONTROLLERS ═══════════════════════ */

function UseCycleIndex(total, intervalMs) {
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i) => setIndex(((i % total) + total) % total), [total]);
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs, index]);
  return { index, goTo };
}

function UseRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) {
          setVisible(true);
          hasRevealed.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function UseRevealContinuous(rootMargin = "-40% 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0, rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function UseActiveStep(total) {
  const nodes = useRef([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const i = Number(entry.target.dataset.step);
          if (!isNaN(i)) setActive(i);
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

function UseScrollTrack() {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const update = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setCanPrev(t.scrollLeft > 4);
    setCanNext(t.scrollLeft < t.scrollWidth - t.clientWidth - 4);
  }, []);
  useEffect(() => {
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [update]);
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

function UseStageIndex(total) {
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i) => setIndex(((i % total) + total) % total), [total]);
  const step = useCallback((d) => setIndex((i) => (i + d + total) % total), [total]);
  return { index, goTo, step };
}

/* ═══════════════════════ MODELS ═══════════════════════ */

const HERO_WORDS = ["Learning,", "to master.", "to build."];
const HERO_WORD_MS = 2800;

const PARENT_SLIDES = [
  { word: "Progress", quote: "The report card says fine. I still don't know how to help.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent reviewing a child's progress" },
  { word: "Homework", quote: "We fight over homework every night. I don't know the right way to explain.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent helping with homework at night" },
  { word: "Understanding", quote: "She says she understood. The test says something else.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent talking with a child about a test" },
  { word: "Confidence", quote: "He used to love learning. Now he hides his books.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent encouraging a discouraged child" },
  { word: "Reports", quote: "I meet the teacher once a year. I want to know every week.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Parent at a parent-teacher meeting" },
];
const CYCLE_MS = 4000;

const JOURNEY_WORDS = [
  "moves with you.",
  "meets your questions.",
  "changes with your goals.",
  "grows with your understanding.",
  "opens what comes next.",
];
const JOURNEY_WORD_MS = 3000;

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

const JOURNEY_CATEGORIES1 = ["Primary", "Secondary", "Higher Secondary", "Competitive Exams", "Vocational & Skills", "Higher Education", "Independent Learning"];
const CATEGORY_MS = 4200;

// const TRUST_WORDS = ["child's", "progress.", "trust."];
// const TRUST_WORD_MS = 3000;

// const TRUST_CARDS = [
//   { title: "Private by Design", copy: "Your child's information. Treated with care." },
//   { title: "Safe to grow with", copy: "Built from the first question to what's next." },
//   { title: "Built responsibly.", copy: "Intelligence should help children without compromising matters to them." },
// ];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Know how Visionary fits into your learning.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Know how Visionary fits into your classroom.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "professional", chip: "Professional", copy: "Know how Visionary fits into the work you do.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Know how Visionary fits across your organization.", alt: "Leader talking at an organization table" },
];

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */

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

/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const ParentHeroSection = React.memo(() => (
  <PersonaHero
    words={PARENT_HERO_WORDS}
    srSentence="Parenting, to see what is happening."
    sub="Know what your child is learning, where they need support, and how they are growing — before the report card arrives."
    img={studentHero}
    alt="A parent helping a child with homework"
    ctaLabel="Start as a parent"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */

const STRUGGLE_WORD_STYLE = `
@keyframes struggleWordIn {
  from {
    opacity: 0;
    transform: translate3d(-18px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
`;

const STRUGGLE_IMAGE_STYLE = `
@keyframes struggleImageIn {
  from {
    opacity: 0;
    transform: scale(1.015);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
`;

const StruggleHeading = React.memo(function StruggleHeading({ word, slideKey }) {
  return (
    <h2
      className="font-medium tracking-[0] leading-[1.15] text-[clamp(28px,2.78vw,40px)] lg:leading-[1.08]"
      style={{ color: COLORS.ink }}
    >
      <span className="block">Every</span>
      <span className="block">Parent</span>
      <span className="block">Wonders</span>
      <span className="block">About</span>
      <span className="block overflow-hidden whitespace-nowrap">
        <span
          key={slideKey}
          className="inline-block animate-[struggleWordIn_0.65s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{ color: COLORS.blue }}
        >
          {word}
        </span>
      </span>
    </h2>
  );
});

const STRUGGLE_MAIN_POSITIONS = ["center 30%"];
const STRUGGLE_SATELLITES = [];

const StruggleCluster = React.memo(function StruggleCluster({ slide, slideKey }) {
  return (
    <figure className="m-0 w-full">
      <style>
        {STRUGGLE_WORD_STYLE}
        {STRUGGLE_IMAGE_STYLE}
      </style>

      <div className="relative mx-auto w-full max-w-[520px]">
        {/* circle wrapper — exactly circle-sized, centered in the column */}
        <div className="relative mx-auto w-[86%] max-w-[400px]">
          {/* hand-drawn arrow — lives in the gap BETWEEN heading and circle */}
          <svg
            viewBox="0 0 220 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pointer-events-none absolute -left-[136px] top-1/2 z-10 hidden h-[72px] w-[120px] -translate-y-1/2 lg:block"
            style={{ color: COLORS.ink }}
          >
            <path d="M6 66 C 60 86, 140 84, 198 52" />
            <path d="M198 52 l-16 2" />
            <path d="M198 52 l-6 14" />
          </svg>

          <div className="aspect-square w-full overflow-hidden rounded-full">
            <img
              key={`main-${slideKey}`}
              src={slide.image}
              alt={slide.alt}
              loading="eager"
              decoding="async"
              className="block h-full w-full object-cover animate-[struggleImageIn_0.7s_cubic-bezier(0.22,1,0.36,1)_both]"
              style={{ objectPosition: STRUGGLE_MAIN_POSITIONS[slideKey % STRUGGLE_MAIN_POSITIONS.length] }}
            />
          </div>
        </div>

        {/* quote — centered under the circle */}
        <figcaption
          key={`quote-${slideKey}`}
          aria-live="polite"
          className="hero-fade-up mx-auto mt-8 max-w-[520px] px-4 text-center font-normal tracking-[0] leading-[1.4] text-[clamp(16px,1.39vw,20px)] [animation-delay:120ms] [animation-fill-mode:both] sm:px-0"
          style={{ color: COLORS.ink }}
        >
          {slide.quote}
        </figcaption>
      </div>
    </figure>
  );
});

const CarouselDots = React.memo(function CarouselDots({ total, active, onSelect }) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Student learning challenges">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-label={`Go to challenge ${i + 1}`}
          aria-selected={i === active}
          onClick={() => onSelect(i)}
          className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-10" : "w-2 hover:opacity-70"}`}
          style={{ backgroundColor: i === active ? COLORS.ink : `${COLORS.ink}33` }}
        />
      ))}
    </div>
  );
});

function ParentStruggleSection() {
  const { index, goTo } = UseCycleIndex(SLIDES.length, CYCLE_MS);
  const { ref, visible } = UseRevealContinuous();
  const slide = SLIDES[index];

  return (
    <section ref={ref} data-section="02-struggle" className="relative overflow-x-clip bg-white py-24 lg:py-32">
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-10">
          <div className="mx-auto w-full max-w-[420px] lg:col-span-5 lg:mx-0 lg:max-w-none lg:pl-[4%] xl:pl-[6.5%]">
            <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>
              The problem
            </p>
            <div className="mt-6">
              <StruggleHeading word={slide.word} slideKey={index} />
            </div>
          </div>

          <div className="relative w-full lg:col-span-7 lg:pr-[2%] xl:pr-[4%]">
            <StruggleCluster slide={slide} slideKey={index} />
          </div>
        </div>

        <div className="mt-12 flex justify-center px-6 lg:mt-14">
          <CarouselDots total={SLIDES.length} active={index} onSelect={goTo} />
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 03 · PROMISE ═══════════════════════ */

const ParentPromiseSection = React.memo(function ParentPromiseSection() {
  const { ref, visible } = UseRevealOnce();
  return (
    <section ref={ref} data-section="03-promise" className="relative overflow-hidden px-6 py-24 lg:py-32">
      <h2
        className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        style={{ color: COLORS.ink }}
      >
        What if it never forgot{" "}
        <span style={{ color: COLORS.blue }}>where you left off?</span>
      </h2>
    </section>
  );
});

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

/* Icons per journey stage — reuses icons already imported in this file */
const JOURNEY_STAGE_ICONS = {
  "Primary": Sparkles,
  "Secondary": BookOpen,
  "Secondary & Higher Secondary": BookOpen,
  "Higher Secondary": Layers3,
  "Competitive Exams": Target,
  "Vocational & Skills": RefreshCw,
  "Higher Education": Brain,
  "Learning on Your Own": Clock,
  "Independent Learning": Clock,
};

const JOURNEY_STAGES = [
  { title: "Primary", copy: "From your first questions to the ideas you're ready to explore next.", image: primaryStudent, alt: "Young student drawing on a tablet" },
  { title: "Secondary & Higher Secondary", copy: "When lessons get difficult, understanding keeps up — from class 6 to class 12, every chapter and exam.", image: secondaryStudent, alt: "Teenager working on a laptop in a library" },
  { title: "Competitive Exams", copy: "Move beyond familiar questions and strengthen the reasoning you need when the question changes.", image: competitiveStudent, alt: "Aspirant solving a mock test beside prep books" },
  { title: "Vocational & Skills", copy: "Connect what you learn with practice, projects, and the skills you want to take into the real world.", image: vocationStudent, alt: "Student practising hands-on in a workshop" },
  { title: "Higher Education", copy: "Go deeper, explore your field, and turn what you know into research, projects, and new ideas.", image: higherStudent, alt: "University student reviewing research papers" },
  { title: "Learning on Your Own", copy: "Start with what you want to understand, build, or become better at — and let your learning take shape from there.", image: higherStudent, alt: "Adult learning independently at home" },
];

const JOURNEY_CATEGORIES = ["Primary", "Secondary & Higher Secondary", "Competitive Exams", "Vocational & Skills", "Higher Education", "Learning on Your Own"];

const STAGE_META = {
  "Primary": { Icon: GraduationCap },
  "Secondary & Higher Secondary": { Icon: BookOpen },
  "Competitive Exams": { Icon: Target },
  "Vocational & Skills": { Icon: Layers3 },
  "Higher Education": { Icon: Brain },
  "Learning on Your Own": { Icon: Sparkles },
};

const JOURNEY_MODALS = {
  "Primary": {
    top: "Build the basics.", accent: "Build them right.",
    intro: "Primary learning sets the pattern for everything after. Visionary makes first understanding visual, gentle, and connected.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See it first.", c: "Numbers and words begin as pictures, stories, and voice.", l: "How it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise gently.", c: "Short, encouraging practice that rewards effort, not speed.", l: "Start practising free", to: "/register" },
      { Icon: Globe2, t: "In your language.", c: "First learning happens best in the language a child thinks in.", l: "Language support", to: "/how-it-works" },
      { Icon: UsersRound, t: "Parents stay close.", c: "Progress shared in ways that help at home, not only at report time.", l: "For parents", to: "/parent" },
    ],
  },
  "Secondary & Higher Secondary": {
    top: "One place for", accent: "every subject.",
    intro: "From class 6 to class 12, lessons get deeper and exams get closer. Visionary keeps understanding connected across every chapter, board, and subject.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Sparkles, t: "When it gets difficult.", c: "Explanations adapt until the idea finally makes sense.", l: "See how it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise what matters.", c: "Practice tied to your syllabus and the way your exams ask.", l: "Start practising free", to: "/register" },
      { Icon: BookOpen, t: "Remember it later.", c: "Yesterday's understanding stays available for today's lesson.", l: "Your continuity", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Boards and beyond.", c: "The same understanding carries into competitive preparation.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Competitive Exams": {
    top: "Prepare for the exam.", accent: "Not just the syllabus.",
    intro: "Competitive preparation is reasoning under pressure. Visionary strengthens the thinking that holds when the question changes shape.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Reasoning over memorising.", c: "Understand why a method works, so new questions feel familiar.", l: "See how it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practise under real conditions.", c: "Accuracy, speed, and confidence built together.", l: "Start practising free", to: "/register" },
      { Icon: BookOpen, t: "Learn from every attempt.", c: "Each mock becomes context: what to revise, skip, strengthen.", l: "Your continuity", to: "/how-it-works" },
      { Icon: Clock, t: "Stay steady.", c: "Clear explanations when pressure is high and time is short.", l: "Get support", to: "/help" },
    ],
  },
  "Vocational & Skills": {
    top: "Learn by doing.", accent: "Skills that work.",
    intro: "Vocational learning is meant to be used. Visionary connects practice, projects, and real work into one continuing journey.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: RefreshCw, t: "Practise the real thing.", c: "Skills build through doing — guidance never gives the answer away.", l: "See how it works", to: "/how-it-works" },
      { Icon: Layers3, t: "Build a portfolio.", c: "Turn what you learn into work you can actually show.", l: "Start building free", to: "/register" },
      { Icon: BookOpen, t: "Skills that carry forward.", c: "What you practise now connects to the next skill and job.", l: "Your continuity", to: "/how-it-works" },
      { Icon: UsersRound, t: "Learn with others.", c: "Communities and partners help you practise in real contexts.", l: "Find a partner", to: "/partners" },
    ],
  },
  "Higher Education": {
    top: "Go deeper.", accent: "Build further.",
    intro: "University work asks for depth: research, analysis, and original thinking. Visionary keeps the threads connected across semesters.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "Understand at depth.", c: "Explanations that support serious subject work, not summaries.", l: "See how it works", to: "/how-it-works" },
      { Icon: BookOpen, t: "Research with context.", c: "Keep threads across papers, projects, and semesters.", l: "Your continuity", to: "/how-it-works" },
      { Icon: Layers3, t: "Build from what you know.", c: "Turn coursework into research, projects, and new ideas.", l: "Start building free", to: "/register" },
      { Icon: Building2, t: "Work with your institution.", c: "Visionary can support classrooms, labs, and departments.", l: "For organizations", to: "/organization" },
    ],
  },
  "Learning on Your Own": {
    top: "Your pace.", accent: "Your path.",
    intro: "No syllabus required. Start with what you want to understand, build, or become better at — and let the learning take shape from there.",
    primary: { label: "See how Visionary explains", to: "/how-it-works" },
    blocks: [
      { Icon: Sparkles, t: "Start where you are.", c: "Visionary begins from your question, not a curriculum.", l: "See how it works", to: "/how-it-works" },
      { Icon: Clock, t: "Learn at your pace.", c: "The experience adapts to your time, language, and depth.", l: "Start learning free", to: "/register" },
      { Icon: BookOpen, t: "Keep your place.", c: "Return after weeks away and continue where you stopped.", l: "Your continuity", to: "/how-it-works" },
      { Icon: UsersRound, t: "Find your people.", c: "Communities and updates keep independent learners connected.", l: "Join the community", to: "/community" },
    ],
  },
};

const JourneyCarousel = React.memo(function JourneyCarousel({ stages, onOpen, trackRef, onScroll, canPrev, canNext, scrollByCard }) {
  const ALIGN = "max(1.5rem, calc(50% - 40rem))";

  return (
    <div className="mt-16 lg:mt-20">
      <div
        ref={trackRef}
        onScroll={onScroll}
        style={{ paddingLeft: ALIGN, paddingRight: "max(1.5rem, 6%)", scrollPaddingLeft: ALIGN }}
        className="flex snap-x snap-mandatory gap-12 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stages.map((stage) => {
          const Icon = JOURNEY_STAGE_ICONS[stage.title] || Sparkles;
          return (
            <article key={stage.title} data-card className="w-[85%] shrink-0 snap-start sm:w-[440px] lg:w-[700px] xl:w-[780px]">
              <button
                type="button"
                onClick={() => onOpen(stage)}
                aria-label={`Open details for ${stage.title}`}
                className="group relative block w-full overflow-hidden rounded-[50px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-4"
              >
                <img
                  src={stage.image}
                  alt={stage.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/9] w-full rounded-[50px] object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                />
                {/* stage icon pill — the missing icon layer */}
                <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95" style={{ color: COLORS.blue }}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className="elevation-2 absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-white transition-transform duration-300 group-hover:scale-110" style={{ color: COLORS.ink }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <h3 className="mt-12 text-center font-normal tracking-[0] leading-[1.02] text-[clamp(28px,2.9vw,40px)]" style={{ color: COLORS.ink }}>{stage.title}</h3>
              <p className="mx-auto mt-5 max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{stage.copy}</p>
            </article>
          );
        })}
      </div>
      <div className="mt-12 flex justify-end px-6 lg:mt-16 lg:pr-[9%]">
        <div className="inline-flex items-center gap-10 rounded-full px-8 py-4" style={{ backgroundColor: COLORS.cardSurface }}>
          <button type="button" aria-label="Previous stages" disabled={!canPrev} onClick={() => scrollByCard(-1)} className={`transition-colors ${canPrev ? "hover:opacity-70" : "cursor-default"}`} style={{ color: canPrev ? COLORS.ink : `${COLORS.ink}40` }}>
            <ChevronIcon direction="left" />
          </button>
          <button type="button" aria-label="Next stages" disabled={!canNext} onClick={() => scrollByCard(1)} className={`transition-colors ${canNext ? "hover:opacity-70" : "cursor-default"}`} style={{ color: canNext ? COLORS.ink : `${COLORS.ink}40` }}>
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>
    </div>
  );
});

const JourneyModal = React.memo(function JourneyModal({ stage, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const content = JOURNEY_MODALS[stage.title];
  const meta = STAGE_META[stage.title] || STAGE_META["Primary"];
  if (!content) return null;
  const secondary = content.primary.to === "/how-it-works"
    ? { label: "Start free", to: "/register" }
    : { label: "See how it works", to: "/how-it-works" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 sm:px-6" role="dialog" aria-modal="true" aria-labelledby="journey-modal-title">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-[#121317]/60"
      />

      <div
        className="relative max-h-[88vh] w-full max-w-[1080px] overflow-y-auto rounded-[28px] bg-white p-6 sm:p-10 lg:p-14"
        style={{ animation: "heroFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#121317] text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
          {stage.title}
        </p>

        <h3 id="journey-modal-title" className="mt-3 max-w-[860px] font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(30px,3.8vw,56px)]" style={{ color: COLORS.ink }}>
          {content.top}
          <br />
          <span style={{ color: COLORS.blue }}>{content.accent}</span>
        </h3>

        <div className="relative mt-8 overflow-hidden rounded-[24px]">
          <img src={stage.image} alt={stage.alt} className="aspect-[21/9] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#121317]/60 via-[#121317]/20 to-transparent p-5">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: COLORS.ink }}
            >
              <meta.Icon className="h-3.5 w-3.5" strokeWidth={1.8} style={{ color: COLORS.blue }} />
              Visionary for {stage.title}
            </span>
          </div>
        </div>

        <p className="mt-7 max-w-[680px] font-normal tracking-[0] leading-[1.65] text-[15px] sm:text-[16px]" style={{ color: COLORS.grey }}>
          {content.intro}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            to={content.primary.to}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            style={{ backgroundColor: COLORS.blue }}
          >
            {content.primary.label}
            <ChevronIcon className="h-4 w-4" />
          </Link>
          <Link
            to={secondary.to}
            className="inline-flex h-11 items-center justify-center rounded-full border px-6 text-[14px] transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
            style={{ borderColor: COLORS.mist, color: COLORS.ink }}
          >
            {secondary.label}
          </Link>
        </div>

        <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {content.blocks.map((b) => (
            <div key={b.t} className="border-t pt-6" style={{ borderColor: COLORS.mist }}>
              <div className="flex items-start gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border bg-white"
                  style={{ borderColor: COLORS.mist, color: COLORS.blue }}
                >
                  <b.Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <p className="font-normal tracking-[0] leading-[1.65] text-[14px] sm:text-[15px]" style={{ color: COLORS.grey }}>
                    <strong style={{ color: COLORS.ink }}>{b.t}</strong> {b.c}
                  </p>
                  <Link
                    to={b.to}
                    className="mt-3 inline-flex items-center gap-1.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                    style={{ color: COLORS.blue }}
                  >
                    {b.l}
                    <ChevronIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

function ParentJourneySection() {
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
    <section ref={ref} data-section="04-journey" className="relative overflow-hidden py-24 lg:py-32">
      <FadeReveal visible={visible}>
        {/* header — eyebrow / heading / one-line sub */}
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.ink }}>
          Your learning, your journey
        </p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Learning that
          <br className="hidden md:block" />{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{JOURNEY_WORDS[index]}</span>
        </h2>
        <p
          className="mx-auto mt-6 w-full max-w-[900px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px] lg:whitespace-nowrap lg:px-0"
          style={{ color: COLORS.grey }}
        >
          Wherever you begin, Visionary helps your learning move forward from there.
        </p>

        {/* stage rail — even beat under the header */}
        <div className="mt-14 px-6 lg:mt-20">
          <div className="flex gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:justify-center lg:gap-4 lg:overflow-visible lg:py-0" role="tablist" aria-label="Learning stages">
            {JOURNEY_STAGES.map((stage, i) => {
              const Icon = JOURNEY_STAGE_ICONS[stage.title] || Sparkles;
              const active = i === activeStage;
              return (
                <button
                  key={stage.title}
                  type="button"
                  role="tab"
                  aria-selected={active}
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
      />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} />}
    </section>
  );
}

/* ═══════════════════════ 05 · INTELLIGENCE ═══════════════════════ */

const IntelligenceCopy = React.memo(function IntelligenceCopy({ step }) {
  return (
    <div key={step.title} className="hero-fade-up max-w-[460px]">
      <h3 className="whitespace-pre-line font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
        {step.title}
      </h3>
      <p className="mt-10 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
        {step.copy}
      </p>
    </div>
  );
});

const IntelligenceVisual = React.memo(function IntelligenceVisual({ step, index, setStepRef }) {
  return (
    <figure ref={setStepRef(index)} data-step={index} className="m-0">
      <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[60px] lg:mx-0 lg:max-w-none">
        <img
          src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png"
          alt={step.title}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover lg:aspect-[15/16]"
        />
      </div>
    </figure>
  );
});

function ParentIntelligenceSection() {
  const { ref: headRef, visible } = UseRevealOnce();
  const { index: wordIndex } = UseCycleIndex(INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);
  const { active, setStepRef } = UseActiveStep(INTELLIGENCE_STEPS.length);
  const current = INTELLIGENCE_STEPS[active];

  return (
    <section ref={headRef} className="relative [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible} className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>
          The intelligence behind your learning
        </p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>
            {INTELLIGENCE_WORDS[wordIndex]}
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Visionary keeps the learning moving from the first question to the moment you can use what you've learned.
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
              <IntelligenceVisual step={s} index={i} setStepRef={setStepRef} />
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

const ParentClosingSection = React.memo(function ParentClosingSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(KEEPS_WORDS.length, KEEPS_WORD_MS);
  return (
    <section ref={ref} data-section="06-closing" className="relative px-6 py-24 lg:py-32">
      <p
        className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
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
const LanguageChips = React.memo(function LanguageChips({ active, onSelect }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Language selection">
      {LANGUAGE_CHIPS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          aria-pressed={active === lang.code}
          onClick={() => onSelect(lang.code)}
          className={`rounded-full px-5 py-2 uppercase tracking-[0] leading-[14px] text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${active === lang.code ? "font-medium" : "font-normal border hover:bg-[#121317]/5"}`}
          style={{
            backgroundColor: active === lang.code ? COLORS.chipBg : "transparent",
            color: COLORS.ink,
            borderColor: active === lang.code ? "transparent" : `${COLORS.ink}40`,
          }}
        >
          {lang.label}
        </button>
      ))}
      <span className="ml-1 font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>
        +20 languages
      </span>
    </div>
  );
});

function ParentLanguageSection() {
  const { ref, visible } = UseRevealOnce();
  const [lang, setLang] = useState("hi");
  const { index } = UseCycleIndex(LANGUAGE_QUESTIONS.length, QUESTION_MS);
  const question = LANGUAGE_QUESTIONS[index][lang];
  const activeLabel = LANGUAGE_CHIPS.find((c) => c.code === lang)?.label || lang;

  return (
    <section ref={ref} data-section="07-language" className="relative px-6 py-24 lg:py-32">
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <FadeReveal visible={visible}>
        {/* header unit — tight */}
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Our language</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          The words can change.<br />Understanding shouldn't.
        </h2>
        <p className="mx-auto mt-6 max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Ask, learn, and practice in the language that feels natural to you. Visionary keeps the meaning, context, and learning journey connected as your language changes.
        </p>

        {/* Breath 1 — control first */}
        <div className="mt-14 lg:mt-20">
          <LanguageChips active={lang} onSelect={setLang} />
        </div>

        {/* Breath 2 — FLAT Google voice surface: no card, no border, type on the page */}
        <div className="mx-auto mt-16 w-full max-w-[860px] lg:mt-24">
          {/* Assistant-signature four-color voice indicator */}
          <div className="flex items-end justify-center gap-2" aria-hidden="true">
            {["#4285F4", "#4285F4", "#4285F4", "#4285F4"].map((c, i) => (
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
            className="mx-auto mt-8 max-w-[760px] text-center font-normal tracking-[0] leading-[1.25] text-[clamp(26px,3.4vw,48px)]"
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
              Think your way — voice or text, in the language you're comfortable with.
            </p>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 08 · CONTINUITY ═══════════════════════ */

const StageDropdown = React.memo(function StageDropdown({ stages, active, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-full border px-8 py-3 font-normal tracking-[0] leading-[20px] text-[15px] transition-colors hover:bg-[#121317]/5"
        style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
      >
        {stages[active].name}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Choose a stage" className="elevation-2 absolute left-1/2 z-20 mt-3 w-60 -translate-x-1/2 overflow-hidden rounded-[20px] bg-white py-2">
          {stages.map((s, i) => (
            <li key={s.name}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onClick={() => { onSelect(i); setOpen(false); }}
                className={`block w-full px-5 py-2.5 text-left text-[14px] tracking-[0] transition-colors ${i === active ? "bg-[#D2E3FC] font-medium" : "font-normal hover:bg-[#121317]/5"}`}
                style={{ color: COLORS.ink }}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const CATEGORY_SECTION_IMG = [primaryStudent, secondaryStudent, competitiveStudent, vocationStudent, higherStudent];

const ContinuityCard = React.memo(function ContinuityCard({ index, label, caption, text, imgClass = "", className = "" }) {
  return (
    <div className={className}>
      <p className="mb-6 text-center font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>
        {label}
      </p>
      <div className="relative overflow-hidden rounded-[48px]">
        <img
          src={CATEGORY_SECTION_IMG[index % CATEGORY_SECTION_IMG.length]}
          alt={`${label}: ${text}`}
          loading="lazy"
          decoding="async"
          className={`h-[320px] w-full object-cover sm:h-[420px] ${imgClass}`}
        />
  
   <div className="absolute inset-0 bg-gradient-to-t from-[#121317]/55 via-[#121317]/20 to-transparent" aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center px-4">
          <span key={text} className="hero-fade-up text-center font-medium tracking-[0] leading-[1.03] text-white text-[clamp(40px,4.5vw,72px)]">
            {text}
          </span>
        </div>
      </div>
      <p className="mt-6 text-center font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>
        {caption}
      </p>
    </div>
  );
});

function ParentContinuitySection() {
  const { ref, visible } = UseRevealOnce();
  const { index, goTo, step } = UseStageIndex(CONTINUITY_STAGES.length);
  const stage = CONTINUITY_STAGES[index];

  return (
    <section ref={ref} data-section="08-continuity" className="relative py-24 lg:py-32 [overflow-x:clip]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>
          Your continuity
        </p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          What you learn stays with you.
        </h2>
        <p className="mx-auto mt-6 max-w-[700px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          What you understand, practise, and build becomes part of what comes next. You don't have to start over.
        </p>
        <div className="mt-14 flex justify-center lg:mt-20">
          <StageDropdown stages={CONTINUITY_STAGES} active={index} onSelect={goTo} />
        </div>
        <div className="mt-14 grid grid-cols-1 gap-16 px-6 lg:mt-20 lg:grid-cols-3 lg:gap-12 lg:px-0">
          <ContinuityCard index={index} label="Previous" caption="What you learned" text={stage.previous} imgClass="lg:h-[400px]" className="lg:-ml-[6vw]" />
          <ContinuityCard index={index} label="Now" caption="What you're working on" text={stage.now} imgClass="lg:h-[600px]" className="lg:mt-[100px]" />
          <ContinuityCard index={index} label="Next" caption="Where you can go" text={stage.next} imgClass="lg:h-[370px]" className="lg:-mr-[6vw] lg:mt-[20px]" />
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
const ACHIEVEMENT_IMAGE = [studentHero, studentachivenment, studentbuild];

/* icon per achievement tab — reuses icons already imported in this file */
const ACHIEVEMENT_META = [
  { Icon: Eye },      /* Understand */
  { Icon: Target },   /* Achieve */
  { Icon: Layers3 },  /* Build */
];

const AchievementAccordion = React.memo(function AchievementAccordion({ tabs, open, onToggle }) {
  return (
    <div>
      {tabs.map((tab, i) => {
        const Meta = ACHIEVEMENT_META[i] || ACHIEVEMENT_META[0];
        const isOpen = open === i;
        return (
          <div key={tab.black} className="border-b py-10 first:pt-0 lg:py-12" style={{ borderColor: `${COLORS.ink}26` }}>
            
            <button type="button" aria-expanded={isOpen} onClick={() => onToggle(i)} className="flex w-full items-start gap-7 text-left">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white transition-colors"
                style={{ borderColor: isOpen ? COLORS.blue : `${COLORS.ink}26`, color: isOpen ? COLORS.blue : COLORS.grey }}
              >
                <Meta.Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <h3 className="max-w-[460px] flex-1 font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
                {tab.black} <span style={{ color: COLORS.blue }}>{tab.blue}</span>
              </h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`mt-3 h-6 w-6 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} style={{ color: COLORS.grey }}>
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
            <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="max-w-[460px] pt-6 font-normal tracking-[0] leading-[22px] text-[15px] lg:pl-[72px]" style={{ color: COLORS.grey }}>
                  {tab.copy}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});


function ParentAchievementSection() {
  const { ref, visible } = UseRevealOnce();
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState(0);

  const toggle = useCallback((i) => {
    const next = open === i ? (i === 0 ? 1 : i - 1) : i;
    setOpen(next);
    setActive(next);
  }, [open]);

  return (
    <section ref={ref} data-section="09-achievement" className="relative py-24 lg:py-32 [overflow-x:clip]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Your achievement</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>See what you can achieve with intelligence.</h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Turn what you understand into stronger results, useful skills, meaningful work, and progress you can see.
        </p>

        {/* Breath 2 — accordion + image, balanced columns */}
        <div className="mx-auto mt-14 grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 lg:mt-28 lg:grid-cols-2 lg:items-center lg:gap-24 lg:px-0">
          <AchievementAccordion tabs={ACHIEVEMENT_TABS} open={open} onToggle={toggle} />
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


const JourneyCategoryCard = React.memo(function JourneyCategoryCard({ index, text, className = "" }) {
  const Icon = JOURNEY_STAGE_ICONS[text] || Sparkles;
  return (
    <div className={`relative overflow-hidden rounded-[48px] ${className}`}>
      <img
        src={CATEGORY_SECTION_IMG[index % CATEGORY_SECTION_IMG.length]}
        alt={text}
        loading="lazy"
        decoding="async"
        className="aspect-[20/19] w-full object-cover"
      />
      {/* scrim — guarantees white type contrast on any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121317]/55 via-[#121317]/20 to-transparent" aria-hidden="true" />
      {/* stage icon pill — consistency with journey cards */}
      <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95" style={{ color: COLORS.blue }}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <span key={text} className="text-center font-medium tracking-[0] leading-[1.03] text-white text-[clamp(40px,4.5vw,72px)] animate-[heroFadeUp_0.9s_cubic-bezier(0.22,1,0.36,1)]">
          {text}
        </span>
      </div>
    </div>
  );
});

function ParentJourneyFlowSection() {
  const { ref, visible } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];

  return (
    <section ref={ref} data-section="10-journey-flow" className="relative bg-white py-24 lg:py-32 [overflow-x:clip]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your journey changes.<br />Your learning stays with you.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          As your subjects, skills, interests, and goals change, Visionary keeps giving you a place to continue learning, creating, and moving forward.
        </p>

        {/* Breath 2 — cascade + closing column */}
        <div className="mx-auto mt-14 grid w-full max-w-[1900px] grid-cols-1 items-center gap-16 px-6 lg:mt-28 lg:grid-cols-[7fr_5fr] lg:gap-24 lg:pl-[10%] lg:pr-12">
          {/* cascade: card → connector → card (in-flow, never overlapping) */}
          <div className="relative">
            <JourneyCategoryCard index={index} text={first} className="mx-auto max-w-[430px] lg:mx-0" />
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
            <JourneyCategoryCard index={index + 1} text={second} className="ml-[10%] max-w-[430px] lg:ml-[28%]" />
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
  { title: "Private by design.", copy: "Your personal information is treated with care.", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Safe to grow with.", copy: "Built from the first question to what's next.", Icon: HeartHandshake, to: "/security", link: "See security practices" },
  { title: "Built responsibly.", copy: "Intelligence should help people without compromising what matters to them.", Icon: Scale, to: "/terms", link: "Terms & commitments" },
];

const TrustCard = React.memo(function TrustCard({ card }) {
  return (
    <div className="elevation-1 relative w-full max-w-[780px] shrink-0 overflow-hidden rounded-[32px] border bg-white" style={{ borderColor: `${COLORS.ink}1A` }}>
      <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={card.title} loading="lazy" decoding="async" className="aspect-[8/5] w-full object-cover" />
      {/* white chip guarantees copy contrast on any image */}
      <div className="absolute left-6 top-6 sm:left-8 sm:top-8 sm:max-w-[320px]">
        <div className="rounded-[20px] bg-white/95 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.chipBg, color: COLORS.blue }}>
            <card.Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <p className="mt-3 font-normal tracking-[0] leading-[22px] text-[15px]" style={{ color: COLORS.ink }}>{card.copy}</p>
          <Link to={card.to} className="mt-3 inline-flex items-center gap-1.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
            {card.link}
            <ChevronIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
});

function ParentTrustSection() {
  const { ref, visible } = UseRevealOnce();
  const { index, goTo } = UseCycleIndex(TRUST_CARDS.length, TRUST_WORD_MS);
  const active = TRUST_CARDS[index];
  const next = TRUST_CARDS[(index + 1) % TRUST_CARDS.length];
  const stepCards = useCallback((d) => goTo(index + d), [goTo, index]);

  return (
    <section ref={ref} data-section="11-trust" className="relative bg-white py-24 lg:py-32 [overflow-x:clip]">
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Our trust</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{TRUST_WORDS[index]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Your questions, conversations, ideas, and progress are personal. Visionary is designed with privacy, security, and transparency at the heart of the experience.
        </p>

        {/* Breath 2 — narrative column + preview cards */}
        <div className="mx-auto mt-14 grid w-full max-w-[1600px] grid-cols-1 items-start gap-16 px-6 lg:mt-20 lg:grid-cols-[4fr_8fr] lg:gap-24 lg:px-0">
          <div className="lg:pl-2">
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

          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <div key={`a-${index}`} className="hero-fade-up w-full max-w-[780px] shrink-0"><TrustCard card={active} /></div>
            <div key={`b-${index}`} className="hero-fade-up w-full max-w-[780px] shrink-0 [animation-delay:80ms] [animation-fill-mode:both]"><TrustCard card={next} /></div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ 12 · CTA ═══════════════════════ */

const ParentCTASection = React.memo(function ParentCTASection() {
  const { ref, visible } = UseRevealOnce();
  return (
    <section ref={ref} data-section="12-cta" className="relative px-6 py-24 lg:py-32">
      <div
        className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      >
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>
          Start where you are
        </p>
        <h2 className="mt-4 font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your learning starts with where you are.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Explore what you're learning, ask your first question, and start building from what you know.
        </p>
        <div className="mt-12 flex justify-center">
          <Link
            to="/register"
            className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: COLORS.blue }}
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
});

/* ═══════════════════════ 13 · EXPLORE ═══════════════════════ */

const ExploreCard = React.memo(function ExploreCard({ index, category }) {
  return (
    <Link
      to={`/${category.slug}`}
      data-card
      className="elevation-1 block w-[260px] shrink-0 snap-start overflow-hidden rounded-[24px] border bg-white sm:w-[320px]"
      style={{ borderColor: `${COLORS.ink}1A` }}
    >
      <img src={EXPLORE_CAT_IMG[index]} alt={category.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
      <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>
          {category.chip}
        </p>
        <p className="mt-3 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>
          {category.copy}
        </p>
        <span className="mt-4 font-normal tracking-[0] leading-[22px] text-[16px]" style={{ color: COLORS.blue }}>
          Explore more
        </span>
      </div>
    </Link>
  );
});

function ParentExploreSection() {
  const { ref, visible } = UseRevealOnce();
  const { trackRef, canNext, scrollByCard, update } = UseScrollTrack();

  return (
    <section ref={ref} data-section="13-explore" className="relative py-16 lg:py-24 [overflow-x:clip]">
      <FadeReveal visible={visible}>
        <h2 className="px-6 font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)] lg:pl-[6.5%] lg:pr-6" style={{ color: COLORS.ink }}>
          Explore more categories
        </h2>
        <div className="relative mt-16 lg:mt-20">
          <div
            ref={trackRef}
            onScroll={update}
            className="flex snap-x snap-mandatory gap-8 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-12 lg:pl-[calc(6.5%_+_480px)] lg:pr-6"
          >
            {EXPLORE_CATEGORIES.map((c, index) => (
              <ExploreCard index={index} key={c.slug} category={c} />
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

export default function ParentPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <ParentHeroSection />
        <ParentStruggleSection />
        <ParentPromiseSection />
        <ParentJourneySection />
        <ParentIntelligenceSection />
        <ParentClosingSection />
        <ParentLanguageSection />
        <ParentContinuitySection />
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