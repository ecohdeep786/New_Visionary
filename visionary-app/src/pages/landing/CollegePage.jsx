import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ DESIGN TOKENS ═══ */
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

/* ═══ CONTROLLERS ═══ */
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

/* ═══ PROFESSIONAL MODELS ═══ */
const PRO_HERO_WORDS = ["impact.", "compound.", "ship"];
const HERO_WORD_MS = 2800;

const PRO_SLIDES = [
  { word: "Application", quote: "I took three courses. I still don't know how to use them at work.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Professional trying to apply learning at work" },
  { word: "Relevance", quote: "I read every article. The next project still feels like the first.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Professional surrounded by resources" },
  { word: "Growth", quote: "Five years in, and I can't show what I've actually learned.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Professional reflecting on career growth" },
  { word: "Focus", quote: "Between meetings and deadlines, learning keeps getting postponed.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Professional balancing work and learning" },
  { word: "Results", quote: "My team ships. I still don't know if we're building it right.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Professional reviewing team work" },
];
const CYCLE_MS = 4000;

const PRO_JOURNEY_STAGES = [
  { title: "Early Career", copy: "Turn every first project into real skill — not just another line on your resume.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Early career professional at work" },
  { title: "Mid-Level", copy: "When the questions get harder and the decisions matter more, Visionary helps you reason through them.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Mid-level professional solving problems" },
  { title: "Senior", copy: "Your judgement is your product. Visionary sharpens it by connecting what you've done to what comes next.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Senior professional mentoring and leading" },
  { title: "Leadership", copy: "Lead with clarity — see what your team understands, where they're stuck, and what they're ready for.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Leader reviewing team progress" },
  { title: "Specialist", copy: "Go deep without losing context. Every paper, project, and problem builds on the last.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Specialist deep in their domain" },
  { title: "Entrepreneur", copy: "Turn ideas into shipped work — with intelligence that remembers every decision and every lesson.", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Entrepreneur building something real" },
];

const PRO_INTELLIGENCE_WORDS = ["Every project connected.", "Every skill connected.", "Every decision connected.", "Every idea connected."];
const INTELLIGENCE_WORD_MS = 3000;

const PRO_INTELLIGENCE_STEPS = [
  { title: "Understand the work before you do it.", copy: "Visionary reads the context, remembers what you've done before, and helps you reason through the problem — not just execute it." },
  { title: "Turn every project into a lesson.", copy: "Every decision, every failure, every shipped feature becomes part of what you understand next — not just another ticket closed." },
  { title: "Carry your expertise across teams and tools.", copy: "Your knowledge shouldn't reset every time you switch projects, companies, or tech stacks. Visionary keeps the continuity." },
  { title: "Know what your work is actually building toward.", copy: "See whether your skills are compounding or stalling — and what the next meaningful step looks like." },
];

const PRO_KEEPS_WORDS = ["applying", "building", "solving"];
const KEEPS_WORD_MS = 2500;

const LANGUAGE_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];
const PRO_LANGUAGE_QUESTIONS = [
  { hi: "Iss project ka architecture kaise behtar karun?", en: "How do I improve the architecture of this project?", bn: "এই প্রজেক্টের আর্কিটেকচার কীভাবে উন্নত করব?", ta: "இந்த திட்டத்தின் கட்டமைப்பை எப்படி மேம்படுத்துவது?", kn: "ಈ ಯೋಜನೆಯ ವಾಸ್ತುಶಿಲ್ಪವನ್ನು ಹೇಗೆ ಸುಧಾರಿಸುವುದು?", pa: "ਇਸ ਪ੍ਰੋਜੈਕਟ ਦਾ ਆਰਕੀਟੈਕਚਰ ਕਿਵੇਂ ਬਿਹਤਰ ਬਣਾਵਾਂ?" },
  { hi: "Mera team is problem ko kaise solve kare?", en: "How should my team solve this problem?", bn: "আমার দল এই সমস্যা কীভাবে সমাধান করবে?", ta: "என் குழு இந்த பிரச்சினையை எப்படி தீர்க்க வேண்டும்?", kn: "ನನ್ನ ತಂಡ ಈ ಸಮಸ್ಯೆಯನ್ನು ಹೇಗೆ ಪರಿಹರಿಸಬೇಕು?", pa: "ਮੇਰੀ ਟੀਮ ਇਸ ਸਮੱਸਿਆ ਨੂੰ ਕਿਵੇਂ ਹੱਲ ਕਰੇ?" },
  { hi: "Next quarter ke liye main kaunsi skill seekhun?", en: "Which skill should I learn for next quarter?", bn: "পরবর্তী কোয়ার্টারের জন্য আমি কোন দক্ষতা শিখব?", ta: "அடுத்த காலாண்டிற்கு நான் எந்த திறனை கற்க வேண்டும்?", kn: "ಮುಂದಿನ ತ್ರೈಮಾಸಿಕಕ್ಕೆ ನಾನು ಯಾವ ಕೌಶಲ್ಯ ಕಲಿಯಬೇಕು?", pa: "ਅਗਲੀ ਤਿਮਾਹੀ ਲਈ ਮੈਂ ਕਿਹੜਾ ਹੁਨਰ ਸਿੱਖਾਂ?" },
];
const QUESTION_MS = 3200;

