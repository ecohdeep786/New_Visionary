import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/PersonaHero";

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

/* ═══ ORGANIZATION MODELS (clean strings) ═══ */
const ORG_HERO_WORDS = ["Leading.", "to scale."];
const HERO_WORD_MS = 2800;

const ORG_SLIDES = [
  { word: "Adoption", quote: "We rolled out three learning tools. Nobody knows if anyone is learning.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Organization rolling out learning tools" },
  { word: "Progress", quote: "Every department reports green. The outcomes still surprise us.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Leaders reviewing organizational progress" },
  { word: "Gaps", quote: "We find the learning gaps at the exit interview, not in week two.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Team discovering learning gaps late" },
  { word: "Support", quote: "Our best mentors can only be in one classroom at a time.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Mentor supporting many learners" },
  { word: "Outcomes", quote: "We measure attendance and completion. We still can't see understanding.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png", alt: "Organization measuring outcomes" },
];
const CYCLE_MS = 4000;

/* The four nav sub-sections — anchored for /organization#schools etc. */
const ORG_CONTEXTS = [
  { id: "schools", title: "Schools", copy: "Connect students, teachers, parents, and school leaders around the same learning picture.", connected: "Students · Teachers · Parents · Leaders", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "School learning environment" },
  { id: "colleges", title: "Colleges & Universities", copy: "Help departments, faculty, and students understand progress across programs, skills, and outcomes.", connected: "Students · Faculty · Departments · Placement", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "University campus learning" },
  { id: "coaching", title: "Coaching", copy: "Scale personalized support across batches, mentors, learners, and parent conversations.", connected: "Learners · Mentors · Parents · Coaches", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Coaching institute classroom" },
  { id: "workplace", title: "Workplace learning", copy: "Help teams build real skills, apply learning to work, and see capability grow over time.", connected: "Professionals · Managers · Teams · L&D", image: "https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg", alt: "Workplace learning session" },
];

const ORG_INTELLIGENCE_WORDS = ["People connected.", "Progress connected.", "Support connected.", "Outcomes connected."];
const INTELLIGENCE_WORD_MS = 3000;

const ORG_INTELLIGENCE_STEPS = [
  { title: "See what people understand.", copy: "Visionary turns learning activity into a clear picture of understanding across learners, classes, teams, and programs." },
  { title: "Find gaps before they spread.", copy: "Know where people are stuck early enough to support them — before small gaps become large outcomes." },
  { title: "Support every role from one system.", copy: "Students, teachers, parents, professionals, and leaders all see what matters to them without losing the shared picture." },
  { title: "Improve the next decision.", copy: "Use real learning signals to improve lessons, programs, coaching, training, and institutional planning." },
];

const ORG_KEEPS_WORDS = ["learning", "support", "progress"];
const KEEPS_WORD_MS = 2500;

const LANGUAGE_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];
const ORG_LANGUAGE_QUESTIONS = [
  { hi: "Hamare learners kahan atak rahe hain?", en: "Where are our learners getting stuck?", bn: "আমাদের শিক্ষার্থীরা কোথায় আটকে আছে?", ta: "எங்கள் கற்பவர்கள் எங்கே சிக்கிக்கொண்டிருக்கிறார்கள்?", kn: "ನಮ್ಮ ಕಲಿಯುವವರು ಎಲ್ಲಿ ಸಿಕ್ಕಿಹಾಕಿಕೊಂಡಿದ್ದಾರೆ?", pa: "ਸਾਡੇ ਸਿੱਖਿਆਰਥੀ ਕਿੱਥੇ ਅੜਕੇ ਹੋਏ ਹਨ?" },
  { hi: "Kaunsi class ko zyada support chahiye?", en: "Which class needs more support?", bn: "কোন শ্রেণির বেশি সাহায্য দরকার?", ta: "எந்த வகுப்புக்கு அதிக உதவி தேவை?", kn: "ಯಾವ ತರಗತಿಗೆ ಹೆಚ್ಚಿನ ಸಹಾಯ ಬೇಕು?", pa: "ਕਿਹੜੀ ਜਮਾਤ ਨੂੰ ਵੱਧ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?" },
  { hi: "Training ka impact kahan dikh raha hai?", en: "Where is the training impact showing?", bn: "প্রশিক্ষণের প্রভাব কোথায় দেখা যাচ্ছে?", ta: "பயிற்சியின் தாக்கம் எங்கே தெரிகிறது?", kn: "ತರಬೇತಿಯ ಪ್ರಭಾವ ಎಲ್ಲಿ ಕಾಣುತ್ತಿದೆ?", pa: "ਸਿਖਲਾਈ ਦਾ ਅਸਰ ਕਿੱਥੇ ਦਿਖ ਰਿਹਾ ਹੈ?" },
];
const QUESTION_MS = 3200;

