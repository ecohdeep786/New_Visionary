import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingFAQ from "@/components/landing/LandingFAQ";
import PersonaHero from "@/components/landing/NewPersona";
import studentmeet from "@/assets/student-hero-main-1600w.webp"
import teachermeet from "@/assets/teacher-hero-main-1600w.webp"
import parentmeet from "@/assets/parent-hero-main-1600w.webp"
import promeet from "@/assets/pro-face-main-1600w.webp"
import orgmeet from "@/assets/org-face-main-1600w.webp"
import problemunderstanding from "@/assets/problem-understanding.webp";
import teacherSlide from "@/assets/teacher-hero-main-1600w.webp";
import parentSlide from "@/assets/parent-hero-main-1600w.webp";
import proSlide from "@/assets/pro-face-main-1600w.webp";
import cmAdapt from "@/assets/student-primary.webp";
import cmGrow from "@/assets/student-secondary.webp";
import cmCreate from "@/assets/student-vocational.webp";
import cmContinue from "@/assets/student-higher.webp";
import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";



/* ═══════════════════════ TOKENS ═══════════════════════ */
const COLORS = {
  ink: "#121317",
  graphite: "#5f6368",
  slate: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  surface: "#F5F6F8",
  white: "#ffffff",
  blue: "#4285F4",
  chipBg: "#D2E3FC",
  ring: "rgba(66,133,244,0.4)",
  track: "rgba(69,71,77,0.15)",
  line: "rgba(18,19,23,0.26)",
  circle: "rgba(18,19,23,0.06)",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";

/* ═══════════════════════ CONTROLLERS ═══════════════════════ */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

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

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

const CarouselDots = React.memo(function CarouselDots({ total, active, onSelect }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Carousel slides">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-pressed={i === active}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onSelect(i)}
          className={`relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-3 after:-inset-x-1.5 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${i === active ? "w-10" : "w-2 hover:opacity-70"}`}
          style={{ backgroundColor: i === active ? COLORS.ink : `${COLORS.ink}33` }}
        />
      ))}
    </div>
  );
});