const PRO_CONTINUITY_STAGES = [
  { name: "New Project", previous: "Last project", now: "Current problem", next: "Next decision" },
  { name: "Mid-Career", previous: "Early lessons", now: "Current work", next: "Next role" },
  { name: "Leadership", previous: "Your craft", now: "Your team", next: "Your vision" },
  { name: "Specialist", previous: "Foundations", now: "Your domain", next: "Your contribution" },
  { name: "Entrepreneur", previous: "Your ideas", now: "Your product", next: "Your company" },
  { name: "Career Change", previous: "Your experience", now: "Your transition", next: "Your new path" },
];

const PRO_ACHIEVEMENT_TABS = [
  { black: "Understand", blue: "the problems you're working on.", copy: "See every problem through the lens of what you've solved before — and what you still need to learn." },
  { black: "Solve", blue: "with intelligence behind you.", copy: "Get past the stuck moment faster. Visionary surfaces the exact concept, example, or previous decision that unlocks the next step." },
  { black: "Build", blue: "what you actually came here to build.", copy: "Turn learning into shipped work — real projects, real products, real skills that compound over your career." },
];

const JOURNEY_CATEGORIES = ["Early Career", "Mid-Level", "Senior", "Leadership", "Specialist", "Entrepreneur", "Career Change"];
const CATEGORY_MS = 4200;

const PRO_TRUST_WORDS = ["work.", "ideas.", "career."];
const TRUST_WORD_MS = 3000;
const PRO_TRUST_CARDS = [
  { title: "Private by Design", copy: "Your work. Your ideas. Treated with care." },
  { title: "Safe to grow with", copy: "Built from the first project to what's next." },
  { title: "Built responsibly.", copy: "Intelligence should help professionals without compromising matters to them." },
];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Know how Visionary fits into your learning.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Know how Visionary fits into your classroom.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "Know how Visionary fits into your child's journey.", alt: "Parent helping a child at a desk" },
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