const ORG_CONTINUITY_STAGES = [
  { name: "School", previous: "Last class", now: "Current learning", next: "Next grade" },
  { name: "College", previous: "Foundation", now: "Program skills", next: "Career readiness" },
  { name: "Coaching", previous: "Concept gaps", now: "Practice", next: "Exam confidence" },
  { name: "Workplace", previous: "Training", now: "Application", next: "Capability" },
  { name: "District", previous: "One school", now: "Every school", next: "Every district" },
];

const ORG_ACHIEVEMENT_TABS = [
  { black: "Understand", blue: "what people actually know.", copy: "Move beyond completion rates and see real understanding across your organization." },
  { black: "Support", blue: "the people who need it early.", copy: "Give teachers, coaches, managers, and leaders the signals they need before outcomes drop." },
  { black: "Improve", blue: "every program with evidence.", copy: "Use connected learning signals to improve curriculum, training, coaching, and institutional decisions." },
];

const ORG_FLOW_CATEGORIES = ["Student", "Teacher", "Parent", "Professional", "Organization"];
const CATEGORY_MS = 4200;

const ORG_TRUST_WORDS = ["people.", "data.", "trust."];
const TRUST_WORD_MS = 3000;
const ORG_TRUST_CARDS = [
  { title: "Private by Design", copy: "Your people and their learning data. Treated with care." },
  { title: "Built for institutions", copy: "Designed for responsible use across learners, teachers, teams, and leaders." },
  { title: "Transparent intelligence", copy: "Organizations should understand how intelligence supports decisions." },
];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Know how Visionary fits into your learning.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Know how Visionary fits into your classroom.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "Know how Visionary fits into your child's journey.", alt: "Parent helping a child at a desk" },
  { slug: "professional", chip: "Professional", copy: "Know how Visionary fits into the work you do.", alt: "Professional discussing work with a tablet" },
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
const OrgHeroSection = React.memo(() => (
  <PersonaHero
    words={ORG_HERO_WORDS}
    srSentence="One intelligence, to scale understanding."
    sub="One intelligence across every classroom, team, and program — understanding that stays inside your institution."
    img="https://www.apple.com/v/education/k12/overview/a/images/overview/learning/modals/support__dvu93fbijf6u_large.jpg"
    alt="A leader reviewing team progress on a tablet"
    ctaTo="/contact"
    ctaLabel="Talk to us"
  />
));