function ChevronIcon({ direction = "right", className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${className} ${direction === "left" ? "rotate-180" : ""}`}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function VoiceIcon({ className = "h-9 w-9", style }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
      <path d="M25 7l-5 9 6 4-5 9 3 3-2 7" />
      <path d="M31 19c2.5 2.5 2.5 7.5 0 10" />
      <path d="M35.5 15.5c4.5 4.5 4.5 12 0 16.5" />
    </svg>
  );
}

function VMark({ className = "h-10 w-auto", color = COLORS.ink }) {
  return (
    <svg viewBox="1.5 6 60 44.5" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(0,64) scale(0.1,-0.1)" fill={color} stroke="none">
        <path d="M49 551 c-16 -16 -29 -40 -29 -53 0 -14 42 -98 93 -187 l92 -163 6 38 c13 76 99 118 159 77 33 -22 44 -41 50 -83 5 -33 9 -28 98 128 60 105 92 172 92 192 0 34 -28 67 -66 76 -41 10 -72 -22 -149 -154 -38 -66 -72 -123 -75 -126 -4 -3 -41 55 -83 128 -95 164 -128 186 -188 127z" />
      </g>
    </svg>
  );
}

/* ═══════════════════════ MODELS ═══════════════════════ */
const PROBLEM_SLIDES = [
  { black: "Teaching everyone is possible.", blue: "Reaching everyone isn't", persona: "A teacher", quote: "I taught the whole class. Half of them still left lost.", image: teacherSlide, alt: "Teacher addressing a full classroom" },
  { black: "Seeing progress is easy.", blue: "Knowing how to help isn't", persona: "A parent", quote: "The report card says fine. I still don't know how to help at home.", image: parentSlide, alt: "Parent reviewing a child's progress" },
  { black: "Accessing knowledge is easy.", blue: "Applying it isn't", persona: "A student", quote: "I watched eight hours of videos and still couldn't solve a single problem on my own.", image: problemunderstanding, alt: "Student studying alone with a tablet" },
  { black: "Knowledge is everywhere.", blue: "Turning it into capability isn't", persona: "A professional", quote: "I have all the articles. I still can't turn them into the work.", image: proSlide, alt: "Professional applying knowledge at work" },
];
const PROBLEM_MS = 4200;

const MEET_WORDS = ["understands.", "remembers.", "grows with you.", "starts with where you are."];
const MEET_WORD_MS = 3000;
const MEET_IMG = [studentmeet, teachermeet, parentmeet, promeet, orgmeet];

const MEET_SECTIONS = [
  { id: "student", tab: "Student", leadBlack: "Understand", blues: ["what you're learning.", "why it matters.", "where you're stuck.", "what stays with you."], copy: "See the idea, practise it, and use it in the next thing you build.", link: "Explore student learning", to: "/student", alt: "Student studying with books" },
  { id: "teacher", tab: "Teacher", leadBlack: "Know", blues: ["what your class is learning.", "who needs another explanation.", "who's ready to move forward.", "how to teach the next idea."], copy: "Plan, explain, and check understanding while the lesson is still in front of you.", link: "Explore teaching tools", to: "/teacher", alt: "Teacher presenting at a whiteboard" },
  { id: "parent", tab: "Parent", leadBlack: "Know", blues: ["what your child is learning.", "where they need support.", "how they're growing.", "what to ask next."], copy: "See the progress behind the report and find a useful next step at home.", link: "Explore parent support", to: "/parent", alt: "Parent helping child with homework" },
  { id: "professional", tab: "Professional", leadBlue: ["Learn", "Build"], midBlack: "what the work", blues: ["requires.", "rewards."], copy: "Turn a question, project, or new skill into work you can use.", link: "Explore professional work", to: "/professional", alt: "Professional writing notes beside a laptop" },
  { id: "organization", tab: "Organization", leadBlack: "See", midBlack: "what your people are", blues: ["learning.", "building."], copy: "Give teams a shared view of learning across people, projects, and time.", link: "Explore organization learning", to: "/organization", alt: "Leader reviewing team progress on a tablet" },
];

const OI_STATES = [
  { label: "Remember", heading: "It remembers more than what you said.", body: "It remembers what you understood, where you struggled, what you tried, and what changed along the way." },
  { label: "Understand", heading: "You never have to start over.", body: "When you return, Visionary already knows where you were, what you've done, and what makes sense to do next." },
  { label: "Continue", heading: "It learns from what you do.", body: "Each lesson, practice, project, and decision gives the next step more context." },
  { label: "Grow", heading: "Understanding grows.", body: "What you learn, teach, and build today becomes the foundation for what you can do tomorrow." },
];
const OI_STEP_LABELS = ["Remember", "Understand", "Continue", "Grow"];
const OI_PHASE_MS = [3000, 3000, 3000, 4000, 4500];

const LG_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];
const LG_QUESTIONS = [
  { hi: "Aaj maine kya samjha?", en: "What did I understand today?", bn: "আজ আমি কী বুঝেছি?", ta: "இன்று நான் என்ன புரிந்துகொண்டேன்?", kn: "ಇಂದು ನಾನು ಏನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ?", pa: "ਮੈਂ ਅੱਜ ਕੀ ਸਮਝਿਆ?" },
  { hi: "Yeh concept real life mein kaise kaam karta hai?", en: "How does this concept work in real life?", bn: "এই ধারণাটি বাস্তব জীবনে কীভাবে কাজ করে?", ta: "இந்தக் கருத்து நிஜ வாழ்வில் எப்படி வேலை செய்கிறது?", kn: "ಈ ಪರಿಕಲ್ಪನೆ ನಿಜ ಜೀವನದಲ್ಲಿ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?", pa: "ਇਹ ਧਾਰਨਾ ਅਸਲ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ?" },
  { hi: "Mera bachcha kahan madad chahta hai?", en: "Where does my child need support?", bn: "আমার সন্তানের কোথায় সাহায্য দরকার?", ta: "என் குழந்தைக்கு எங்கே உதவி தேவை?", kn: "ನನ್ನ ಮಗುವಿಗೆ ಎಲ್ಲಿ ಸಹಾಯ ಬೇಕು?", pa: "ਮੇਰੇ ਬੱਚੇ ਨੂੰ ਕਿੱਥੇ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?" },
  { hi: "Is project ke liye kaunsi skill chahiye?", en: "Which skill does this project need?", bn: "এই প্রজেক্টের জন্য কোন দক্ষতা লাগবে?", ta: "இந்தத் திட்டத்திற்கு எந்தத் திறன் தேவை?", kn: "ಈ ಯೋಜನೆಗೆ ಯಾವ ಕೌಶಲ್ಯ ಬೇಕು?", pa: "ਇਸ ਪ੍ਰੋਜੈਕਟ ਲਈ ਕਿਹੜਾ ਹੁਨਰ ਚਾਹੀਦਾ ਹੈ?" },
];
const LG_QUESTION_MS = 3200;

const COMMITMENT_STEPS = [
  { title: "Adapt", copy: "When what you need changes, the way you learn can change with it.", image: cmAdapt, alt: "Child learning with a tablet outdoors" },
  { title: "Grow", copy: "When you know more, you should be able to go further.", image: cmGrow, alt: "Student growing their skills" },
  { title: "Create", copy: "When an idea becomes real, your intelligence should come with you.", image: cmCreate, alt: "Person building a real project" },
  { title: "Continue", copy: "Wherever you go next, you shouldn't have to begin again.", image: cmContinue, alt: "Learner continuing their journey" },
];
const CM_FILL_MS = 4000;

const LX_TRUST_WORDS = ["information.", "privacy.", "progress."];
const LX_TRUST_CARDS = [
  { title: "Your data stays yours.", copy: "You choose what Visionary remembers and how you use it.", alt: "Person working privately on a laptop", Icon: ShieldCheck, to: "/privacy", link: "Read our privacy approach" },
  { title: "Safe to grow with.", copy: "Age-aware guidance and human review help keep learning on track.", alt: "Shield protecting a learner's journey", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Built with care.", copy: "Visionary helps people learn, work, and create.", alt: "Responsibly built intelligence illustration", Icon: Scale, to: "/terms", link: "Read our commitments" },
];
const LX_TRUST_IMG = [cmContinue, teacherSlide, parentSlide];
const LX_EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and build with confidence.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Plan lessons, check understanding, and teach the next idea.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "See progress clearly and know when to help.", alt: "Parent helping a child at a desk" },
  { slug: "professional", chip: "Professional", copy: "Turn what you learn into work you can use.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Help teams share context across projects.", alt: "Leader talking at an organization table" },
];

const FAQ_ITEMS = [
  { q: "What is Visionary?", a: "Visionary brings explanations, practice, an AI mentor, and project tools into one place for learning and work." },
  { q: "Who is Visionary for?", a: "Students, teachers, parents, professionals, and organizations can each use a journey shaped around their work." },
  { q: "What can Visionary remember?", a: "It can remember what you understood, where you struggled, and what you tried, so you can continue when you return." },
  { q: "How does Visionary use my information?", a: "Visionary uses your information to support your journey. It does not sell your information, and you stay in control." },
  { q: "Can I use Visionary in my own language?", a: "Yes. You can ask, learn, and practise in 20+ languages while keeping your context connected." },
  { q: "Is Visionary suitable for children?", a: "Yes. Age-aware guidance, strong protections, and human review help make Visionary safe to grow with." },
];

/* ═══════════════════════ SECTION VIEWS ═══════════════════════ */

/* 01 · HERO — the universal front door, on the one hero law. The persona
   heroes are full-viewport photography on white — that is the bar. The
   universal page answers with the Apple homepage anatomy: the cycling
   headline, the promise, and the CTA pair at the top center on white, and
   the five personas standing together beneath as alpha cutouts rising from
   the fold — no tiles, no scrims, one studio photograph. Sizing comes from
   measured alpha boxes in NewPersona (CAST_METRICS). Per-category navigation
   stays with the Meet Visionary section — the hero is non-interactive, like
   Apple's. */

/* The family, as alpha cutouts on the page's own white (the persona hero
   photography with the studio background removed) — so the landing stages
   them as one unbroken lineup, the way Apple stages a product family. */
import proCut480 from "@/assets/hero-cutouts/professional-480w.webp";
import proCut800 from "@/assets/hero-cutouts/professional-800w.webp";
import teacherCut480 from "@/assets/hero-cutouts/teacher-480w.webp";
import teacherCut800 from "@/assets/hero-cutouts/teacher-800w.webp";
import studentCut480 from "@/assets/hero-cutouts/student-480w.webp";
import studentCut800 from "@/assets/hero-cutouts/student-800w.webp";
import parentCut480 from "@/assets/hero-cutouts/parent-480w.webp";
import parentCut800 from "@/assets/hero-cutouts/parent-800w.webp";
import orgCut480 from "@/assets/hero-cutouts/organization-480w.webp";
import orgCut800 from "@/assets/hero-cutouts/organization-800w.webp";

/* The universal sentence, in the persona grammar: the product names itself,
   then the cycle carries every journey — student, teacher, parent,
   professional, organization. */
const LANDING_HERO_WORDS = ["One Intelligence.", "to learn.", "to teach.", "to help.", "to build.", "to lead."];

const cutSet = (w480, w800) => `${w480} 480w, ${w800} 800w`;
const LANDING_HERO_LINEUP = [
  { label: "Professional", src: proCut800, srcSet: cutSet(proCut480, proCut800) },
  { label: "Teacher", src: teacherCut800, srcSet: cutSet(teacherCut480, teacherCut800) },
  { label: "Student", src: studentCut800, srcSet: cutSet(studentCut480, studentCut800) },
  { label: "Parent", src: parentCut800, srcSet: cutSet(parentCut480, parentCut800) },
  { label: "Organization", src: orgCut800, srcSet: cutSet(orgCut480, orgCut800) },
];

const LandingHeroSection = React.memo(function LandingHeroSection() {
  return (
    <PersonaHero
      words={LANDING_HERO_WORDS}
      srSentence="One Intelligence. To learn. To teach. To help. To build. To lead."
      sub="Visionary carries your context across learning, teaching, work, and life."
      cast={LANDING_HERO_LINEUP}
      ctaLabel="Start free"
      minDisplay={36}
    />
  );
});

/* 02 · PROBLEM */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, PROBLEM_MS);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative overflow-hidden bg-[#f8f9fa] py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="sr-only">Stories from a teacher, a parent, a student, and a professional about the moment understanding breaks down.</p>
        <div className="mx-auto grid w-full max-w-[1756px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-12 lg:gap-10 lg:px-0">
          <div className="lg:col-span-5 lg:pl-[var(--frame-x)]">
            <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Why Visionary exists</p>
            <h2 key={`h-${index}`} className="hero-fade-up mt-[calc(clamp(28px,2.78vw,40px)*0.857)] max-w-[460px] font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
              {slide.black} <span style={{ color: COLORS.blue }}>{slide.blue}</span>.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pr-[var(--frame-x)]">
            <figure className="m-0">
              <div key={`m-${index}`} className="hero-fade-up [animation-delay:120ms] [animation-fill-mode:both]">
                {/* the source photography is portrait-first; a 16:9 centre crop
                    decapitated it — 4:3 with an upper-third bias keeps every
                    face whole like a product shot should */}
                <img src={slide.image} alt={slide.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full max-w-[640px] mx-auto rounded-[var(--radius-media)] object-cover object-[50%_28%] sm:aspect-[16/10]" />
              </div>
              <figcaption key={`q-${index}`} className="hero-fade-up mx-auto mt-10 w-full max-w-[560px] text-center [animation-delay:200ms] [animation-fill-mode:both]">
                <p className="font-medium tracking-[0] leading-[20px] text-[16px]" style={{ color: COLORS.ink }}>{slide.persona}</p>
                <p className="mt-2 font-normal tracking-[0] leading-[1.27] text-[clamp(16px,1.39vw,20px)]" style={{ color: COLORS.ink }}>{slide.quote}</p>
              </figcaption>
            </figure>
          </div>
        </div>
        <div className="mt-14 flex justify-center"><CarouselDots total={PROBLEM_SLIDES.length} active={index} onSelect={goTo} /></div>
      </FadeReveal>
    </section>
  );
}

/* 03 · PROMISE */
const LandingPromiseSection = React.memo(function LandingPromiseSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="03-promise" className="relative overflow-hidden px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY, backgroundColor: COLORS.white }}>
      <h2 className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        What if your intelligence never forgot{" "}
        <span className="accent-gradient">where you were?</span>
      </h2>
    </section>
  );
});

/* 04 · MEET — Google's modular product section: one sticky tablist with the
   full ARIA tabs pattern (arrow keys, roving tabindex, aria-controls), one
   scroll-driven story column, and the rotating word/phrase tickers. */
const MeetHeading = React.memo(function MeetHeading({ section, index }) {
  const blue = section.blues[index % section.blues.length];
  return (
    <h3 className="font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
      {section.leadBlue ? (
        <>
          <span key={`l-${index}`} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{section.leadBlue[index % section.leadBlue.length]}</span>{" "}
          {section.midBlack}{" "}
          <span key={`b-${index}`} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{blue}</span>
        </>
      ) : (
        <>
          {section.leadBlack} {section.midBlack ? `${section.midBlack} ` : ""}
          <span key={`b-${index}`} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{blue}</span>
        </>
      )}
    </h3>
  );
});

const MeetTabs = React.memo(function MeetTabs({ active, onSelect }) {
  const tabRefs = useRef([]);
  const onKeyDown = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (active + dir + MEET_SECTIONS.length) % MEET_SECTIONS.length;
    onSelect(next);
    tabRefs.current[next]?.focus();
  };
  return (
    <div className="mx-auto w-full max-w-[900px]">
      {/* the strip scrolls horizontally on small screens — discovery stays
          horizontal, never a squeezed desktop row */}
      <div
        className="flex h-[52px] w-full items-stretch overflow-x-auto rounded-[90px] border bg-white p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ borderColor: COLORS.mist }}
        role="tablist"
        aria-label="Audiences"
        onKeyDown={onKeyDown}
      >
        {MEET_SECTIONS.map((s, i) => (
          <button
            key={s.id}
            ref={(n) => { tabRefs.current[i] = n; }}
            type="button"
            role="tab"
            id={`meet-tab-${s.id}`}
            aria-selected={active === i}
            aria-controls={`meet-panel-${s.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => onSelect(i)}
            className={`flex h-full min-w-[104px] flex-none items-center justify-center rounded-[90px] px-4 text-[12px] tracking-[0.24px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4285F4] sm:min-w-0 sm:flex-1 sm:text-[14px] ${active === i ? "font-medium" : "font-normal"}`}
            style={{ backgroundColor: active === i ? COLORS.ink : "transparent", color: active === i ? "#ffffff" : COLORS.slate }}
          >
            {s.tab}
          </button>
        ))}
      </div>
    </div>
  );
});