/* ═══ 01 · HERO ═══ */
const ProHeroSection = React.memo(function ProHeroSection() {
  const { index } = useCycleIndex(PRO_HERO_WORDS.length, HERO_WORD_MS);
  const display = "hero-fade-up block whitespace-nowrap font-medium leading-[1] tracking-[-0.01em] text-[clamp(56px,9.5vw,168px)]";
  return (
    <section className="relative overflow-hidden" style={{fontFamily: FONT_FAMILY }}>
      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1756px] flex-col justify-center px-6 py-24 lg:block lg:px-0 lg:py-0">
        <h1 className="sr-only">Building, to impact.</h1>
        <span aria-hidden="true" className={`${display} lg:absolute lg:left-[6.5%] lg:top-[23%]`} style={{ color: COLORS.ink }}>Building,</span>
        <span aria-hidden="true" className={`${display} mt-4 lg:mt-0 lg:absolute lg:left-[45%] lg:top-[49.5%]`} style={{ color: COLORS.ink }}>
          to{" "}
          <span key={index} className="hero-fade-up inline-block">{PRO_HERO_WORDS[index]}</span>
        </span>
        <p className="hero-fade-up mt-10 max-w-[320px] font-normal tracking-[0] leading-[1.6] text-[16px] lg:absolute lg:left-[7%] lg:top-[53%] lg:mt-0 xl:max-w-[410px]" style={{ color: COLORS.grey }}>
          Every project you ship, every problem you solve, every skill you grow — Visionary keeps your work connected to what comes next, for as long as you keep building.
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
      <span className="block">Professional</span>
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
function ProStruggleSection() {
  const { index, goTo } = useCycleIndex(PRO_SLIDES.length, CYCLE_MS);
  const { ref, visible } = useRevealContinuous();
  const slide = PRO_SLIDES[index];
  return (
    <section ref={ref} className="relative overflow-hidden bg-white py-24" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1756px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-12 lg:gap-10 lg:px-0">
          <div className="lg:col-span-4 lg:pl-[6.5%]"><StruggleHeading word={slide.word} slideKey={index} /></div>
          <div className="lg:col-span-8 lg:pr-[6%]"><StruggleMedia slide={slide} slideKey={index} /></div>
        </div>
        <div className="mt-14 flex justify-center"><CarouselDots total={PRO_SLIDES.length} active={index} onSelect={goTo} /></div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 03 · PROMISE ═══ */
const ProPromiseSection = React.memo(function ProPromiseSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY }}>
      <h2 className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        What if every skill you learned actually <span style={{ color: COLORS.blue }}>made it into your work?</span>
      </h2>
    </section>
  );
});