/* ═══ 02 · STRUGGLE ═══ */
const StruggleHeading = React.memo(function StruggleHeading({ word, slideKey }) {
  return (
    <h2 className="font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
      <span className="block">Every</span>
      <span className="block">Organization</span>
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
function OrgStruggleSection() {
  const { index, goTo } = useCycleIndex(ORG_SLIDES.length, CYCLE_MS);
  const { ref, visible } = useRevealContinuous();
  const slide = ORG_SLIDES[index];
  return (
    <section ref={ref} className="relative overflow-hidden bg-white py-24" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1756px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-12 lg:gap-10 lg:px-0">
          <div className="lg:col-span-4 lg:pl-[6.5%]"><StruggleHeading word={slide.word} slideKey={index} /></div>
          <div className="lg:col-span-8 lg:pr-[6%]"><StruggleMedia slide={slide} slideKey={index} /></div>
        </div>
        <div className="mt-14 flex justify-center"><CarouselDots total={ORG_SLIDES.length} active={index} onSelect={goTo} /></div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 03 · PROMISE ═══ */
const OrgPromiseSection = React.memo(function OrgPromiseSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY }}>
      <h2 className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        What if your whole organization could see understanding — <span style={{ color: COLORS.blue }}>before it became a gap?</span>
      </h2>
    </section>
  );
});

/* ═══ 04 · CONTEXTS (anchored journey carousel) ═══ */
const ContextsCarousel = React.memo(function ContextsCarousel({ contexts }) {
  const { trackRef, canPrev, canNext, scrollByCard, update } = useScrollTrack();
  const ALIGN = "max(1.5rem, calc(50% - 40rem))";
  return (
    <div className="mt-28 lg:mt-72">
      <div ref={trackRef} onScroll={update} style={{ paddingLeft: ALIGN, paddingRight: "max(1.5rem, 6%)", scrollPaddingLeft: ALIGN }}
        className="flex snap-x snap-mandatory gap-12 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {contexts.map((ctx) => (
          <article key={ctx.id} id={ctx.id} data-card className="w-[85%] shrink-0 snap-start scroll-mt-24 sm:w-[440px] lg:w-[700px] xl:w-[780px]">
            <img src={ctx.image} alt={ctx.alt} loading="lazy" decoding="async" className="aspect-[16/9] w-full rounded-[50px] object-cover" />
            <h3 className="mt-12 text-center font-normal tracking-[0] leading-[1.02] text-[clamp(28px,2.9vw,40px)]" style={{ color: COLORS.ink }}>{ctx.title}</h3>
            <p className="mx-auto mt-5 max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{ctx.copy}</p>
            <p className="mx-auto mt-4 max-w-[640px] text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{ctx.connected}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 flex justify-end px-6 lg:pr-[9%]">
        <div className="inline-flex items-center gap-10 rounded-full px-8 py-4" style={{ backgroundColor: COLORS.cardSurface }}>
          <button type="button" aria-label="Previous contexts" disabled={!canPrev} onClick={() => scrollByCard(-1)} className={`transition-colors ${canPrev ? "hover:opacity-70" : "cursor-default"}`} style={{ color: canPrev ? COLORS.ink : `${COLORS.ink}40` }}>
            <ChevronIcon direction="left" />
          </button>
          <button type="button" aria-label="Next contexts" disabled={!canNext} onClick={() => scrollByCard(1)} className={`transition-colors ${canNext ? "hover:opacity-70" : "cursor-default"}`} style={{ color: canNext ? COLORS.ink : `${COLORS.ink}40` }}>
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>
    </div>
  );
});
function OrgContextsSection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(5, 3000);
  return (
    <section ref={ref} className="relative overflow-hidden py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.ink }}>Your institution, your journey</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Every organization learns differently.
          <br className="hidden md:block" />{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{["Visionary adapts to each.", "Schools see it first", "Colleges build on it", "Coaching scales with it", "Workplaces grow from it"][index]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[640px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          One intelligence, shaped to the way your institution teaches, trains, and grows.
        </p>
        <div className="mt-20 flex justify-center px-6 lg:mt-40">
          <div className="flex h-[200px] w-full max-w-[800px] items-center justify-center rounded-[32px] p-6 sm:h-[240px] sm:p-10" style={{ backgroundColor: COLORS.cardSurfaceAlt }}>
            <svg className="h-24 w-24" style={{ color: `${COLORS.blue}66` }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      </FadeReveal>
      <ContextsCarousel contexts={ORG_CONTEXTS} />
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
function OrgIntelligenceSection() {
  const { ref: headRef, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(ORG_INTELLIGENCE_WORDS.length, INTELLIGENCE_WORD_MS);
  const { active, setStepRef } = useActiveStep(ORG_INTELLIGENCE_STEPS.length);
  const current = ORG_INTELLIGENCE_STEPS[active];
  return (
    <section ref={headRef} className="relative [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible} className="px-6 pt-24 lg:pt-32">
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>The intelligence behind your organization</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          One intelligence.{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{ORG_INTELLIGENCE_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Visionary connects every learner, teacher, parent, and professional into one clear picture your organization can act on.
        </p>
      </FadeReveal>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-60 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center"><IntelligenceCopy step={current} /></div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {ORG_INTELLIGENCE_STEPS.map((s, i) => (
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
const OrgClosingSection = React.memo(function OrgClosingSection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(ORG_KEEPS_WORDS.length, KEEPS_WORD_MS);
  return (
    <section ref={ref} className="relative px-6 py-24 pt-10 lg:py-32 lg:pt-14" style={{ fontFamily: FONT_FAMILY }}>
      <p className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        Visionary keeps{" "}
        <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{ORG_KEEPS_WORDS[index]}</span>{" "}
        connected until individual progress becomes organizational momentum.
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
function OrgLanguageSection() {
  const { ref, visible } = useRevealOnce();
  const [lang, setLang] = useState("en");
  const { index } = useCycleIndex(ORG_LANGUAGE_QUESTIONS.length, QUESTION_MS);
  const question = ORG_LANGUAGE_QUESTIONS[index][lang];
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Our language</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your organization.<br />In every language.
        </h2>
        <p className="mx-auto mt-6 max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          People ask, learn, teach, and report in different languages. Visionary keeps the meaning connected across them.
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

/* ═══ 08 · CONTINUITY ═══ */
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
function OrgContinuitySection() {
  const { ref, visible } = useRevealOnce();
  const { index, goTo, step } = useStageIndex(ORG_CONTINUITY_STAGES.length);
  const stage = ORG_CONTINUITY_STAGES[index];
  return (
    <section ref={ref} className="relative py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Your continuity</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>What your organization learns stays with it.</h2>
        <p className="mx-auto mt-6 max-w-[700px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          What your people understand, practise, and build becomes part of what comes next — across classes, cohorts, programs, and teams.
        </p>
        <div className="mt-16 flex justify-center"><StageDropdown stages={ORG_CONTINUITY_STAGES} active={index} onSelect={goTo} /></div>
        <div className="mt-20 grid grid-cols-1 gap-16 px-6 lg:mt-24 lg:grid-cols-3 lg:gap-12 lg:px-0">
          <ContinuityCard label="Previous" caption="What came before" text={stage.previous} imgClass="lg:h-[400px]" className="lg:-ml-[6vw]" />
          <ContinuityCard label="Now" caption="What's happening now" text={stage.now} imgClass="lg:h-[600px]" className="lg:mt-[120px]" />
          <ContinuityCard label="Next" caption="What comes next" text={stage.next} imgClass="lg:h-[370px]" className="lg:-mr-[6vw] lg:mt-[330px]" />
        </div>
        <div className="mt-16 flex justify-center gap-4 lg:mt-24">
          <button type="button" aria-label="Previous stage" onClick={() => step(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            <ChevronIcon direction="left" />
          </button>
          <button type="button" aria-label="Next stage" onClick={() => step(1)} className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            <ChevronIcon direction="right" />
          </button>
        </div>
        <p className="mt-20 px-6 text-center font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.9vw,42px)]" style={{ color: COLORS.ink }}>Your institution keeps its place.</p>
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
function OrgAchievementSection() {
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
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>See what your organization can achieve with intelligence.</h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Turn connected learning signals into stronger outcomes — for every learner, teacher, parent, and professional you serve.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1400px] grid-cols-1 gap-16 px-6 lg:mt-32 lg:grid-cols-2 lg:gap-24 lg:px-0">
          <AchievementAccordion tabs={ORG_ACHIEVEMENT_TABS} open={open} onToggle={toggle} />
          <div className="relative">
            <div key={active} className="hero-fade-up">
              <img src="https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png" alt={`${ORG_ACHIEVEMENT_TABS[active].black} ${ORG_ACHIEVEMENT_TABS[active].blue}`} loading="lazy" decoding="async" className="h-[320px] w-full object-cover lg:h-[780px]" />
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
function OrgJourneyFlowSection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(ORG_FLOW_CATEGORIES.length - 1, CATEGORY_MS);
  const first = ORG_FLOW_CATEGORIES[index];
  const second = ORG_FLOW_CATEGORIES[index + 1];
  return (
    <section ref={ref} className="relative bg-white py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Your journey</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Individual journeys.<br />Shared intelligence.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Every role in your organization sees what matters to them — while the same intelligence connects them all.
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
            A student's question helps a teacher adjust. A teacher's insight helps a parent support. A professional's progress helps an organization plan. One intelligence, connected.
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
function OrgTrustSection() {
  const { ref, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(ORG_TRUST_WORDS.length, TRUST_WORD_MS);
  const [cardIndex, setCardIndex] = useState(0);
  const stepCards = useCallback((d) => setCardIndex((i) => (i + d + ORG_TRUST_CARDS.length) % ORG_TRUST_CARDS.length), []);
  const active = ORG_TRUST_CARDS[cardIndex];
  const next = ORG_TRUST_CARDS[(cardIndex + 1) % ORG_TRUST_CARDS.length];
  return (
    <section ref={ref} className="relative bg-white py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Our trust</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{ORG_TRUST_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Your people's questions, conversations, and progress are personal. Visionary is designed with privacy, security, and transparency at the heart of the experience.
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
const OrgCTASection = React.memo(function OrgCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.grey }}>Start where your people are</p>
        <h2 className="mt-4 font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Bring Visionary to your organization.</h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Start with one class, one program, one cohort, or one team — and build a clearer learning system from there.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/contact" className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            Contact sales
          </Link>
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
function OrgExploreSection() {
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
export default function OrganizationPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main>
        <OrgHeroSection />
        <OrgStruggleSection />
        <OrgPromiseSection />
        <OrgContextsSection />
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
      <LandingFooter />
    </div>
  );
}