const MeetCopy = React.memo(function MeetCopy({ section }) {
  const { index } = useCycleIndex(section.blues.length, 3000);
  return (
    <div className="max-w-[460px]">
      <MeetHeading section={section} index={index} />
      <p className="mt-8 font-normal tracking-[0] leading-[1.6] text-[15.5px] lg:text-[16px]" style={{ color: COLORS.graphite }}>{section.copy}</p>
      <Link to={section.to} className="mt-10 inline-flex h-10 items-center justify-center rounded-full border border-[#dadce0] px-6 text-[14px] font-normal tracking-[0.24px] text-[#4285F4] transition-colors hover:border-[#4285F4] hover:bg-[#4285F4] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
        {section.link}
      </Link>
    </div>
  );
});

function LandingMeetSection() {
  const { index: wordIndex } = useCycleIndex(MEET_WORDS.length, MEET_WORD_MS);
  const { ref: headRef, visible } = useRevealOnce();
  const { active, setStepRef } = useActiveStep(MEET_SECTIONS.length);
  const sectionRef = useRef(null);
  const scrollToRow = (i) => {
    const rows = sectionRef.current?.querySelectorAll("[data-step]");
    rows?.[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <section ref={sectionRef} data-section="04-meet" className="relative bg-white py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <div ref={headRef} className="px-6">
        <FadeReveal visible={visible}>
          <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Meet Visionary</p>
          <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
            It <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{MEET_WORDS[wordIndex]}</span>
          </h2>
          <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
            Visionary continues your journey instead of restarting it.
          </p>
        </FadeReveal>
      </div>
      {/* the tab strip pins just below the floating capsule nav (8px top
          gap + 56px bar = 64px, plus an 8px breath) */}
      {/* the tab strip pins just below the straight glass bar (56px bar,
          plus an 8px breath) */}
      <div className="sticky top-[64px] z-30 bg-white px-4 py-5 sm:px-6"><MeetTabs active={active} onSelect={scrollToRow} /></div>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-24 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-28 flex h-[calc(100svh-136px)] items-center">
            <div key={active} className="hero-fade-up"><MeetCopy section={MEET_SECTIONS[active]} /></div>
          </div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-56 lg:py-24">
          {MEET_SECTIONS.map((s, i) => (
            <div key={s.id}>
              <figure ref={setStepRef(i)} data-step={i} id={`meet-panel-${s.id}`} aria-labelledby={`meet-tab-${s.id}`} className="m-0">
                <div className="mx-auto w-full max-w-[440px] overflow-hidden border border-[#121317]/30 rounded-[var(--radius-media)] lg:mx-0 lg:max-w-none">
                  <img src={MEET_IMG[i]} alt={s.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover lg:aspect-[15/16]" />
                </div>
              </figure>
              <div className="mt-10 lg:hidden"><MeetCopy section={s} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 05 · ONE INTELLIGENCE — the orbit chapter. White stage, two quiet dashed
   rings around the phase story, and the numbered rail carrying the sequence.
   The phase cycle advances on its own cadence; the rail numbers are buttons,
   so selecting one takes over the story. */
function LandingOneIntelligenceSection() {
  const { ref, visible } = useRevealOnce();
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    /* Reduced motion: no auto-advance — the user drives the phase. */
    if (reduced) return undefined;
    const id = setTimeout(() => setPhase((p) => (p + 1) % 5), OI_PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [phase, reduced]);
  const goTo = (i) => setPhase(i);
  const finale = phase === 4;
  const state = OI_STATES[Math.min(phase, 3)];
  return (
    <section ref={ref} data-section="05-one-intelligence" className="relative overflow-hidden bg-white py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes oiSpin{to{transform:rotate(360deg)}}@keyframes oiFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}"}</style>
      <div className={`px-6 transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Every tomorrow</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          What you <span style={{ color: COLORS.blue }}>understand</span> today
          <br className="hidden md:block" /> makes tomorrow easier.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] text-center font-normal tracking-[0.27px] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Every lesson, conversation, project, and breakthrough becomes part of what comes next.
        </p>
        <div className="relative mx-auto mt-32 h-[min(440px,88vw)] w-[min(440px,88vw)] sm:h-[540px] sm:w-[540px] lg:h-[640px] lg:w-[640px]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ animation: "oiSpin 60s linear infinite" }} aria-hidden="true">
            <circle cx="50" cy="50" r="49" fill="none" stroke={COLORS.ring} strokeWidth="0.35" strokeDasharray="4 5" />
          </svg>
          <svg viewBox="0 0 100 100" className="absolute inset-[13%] h-[74%] w-[74%]" style={{ animation: "oiSpin 90s linear infinite reverse" }} aria-hidden="true">
            <circle cx="50" cy="50" r="49" fill="none" stroke={COLORS.ring} strokeWidth="0.4" strokeDasharray="4 5" />
          </svg>
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div key={phase} aria-live="polite" className="flex w-full max-w-[340px] flex-col items-center px-4 text-center" style={{ animation: "oiFade 900ms cubic-bezier(0.22,1,0.36,1) both" }}>
              {finale ? (
                <>
                  <VMark className="h-10 w-auto" />
                  <h3 className="mt-[calc(clamp(20px,2.4vw,30px)*1)] font-medium tracking-[0] leading-[1.15] text-[clamp(20px,2.4vw,30px)]" style={{ color: COLORS.ink }}>One Intelligence, Always stay with you.</h3>
                </>
              ) : (
                <>
                  <span className="rounded-full px-4 py-1 font-normal uppercase tracking-[0.43px] text-[10px]" style={{ backgroundColor: COLORS.chipBg, color: COLORS.ink }}>{state.label}</span>
                  <h3 className="mt-[calc(clamp(22px,2.6vw,34px)*0.909)] font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.6vw,34px)]" style={{ color: COLORS.ink }}>{state.heading}</h3>
                  <p className="mt-[calc(clamp(22px,2.6vw,34px)*0.727)] font-normal tracking-[0.24px] leading-[1.5] text-[14px]" style={{ color: COLORS.slate }}>{state.body}</p>
                  <div className="mt-6 h-[2px] w-[min(240px,60vw)] overflow-hidden rounded-full" style={{ backgroundColor: COLORS.mist }}>
                    <div className="h-full transition-all duration-700" style={{ width: `${((Math.min(phase, 3) + 1) / 4) * 100}%`, backgroundColor: COLORS.blue }} />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 z-20 w-[min(680px,92vw)] -translate-x-1/2 translate-y-1/2 bg-white px-2 sm:px-6">
            <div className="flex items-start justify-between" role="group" aria-label="One Intelligence phases">
              {OI_STEP_LABELS.map((label, i) => (
                <React.Fragment key={label}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-pressed={phase === i}
                    aria-label={`${label} (phase ${i + 1})`}
                    className="flex w-14 flex-col items-center gap-3 rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] sm:w-20"
                  >
                    {phase >= i ? (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full text-[24px] font-medium transition-colors duration-700 sm:h-12 sm:w-12 sm:text-[28px]" style={{ backgroundColor: COLORS.blue, color: COLORS.white }}>{i + 1}</span>
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center text-[24px] font-normal leading-none transition-colors duration-700 sm:h-12 sm:w-12 sm:text-[28px]" style={{ color: COLORS.lightGrey }}>{i + 1}</span>
                    )}
                    <span className="text-center text-[11px] font-normal uppercase tracking-[0.43px] transition-colors duration-700 sm:text-[12px]" style={{ color: phase >= i ? COLORS.blue : COLORS.lightGrey }}>{label}</span>
                  </button>
                  {i < 3 && <div aria-hidden="true" className="mx-1 mt-5 h-[2px] flex-1 transition-colors duration-700 sm:mt-6" style={{ backgroundColor: phase > i ? COLORS.blue : COLORS.mist }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-24 flex w-fit max-w-full items-center justify-center gap-3 rounded-full px-5 py-4 sm:gap-4 sm:px-8 sm:py-5" style={{ backgroundColor: COLORS.surface }}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" style={{ color: COLORS.ink }}><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
          <p className="text-center font-normal tracking-[0.24px] text-[14px] sm:text-[15px]" style={{ color: COLORS.ink }}>It doesn't just remember your past. <span style={{ color: COLORS.blue }}>It understands what comes next.</span></p>
        </div>
      </div>
    </section>
  );
}

/* 06 · COMMITMENT — the fill rail fills on the active step and advances the
   story on its own cadence; clicking a row takes over. The advance runs on a
   timer (not the animation-end event) so reduced-motion users — whose fill
   completes instantly — get a click-driven story instead of a runaway loop. */
function LandingCommitmentSection() {
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useRevealOnce();
  const [active, setActive] = useState(0);
  const [runId, setRunId] = useState(0);
  const select = (i) => { setActive(i); setRunId((r) => r + 1); };
  const next = useCallback(() => { setActive((a) => (a + 1) % COMMITMENT_STEPS.length); setRunId((r) => r + 1); }, []);
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(next, CM_FILL_MS);
    return () => clearTimeout(id);
  }, [next, active, runId, reduced]);
  const step = COMMITMENT_STEPS[active];
  return (
    <section ref={ref} data-section="06-commitment" className="relative overflow-hidden bg-white py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes cmFill{from{transform:scaleY(0)}to{transform:scaleY(1)}}"}</style>
      <div className={`px-6 transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Our commitment</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>You keep changing.<br />Visionary keeps learning with you.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] text-center font-normal tracking-[0.27px] leading-[1.6] text-[16px]" style={{ color: COLORS.slate }}>
          New questions bring new work. Visionary helps you carry what you learn into the next step.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1400px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="flex flex-col gap-10">
            {COMMITMENT_STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <button key={s.title} type="button" onClick={() => select(i)} aria-expanded={isActive} className="flex items-start gap-6 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                  <span className={`relative w-[4px] shrink-0 overflow-hidden rounded-full transition-all duration-700 ease-google ${isActive ? "h-[96px]" : "mt-1 h-[28px]"}`} style={{ backgroundColor: COLORS.track }}>
                    {isActive && (
                      <span
                        key={`fill-${active}-${runId}`}
                        className="absolute inset-0 origin-top rounded-full"
                        style={{ backgroundColor: COLORS.blue, transform: reduced ? "scaleY(1)" : "scaleY(0)", animation: reduced ? undefined : `cmFill ${CM_FILL_MS}ms linear forwards` }}
                      />
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block tracking-[0] leading-[1.15] text-[clamp(24px,2.4vw,32px)]" style={{ color: COLORS.ink, fontWeight: isActive ? 500 : 400 }}>{i + 1}. {s.title}</span>
                    <span className={`grid transition-all duration-500 ease-google ${isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <span className="block overflow-hidden">
                        <span className="mt-3 block max-w-[420px] text-[15px] leading-[1.6] tracking-[0.24px]" style={{ color: COLORS.slate }}>{s.copy}</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div key={`${active}-${runId}`} className="hero-fade-up" aria-live="polite">
            <img src={step.image} alt={step.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-[var(--radius-media)] object-cover lg:aspect-[5/4]" />
          </div>
        </div>
        <p className="mx-auto mt-28 max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
          Built for who you are. Ready for <span style={{ color: COLORS.blue }}>who you become.</span>
        </p>
      </div>
    </section>
  );
}

/* 07 · LANGUAGE */
const LGLanguageChips = React.memo(function LGLanguageChips({ active, onSelect }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Language selection">
      {LG_CHIPS.map((lang) => (
        <button key={lang.code} type="button" aria-pressed={active === lang.code} onClick={() => onSelect(lang.code)}
          className={`rounded-full px-5 py-2 font-normal uppercase tracking-[0] leading-[14px] text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${active === lang.code ? "" : "border hover:bg-[#121317]/5"}`}
          style={{ backgroundColor: active === lang.code ? COLORS.chipBg : "transparent", color: COLORS.ink, borderColor: active === lang.code ? "transparent" : `${COLORS.ink}40` }}>
          {lang.label}
        </button>
      ))}
      <span className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.ink }}>+20 languages</span>
    </div>
  );
});

function LandingLanguageSection() {
  const { ref, visible } = useRevealOnce();
  const { index: qIndex } = useCycleIndex(LG_QUESTIONS.length, LG_QUESTION_MS);
  const [lang, setLang] = useState("hi");
  const question = LG_QUESTIONS[qIndex][lang];
  return (
    <section ref={ref} data-section="07-language" className="relative overflow-hidden bg-[#f8f9fa] px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Every language</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Every language.<br /><span style={{ color: COLORS.blue }}>One understanding.</span></h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Visionary understands what you mean, in the language you think in.
        </p>
        <div className="relative mt-14 lg:mt-20">
          {/* a breath of Google color field behind the voice — the four bars
              carry the four brand hues, our one full-color heritage nod */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[min(920px,100vw)] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(45% 45% at 50% 50%, rgba(66,133,244,0.12) 0%, rgba(66,133,244,0.05) 45%, transparent 72%)" }}
          />
          <LGLanguageChips active={lang} onSelect={setLang} />
          <div className="mx-auto mt-16 w-full max-w-[860px] lg:mt-24">
            <div className="flex items-end justify-center gap-2" aria-hidden="true">
              {["#4285F4", "#EA4335", "#FBBC04", "#34A853"].map((c, i) => (
                <span key={`${c}-${i}`} className="h-8 w-1.5 rounded-full" style={{ backgroundColor: c, transformOrigin: "center", animation: `voiceDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
          <p aria-live="polite" lang={lang} className="mx-auto mt-8 max-w-[760px] text-center font-normal tracking-[0] leading-[1.25] text-[clamp(26px,3.4vw,48px)]" style={{ color: COLORS.blue }}>
            <span key={`${lang}-${qIndex}`} className="hero-fade-up inline">{question}</span>
          </p>
          <p className="mt-6 text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
            Listening in {LG_CHIPS.find((c) => c.code === lang)?.label || lang} · understood in every language
          </p>
        </div>
        <div className="mt-14 flex justify-center lg:mt-20">
          <div className="flex items-center gap-4 rounded-full px-8 py-4" style={{ backgroundColor: COLORS.surface }}>
            <VoiceIcon className="h-6 w-6 shrink-0" style={{ color: COLORS.blue }} />
            <div>
              <p className="font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>Speak your way</p>
              <p className="mt-1 font-normal tracking-[0] leading-[19px] text-[13px]" style={{ color: COLORS.slate }}>Use voice or text in the way you're comfortable.</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

/* 08 · TRUST */
const LXTrustCard = React.memo(function LXTrustCard({ card, cardIndex }) {
  const img = LX_TRUST_IMG[cardIndex % LX_TRUST_IMG.length];
  return (
    <div className="relative w-full max-w-[780px] overflow-hidden rounded-[var(--radius-media)]">
      <img src={img} alt={card.alt} loading="lazy" decoding="async" className="aspect-[8/5] w-full object-cover" />
      {/* the copy panel sits on the photo on wide screens; on phones it drops
          below the photo so it never occludes the image it describes */}
      <div className="mt-4 px-4 sm:absolute sm:left-8 sm:top-8 sm:mt-0 sm:max-w-[320px] sm:px-0">
        <div className="rounded-[var(--radius-overlay)] bg-white/95 p-4 sm:p-5">
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

function useLXScrollTrack() {
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

function LandingTrustSection() {
  const { ref, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(LX_TRUST_WORDS.length, 3000);
  const [cardIndex, setCardIndex] = useState(0);
  const stepCards = useCallback((d) => setCardIndex((i) => (i + d + LX_TRUST_CARDS.length) % LX_TRUST_CARDS.length), []);
  const activeCard = LX_TRUST_CARDS[cardIndex];
  const nextCard = LX_TRUST_CARDS[(cardIndex + 1) % LX_TRUST_CARDS.length];
  return (
    <section ref={ref} data-section="08-trust" className="relative overflow-hidden bg-white py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div>
          <p className="px-6 text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Trust and safety</p>
          <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
            Your <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{LX_TRUST_WORDS[wordIndex]}</span>
          </h2>
          <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
            Your learning, conversations, ideas, and progress are personal. Visionary keeps it that way.
          </p>
          <div className="mx-auto mt-24 grid w-full max-w-[1600px] grid-cols-1 items-start gap-16 px-6 lg:mt-32 lg:grid-cols-[4fr_8fr] lg:gap-24 lg:px-[var(--frame-x)]">
            <div>
              <h3 key={activeCard.title} aria-live="polite" className="hero-fade-up max-w-[460px] font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>{activeCard.title}</h3>
              <div className="mt-12 flex gap-4">
                <button type="button" aria-label="Previous trust card" onClick={() => stepCards(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border bg-white transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}><ChevronIcon direction="left" /></button>
                <button type="button" aria-label="Next trust card" onClick={() => stepCards(1)} className="flex h-12 w-12 items-center justify-center rounded-full border bg-white transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}><ChevronIcon direction="right" /></button>
              </div>
            </div>
            <div className="flex flex-col gap-8 2xl:grid 2xl:grid-cols-2 2xl:gap-10">
              <div key={`a-${cardIndex}`} className="hero-fade-up w-full max-w-[780px]"><LXTrustCard card={activeCard} cardIndex={cardIndex} /></div>
              <div key={`b-${cardIndex}`} className="hero-fade-up hidden w-full max-w-[780px] 2xl:block [animation-delay:80ms] [animation-fill-mode:both]"><LXTrustCard card={nextCard} cardIndex={(cardIndex + 1) % LX_TRUST_CARDS.length} /></div>
            </div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* 09 · CTA — the closer sits on a soft blue field that deepens toward the
   top and breathes out at the bottom; one primary pill, one quiet path */
function LandingCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="09-cta" className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY, backgroundImage: "linear-gradient(180deg, #d9e6fd 0%, #e8f0fe 48%, #f5f9ff 100%)" }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Start today</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Your next step starts here.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Ask a question. Explore an idea. Start learning. Visionary is ready when you are.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="inline-flex h-12 items-center justify-center rounded-full px-8 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]" style={{ backgroundColor: COLORS.blue }}>
            Get started
          </Link>
          <Link to="/contact" className="inline-flex h-12 items-center justify-center rounded-full border border-[#121317]/20 bg-white/60 px-8 font-normal tracking-[0.24px] text-[16px] text-[#121317] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">
            Talk to our team
          </Link>
        </div>
        <p className="mt-6 text-center font-normal tracking-[0.24px] text-[13px]" style={{ color: COLORS.slate }}>
          Free to start. Private by design.
        </p>
      </div>
    </section>
  );
}

/* 10 · EXPLORE */
const LXExploreCard = React.memo(function LXExploreCard({ category, image }) {
  return (
    <Link to={`/${category.slug}`} data-card className="elevation-1 group block w-[240px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] border bg-white transition-all duration-300 ease-google hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(60,64,67,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 sm:w-[260px]" style={{ borderColor: `${COLORS.ink}1A` }}>
      <img src={image} alt={category.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-google group-hover:scale-[1.04]" />
      <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>{category.chip}</p>
        <p className="mt-3 font-normal tracking-[0] leading-[1.5] text-[15px]" style={{ color: COLORS.ink }}>{category.copy}</p>
        <span className="mt-4 font-normal tracking-[0] leading-[22px] text-[16px]" style={{ color: COLORS.blue }}>Learn more</span>
      </div>
    </Link>
  );
});

function LandingExploreSection() {
  const { ref, visible } = useRevealOnce();
  const { trackRef, canPrev, canNext, scrollByCard, update } = useLXScrollTrack();
  return (
    <section ref={ref} data-section="10-explore" className="relative bg-white py-16 lg:py-20 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="flex items-center justify-between gap-6 px-6 lg:px-[var(--frame-x)]">
          <h2 className="font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>Explore Visionary</h2>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Previous categories" disabled={!canPrev} onClick={() => scrollByCard(-1)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-white transition-all hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 ${canPrev ? "opacity-100" : "opacity-40"}`}
              style={{ borderColor: `${COLORS.ink}1A`, color: COLORS.ink, boxShadow: "0 8px 24px rgba(60,64,67,0.08)" }}>
              <ChevronIcon direction="left" />
            </button>
            <button type="button" aria-label="Next categories" disabled={!canNext} onClick={() => scrollByCard(1)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-white transition-all hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 ${canNext ? "opacity-100" : "opacity-40"}`}
              style={{ borderColor: `${COLORS.ink}1A`, color: COLORS.ink, boxShadow: "0 8px 24px rgba(60,64,67,0.08)" }}>
              <ChevronIcon direction="right" />
            </button>
          </div>
        </div>
        {/* the track is a keyboard-reachable scroll region, so horizontal
            discovery works without a pointer; the first card aligns with the
            page gutter and the next card peeks in as the scroll affordance */}
        <div
          ref={trackRef}
          onScroll={update}
          tabIndex={0}
          role="region"
          aria-label="Explore Visionary by audience"
          className="mt-16 flex snap-x snap-mandatory gap-8 overflow-x-auto px-6 pb-4 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4285F4] [&::-webkit-scrollbar]:hidden lg:mt-20 lg:gap-12 lg:pl-[var(--frame-x)] lg:pr-6"
        >
          {LX_EXPLORE_CATEGORIES.map((c, i) => <LXExploreCard key={c.slug} category={c} image={MEET_IMG[i % MEET_IMG.length]} />)}
        </div>
      </FadeReveal>
    </section>
  );
}

/* 11 · FAQ */
function LandingFAQSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="11-faq" className="relative overflow-hidden bg-[#f8f9fa] px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>FAQ</p>
        <h2 className="mx-auto max-w-[1100px] text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-title-sub-display)" }}>Questions, answered.</h2>
        <div className="mx-auto mt-24 w-full max-w-[1240px]">
          <LandingFAQ faqs={FAQ_ITEMS} variant="hero" defaultOpen={0} />
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <LandingHeroSection />
        <LandingProblemSection />
        <LandingPromiseSection />
        <LandingMeetSection />
        <LandingOneIntelligenceSection />
        <LandingCommitmentSection />
        <LandingLanguageSection />
        <LandingTrustSection />
        <LandingCTASection />
        <LandingExploreSection />
        <LandingFAQSection />
      </main>
      <LandingFooter />
    </div>
  );
}