/* ═══ 04 · JOURNEY (RESTORED) ═══ */
const JourneyCarousel = React.memo(function JourneyCarousel({ stages }) {
  const { trackRef, canPrev, canNext, scrollByCard, update } = useScrollTrack();
  const ALIGN = "max(1.5rem, calc(50% - 40rem))";
  return (
    <div className="mt-28 lg:mt-72">
      <div ref={trackRef} onScroll={update} style={{ paddingLeft: ALIGN, paddingRight: "max(1.5rem, 6%)", scrollPaddingLeft: ALIGN }}
        className="flex snap-x snap-mandatory gap-12 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stages.map((stage) => (
          <article key={stage.title} data-card className="w-[85%] shrink-0 snap-start sm:w-[440px] lg:w-[700px] xl:w-[780px]">
            <img src={stage.image} alt={stage.alt} loading="lazy" decoding="async" className="aspect-[16/9] w-full rounded-[50px] object-cover" />
            <h3 className="mt-12 text-center font-normal tracking-[0] leading-[1.02] text-[clamp(28px,2.9vw,40px)]" style={{ color: COLORS.ink }}>{stage.title}</h3>
            <p className="mx-auto mt-5 max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{stage.copy}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 flex justify-end px-6 lg:pr-[9%]">
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
function ProJourneySection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(PRO_JOURNEY_STAGES.length, 3000);
  return (
    <section ref={ref} className="relative overflow-hidden py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.ink }}>Your career, your journey</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          What happens when work
          <br className="hidden md:block" />{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{["moves with your career?", "meets your challenges", "grows with your goals", "compounds with your skills", "opens what comes next"][index]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[640px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Wherever your career begins, Visionary helps your work move forward from there.
        </p>
        <div className="mt-20 flex justify-center px-6 lg:mt-40">
          <div className="flex h-[200px] w-full max-w-[800px] items-center justify-center rounded-[32px] p-6 sm:h-[240px] sm:p-10" style={{ backgroundColor: COLORS.cardSurfaceAlt }}>
            <svg className="h-24 w-24" style={{ color: `${COLORS.blue}66` }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      </FadeReveal>
      <JourneyCarousel stages={PRO_JOURNEY_STAGES} />
    </section>
  );
}

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
function ProIntelligenceSection() {
  const { ref: headRef, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(PRO_INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);
  const { active, setStepRef } = useActiveStep(PRO_INTELLIGENCE_STEPS.length);
  const current = PRO_INTELLIGENCE_STEPS[active];
  return (
    <section ref={headRef} className="relative [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible} className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>The intelligence behind your work</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{PRO_INTELLIGENCE_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Visionary keeps your work moving — from the first problem of the day to the skills that define your career.
        </p>
      </FadeReveal>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-60 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center"><IntelligenceCopy step={current} /></div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {PRO_INTELLIGENCE_STEPS.map((s, i) => (
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
const ProClosingSection = React.memo(function ProClosingSection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(PRO_KEEPS_WORDS.length, KEEPS_WORD_MS);
  return (
    <section ref={ref} className="relative px-6 py-24 pt-10 lg:py-32 lg:pt-14" style={{ fontFamily: FONT_FAMILY }}>
      <p className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        Visionary keeps{" "}
        <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{PRO_KEEPS_WORDS[index]}</span>{" "}
        with you until every skill compounds into the work you came here to do.
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
function ProLanguageSection() {
  const { ref, visible } = useRevealOnce();
  const [lang, setLang] = useState("en");
  const { index } = useCycleIndex(PRO_LANGUAGE_QUESTIONS.length, QUESTION_MS);
  const question = PRO_LANGUAGE_QUESTIONS[index][lang];
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Our language</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your work.<br />In your language.
        </h2>
        <p className="mx-auto mt-6 max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Think, ask, and solve in the language that feels natural to you. Visionary keeps the reasoning, the context, and the decision connected.
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
              <p className="font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>Think your way</p>
              <p className="mt-1 font-normal tracking-[0] leading-[19px] text-[13px]" style={{ color: COLORS.grey }}>Use voice or text in the way you're comfortable.</p>
            </div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 08 · CONTINUITY (RESTORED) ═══ */
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
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-full border px-8 py-3 font-normal tracking-[0] leading-[20px] text-[15px] transition-colors hover:bg-[#121317]/5"
        style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
        {stages[active].name}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Choose a stage" className="elevation-2 absolute left-1/2 z-20 mt-3 w-60 -translate-x-1/2 overflow-hidden rounded-[20px] bg-white py-2">
          {stages.map((s, i) => (
            <li key={s.name}>
              <button type="button" role="option" aria-selected={i === active} onClick={() => { onSelect(i); setOpen(false); }}
                className="block w-full px-5 py-2.5 text-left text-[14px] tracking-[0] transition-colors"
                style={{ backgroundColor: i === active ? COLORS.chipBg : "transparent", color: COLORS.ink, fontWeight: i === active ? 500 : 400 }}>
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
const ContinuityCard = React.memo(function ContinuityCard({ label, caption, text, imgClass = "", className = "" }) {
  return (
    <div className={className}>
      <p className="mb-6 text-center font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>{label}</p>
      <div className="relative overflow-hidden rounded-[48px]">
        <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={`${label}: ${text}`} loading="lazy" decoding="async" className={`h-[320px] w-full object-cover sm:h-[420px] ${imgClass}`} />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <span key={text} className="hero-fade-up text-center font-medium tracking-[0] leading-[1.03] text-white text-[clamp(40px,4.5vw,72px)]">{text}</span>
        </div>
      </div>
      <p className="mt-6 text-center font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>{caption}</p>
    </div>
  );
});
function ProContinuitySection() {
  const { ref, visible } = useRevealOnce();
  const { index, goTo, step } = useStageIndex(PRO_CONTINUITY_STAGES.length);
  const stage = PRO_CONTINUITY_STAGES[index];
  return (
    <section ref={ref} className="relative py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Your continuity</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>What you build stays with you.</h2>
        <p className="mx-auto mt-6 max-w-[700px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          What you ship, what you learn, and what you solve becomes part of what comes next. You don't have to start over — and neither does your team.
        </p>
        <div className="mt-16 flex justify-center"><StageDropdown stages={PRO_CONTINUITY_STAGES} active={index} onSelect={goTo} /></div>
        <div className="mt-20 grid grid-cols-1 gap-16 px-6 lg:mt-24 lg:grid-cols-3 lg:gap-12 lg:px-0">
          <ContinuityCard label="Previous" caption="What you learned" text={stage.previous} imgClass="lg:h-[400px]" className="lg:-ml-[6vw]" />
          <ContinuityCard label="Now" caption="What you're building" text={stage.now} imgClass="lg:h-[600px]" className="lg:mt-[120px]" />
          <ContinuityCard label="Next" caption="Where you're heading" text={stage.next} imgClass="lg:h-[370px]" className="lg:-mr-[6vw] lg:mt-[330px]" />
        </div>
        <div className="mt-16 flex justify-center gap-4 lg:mt-24">
          <button type="button" aria-label="Previous stage" onClick={() => step(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            <ChevronIcon direction="left" />
          </button>
          <button type="button" aria-label="Next stage" onClick={() => step(1)} className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            <ChevronIcon direction="right" />
          </button>
        </div>
        <p className="mt-20 px-6 text-center font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.9vw,42px)]" style={{ color: COLORS.ink }}>Your work keeps its place.</p>
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
function ProAchievementSection() {
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
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>See what you can achieve with intelligence.</h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Turn what you understand into shipped work — real projects, real skills, and a career that compounds.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 lg:mt-32 lg:grid-cols-2 lg:gap-24 lg:px-0">
          <AchievementAccordion tabs={PRO_ACHIEVEMENT_TABS} open={open} onToggle={toggle} />
          <div className="relative">
            <div key={active} className="hero-fade-up">
              <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={`${PRO_ACHIEVEMENT_TABS[active].black} ${PRO_ACHIEVEMENT_TABS[active].blue}`} loading="lazy" decoding="async" className="h-[320px] w-full object-cover lg:h-[780px]" />
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
function ProJourneyFlowSection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(JOURNEY_CATEGORIES.length - 1, CATEGORY_MS);
  const first = JOURNEY_CATEGORIES[index];
  const second = JOURNEY_CATEGORIES[index + 1];
  return (
    <section ref={ref} className="relative bg-white py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your work changes.<br />Your intelligence grows with you.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          As your role, your tools, and your goals evolve, Visionary keeps giving you a place to continue learning, building, and shipping.
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
            Wherever your career goes, your intelligence travels with you.
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
function ProTrustSection() {
  const { ref, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(PRO_TRUST_WORDS.length, TRUST_WORD_MS);
  const [cardIndex, setCardIndex] = useState(0);
  const stepCards = useCallback((d) => setCardIndex((i) => (i + d + PRO_TRUST_CARDS.length) % PRO_TRUST_CARDS.length), []);
  const active = PRO_TRUST_CARDS[cardIndex];
  const next = PRO_TRUST_CARDS[(cardIndex + 1) % PRO_TRUST_CARDS.length];
  return (
    <section ref={ref} className="relative bg-white py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Our trust</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{PRO_TRUST_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Your projects, ideas, and career decisions are personal. Visionary is designed with privacy, security, and transparency at the heart of the experience.
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
const ProCTASection = React.memo(function ProCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Start with what's in front of you</p>
        <h2 className="mt-4 font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Your next project is already in front of you.</h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Understand it faster. Solve it with intelligence. Ship it and carry the lesson forward.
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
function ProExploreSection() {
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

/* ═══ PAGE — FULL 13-SECTION ARCHITECTURE ═══ */
export default function ProfessionalPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main>
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
      <LandingFooter />
    </div>
  );
}