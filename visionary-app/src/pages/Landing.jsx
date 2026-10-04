import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import studentmeet from "@/assets/student-hero-main-1600w.webp";
import teachermeet from "@/assets/teacher-hero-main-1600w.webp";
import parentmeet from "@/assets/parent-hero-main-1600w.webp";
import promeet from "@/assets/pro-face-main-1600w.webp";
import orgmeet from "@/assets/org-face-main-1600w.webp";
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
  track: "rgba(69,71,77,0.15)",
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

/* The section choreography — content fades up when its chapter enters the
   viewport band and fades back down as it leaves (the wipe-out). Under
   prefers-reduced-motion the story stays present: no hiding. */
function useRevealContinuous(rootMargin = "-40% 0px -10% 0px") {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (reduced) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    /* IO can batch queued entries in one callback — entries[0] may be stale,
       so the LATEST entry always wins (this is what makes the exit wipe
       actually land after a fast scroll). */
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[entries.length - 1].isIntersecting),
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, reduced]);
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

/* Opacity-only reveal — for wrappers that contain sticky children, where a
   transform would interfere with the pin. */
const FadeSoft = React.memo(function FadeSoft({ visible, children, className = "" }) {
  return (
    <div className={`transition-opacity duration-700 ease-google ${visible ? "opacity-100" : "opacity-0"} ${className}`}>
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

const JOURNEY_STEPS = [
  { title: "Adapt", copy: "When what you need changes, the way you learn can change with it.", image: cmAdapt, alt: "Child learning with a tablet outdoors" },
  { title: "Grow", copy: "When you know more, you should be able to go further.", image: cmGrow, alt: "Student growing their skills" },
  { title: "Create", copy: "When an idea becomes real, your intelligence should come with you.", image: cmCreate, alt: "Person building a real project" },
  { title: "Continue", copy: "Wherever you go next, you shouldn't have to begin again.", image: cmContinue, alt: "Learner continuing their journey" },
];
const JOURNEY_FILL_MS = 4000;

const LX_TRUST_WORDS = ["information.", "privacy.", "progress."];
const LX_TRUST_IMG = [cmContinue, teacherSlide, parentSlide];
const TRUST_WORD_MS = 3600;
const LX_TRUST_CARDS = [
  { title: "Your data stays yours.", copy: "You choose what Visionary remembers and how you use it.", alt: "Person working privately on a laptop", Icon: ShieldCheck, to: "/privacy", link: "Read our privacy approach" },
  { title: "Safe to grow with.", copy: "Age-aware guidance and human review help keep learning on track.", alt: "Shield protecting a learner's journey", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Built with care.", copy: "Visionary helps people learn, work, and create.", alt: "Responsibly built intelligence illustration", Icon: Scale, to: "/terms", link: "Read our commitments" },
];

/* ═══════════════════════ SECTION VIEWS ═══════════════════════ */

/* 01 · HERO — the universal front door, on the one hero law: the static
   "One Intelligence." headline, the promise, the CTA pair, and the five
   personas as alpha cutouts rising from the fold. The section pins to the
   viewport (sticky, in NewPersona's cast branch) so the story can glide
   over it on frosted glass — the Vision Pro page anatomy. */

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
const LANDING_HERO_AUDIENCES = [
  { label: "Students", to: "/student" },
  { label: "Teachers", to: "/teacher" },
  { label: "Parents", to: "/parent" },
  { label: "Professionals", to: "/professional" },
  { label: "Organizations", to: "/organization" },
];

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
      sub="One connected intelligence for every way you learn, teach, work, and grow."
      cast={LANDING_HERO_LINEUP}
      audiences={LANDING_HERO_AUDIENCES}
      ctaLabel="Start free"
      secondaryLabel="See how it works"
      minDisplay={36}
    />
  );
});

/* 02 · PROBLEM — the first chapter slides over the pinned hero on the
   house frosted glass. The Apple chapter anatomy: one centered statement,
   one cinematic image, one voice — nothing else on the stage. */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, PROBLEM_MS);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative z-10 overflow-hidden bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="sr-only">Stories from a teacher, a parent, a student, and a professional about the moment understanding breaks down.</p>
        <div className="px-6">
          <p className="text-center uppercase" style={{ color: COLORS.slate }}>Why Visionary exists</p>
          <h2 key={`h-${index}`} className="hero-fade-up mx-auto mt-[calc(clamp(30px,3.8vw,56px)*0.6)] max-w-[900px] text-balance text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(30px,3.8vw,56px)]" style={{ color: COLORS.ink }}>
            {slide.black} <span style={{ color: COLORS.blue }}>{slide.blue}</span>.
          </h2>
        </div>
        <figure className="m-0">
          <div key={`m-${index}`} className="hero-fade-up mx-auto mt-[clamp(32px,4vw,56px)] w-full max-w-[880px] px-6 [animation-delay:120ms] [animation-fill-mode:both]">
            {/* Apple chapter-media sizing: a height-capped framed rectangle —
                the whole chapter reads within one viewport. The hairline is
                Apple's own #d2d2d7 token (measured live on apple.com). The
                portrait-first photography needs the upper-third bias to keep
                every face whole in the tighter crop. */}
            <img src={slide.image} alt={slide.alt} loading="lazy" decoding="async" className="h-[clamp(260px,40svh,420px)] w-full rounded-[var(--radius-media)] border border-[#d2d2d7] object-cover object-[50%_28%]" />
          </div>
          <figcaption key={`q-${index}`} className="hero-fade-up mx-auto mt-8 w-full max-w-[640px] px-6 text-center [animation-delay:200ms] [animation-fill-mode:both]">
            <p className="font-medium tracking-[0] leading-[20px] text-[16px]" style={{ color: COLORS.ink }}>{slide.persona}</p>
            <p className="mt-2 font-normal tracking-[0] leading-[1.4] text-[clamp(17px,1.46vw,21px)]" style={{ color: COLORS.ink }}>{slide.quote}</p>
          </figcaption>
        </figure>
        <div className="mt-10 flex justify-center"><CarouselDots total={PROBLEM_SLIDES.length} active={index} onSelect={goTo} /></div>
      </FadeReveal>
    </section>
  );
}

/* 03 · PROMISE — the thesis, introduced: it fades up in the hero's own
   grammar the moment it enters the viewport. */
const LandingPromiseSection = React.memo(function LandingPromiseSection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section ref={ref} data-section="03-promise" className="relative z-10 overflow-hidden px-6" style={{ fontFamily: FONT_FAMILY, backgroundColor: COLORS.white }}>
      {/* the typographic reset — a statement band breathes deeper than a
          standard chapter, the way Apple's thesis lines stand alone */}
      <div className="py-[clamp(16px,3.4vw,48px)]">
        <h2 className={`mx-auto max-w-[1080px] text-balance text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(34px,5vw,72px)] ${visible ? "hero-fade-up" : "opacity-0"}`} style={{ color: COLORS.ink }}>
          What if your intelligence never forgot{" "}
          <span className="accent-gradient">where you were?</span>
        </h2>
      </div>
    </section>
  );
});

/* 04 · MEET — the product, for whom: one frosted tablist pinned under the
   nav (the glass motif carried through the page), one scroll-driven story
   column, and the rotating word/phrase tickers. */
const MeetHeading = React.memo(function MeetHeading({ section, index }) {
  const blue = section.blues[index % section.blues.length];
  return (
    <h3 className="font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(30px,3.8vw,56px)]" style={{ color: COLORS.ink }}>
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
    <div className="max-w-[520px]">
      <MeetHeading section={section} index={index} />
      <p className="mt-8 font-normal tracking-[0] leading-[1.6] text-[15.5px] lg:text-[16px]" style={{ color: COLORS.graphite }}>{section.copy}</p>
      <Link to={section.to} className="mt-10 inline-flex items-center gap-1.5 text-[16px] font-normal text-[#4285F4] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
        {section.link}
        <ChevronIcon className="h-4 w-4" />
      </Link>
    </div>
  );
});

function LandingMeetSection() {
  const { index: wordIndex } = useCycleIndex(MEET_WORDS.length, MEET_WORD_MS);
  /* the reveal ref rides the SECTION, not the header: the grid runs several
     viewports deep, and keying the state to the header would wipe the story
     while the reader is still inside it */
  const { ref: revealRef, visible } = useRevealContinuous();
  const { active, setStepRef } = useActiveStep(MEET_SECTIONS.length);
  const sectionRef = useRef(null);
  const setSectionRef = (n) => { sectionRef.current = n; revealRef.current = n; };
  const scrollToRow = (i) => {
    const rows = sectionRef.current?.querySelectorAll("[data-step]");
    rows?.[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <section ref={setSectionRef} data-section="04-meet" className="relative z-10 bg-white [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <div className="px-6">
        <FadeReveal visible={visible}>
          <p className="text-center uppercase" style={{ color: COLORS.slate }}>Meet Visionary</p>
          <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
            It <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{MEET_WORDS[wordIndex]}</span>
          </h2>
          <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
            Visionary continues your journey instead of restarting it.
          </p>
        </FadeReveal>
      </div>
      {/* the frosted tab band pins just below the straight glass bar (56px
          bar + 8px breath) — the same sheet the story arrived on */}
      <div className="glass sticky top-[64px] z-30 border-b border-[#121317]/10 px-4 py-5 sm:px-6"><MeetTabs active={active} onSelect={scrollToRow} /></div>
      {/* the story grid rides the same choreography (opacity only — the
          sticky copy column inside must keep its pin). Panels are compact —
          a 4:3 framed image per audience, one breath between rows — so a tab
          click lands its row without a long scroll. */}
      <FadeSoft visible={visible}>
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-20 pt-12 lg:grid-cols-[5fr_6fr] lg:gap-24 lg:px-0 lg:pt-16">
          <div className="hidden lg:block">
            <div className="sticky top-40 flex h-[calc(100svh-200px)] items-center">
              <div key={active} className="hero-fade-up"><MeetCopy section={MEET_SECTIONS[active]} /></div>
            </div>
          </div>
          <div className="flex flex-col gap-24 lg:gap-40 lg:py-12">
            {MEET_SECTIONS.map((s, i) => (
              <div key={s.id}>
                <figure ref={setStepRef(i)} data-step={i} id={`meet-panel-${s.id}`} aria-labelledby={`meet-tab-${s.id}`} className="m-0">
                  <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[var(--radius-media)] border border-[#d2d2d7] lg:mx-0 lg:max-w-none">
                    <img src={MEET_IMG[i]} alt={s.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                  </div>
                </figure>
                <div className="mt-10 lg:hidden"><MeetCopy section={s} /></div>
              </div>
            ))}
          </div>
        </div>
      </FadeSoft>
    </section>
  );
}

/* 07 · LANGUAGE — every language, one understanding. The chips, the four
   brand-hued voice bars, and the rotating questions carry the differentiator
   without a feature tour. */
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
  const { ref, visible } = useRevealContinuous();
  const { index: qIndex } = useCycleIndex(LG_QUESTIONS.length, LG_QUESTION_MS);
  const [lang, setLang] = useState("hi");
  const question = LG_QUESTIONS[qIndex][lang];
  return (
    <section ref={ref} data-section="07-language" className="relative z-10 overflow-hidden bg-[#f8f9fa] px-6" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center uppercase" style={{ color: COLORS.slate }}>Every language</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Every language.<br /><span style={{ color: COLORS.blue }}>One understanding.</span></h2>
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

/* 06 · THE JOURNEY — the page's one dark cinematic chapter. The fill rail
   fills on the active step and advances the story on its own cadence;
   clicking a row takes over. The advance runs on a timer (not the
   animation-end event) so reduced-motion users — whose fill completes
   instantly — get a click-driven story instead of a runaway loop. Text
   colors are set explicitly: the scene-ink contract only restyles p/h2/h3. */
function LandingJourneySection() {
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useRevealContinuous();
  const [active, setActive] = useState(0);
  const [runId, setRunId] = useState(0);
  const select = (i) => { setActive(i); setRunId((r) => r + 1); };
  const next = useCallback(() => { setActive((a) => (a + 1) % JOURNEY_STEPS.length); setRunId((r) => r + 1); }, []);
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(next, JOURNEY_FILL_MS);
    return () => clearTimeout(id);
  }, [next, active, runId, reduced]);
  const step = JOURNEY_STEPS[active];
  return (
    <section ref={ref} data-section="06-journey" className="relative z-10 overflow-hidden" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes cmFill{from{transform:scaleY(0)}to{transform:scaleY(1)}}"}</style>
      <div className={`px-6 transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center uppercase">The journey</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]">You keep changing.<br />Visionary keeps learning with you.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] text-center font-normal tracking-[0.27px] leading-[1.6] text-[16px]">
          New questions bring new work. Visionary helps you carry what you learn into the next step.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1400px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="flex flex-col gap-10">
            {JOURNEY_STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <button key={s.title} type="button" onClick={() => select(i)} aria-expanded={isActive} className="flex items-start gap-6 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                  <span className={`relative w-[4px] shrink-0 overflow-hidden rounded-full transition-all duration-700 ease-google ${isActive ? "h-[96px]" : "mt-1 h-[28px]"}`} style={{ backgroundColor: "rgba(245,247,250,0.18)" }}>
                    {isActive && (
                      <span
                        key={`fill-${active}-${runId}`}
                        className="absolute inset-0 origin-top rounded-full"
                        style={{ backgroundColor: COLORS.blue, transform: reduced ? "scaleY(1)" : "scaleY(0)", animation: reduced ? undefined : `cmFill ${JOURNEY_FILL_MS}ms linear forwards` }}
                      />
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block tracking-[0] leading-[1.15] text-[clamp(24px,2.4vw,32px)]" style={{ color: isActive ? "#f5f7fa" : "rgba(245,247,250,0.55)", fontWeight: isActive ? 500 : 400 }}>{i + 1}. {s.title}</span>
                    <span className={`grid transition-all duration-500 ease-google ${isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <span className="block overflow-hidden">
                        <span className="mt-3 block max-w-[420px] text-[15px] leading-[1.6] tracking-[0.24px]" style={{ color: "rgba(245,247,250,0.72)" }}>{s.copy}</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div key={`${active}-${runId}`} className="hero-fade-up" aria-live="polite">
            <img src={step.image} alt={step.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-[var(--radius-media)] border object-cover lg:aspect-[5/4]" />
          </div>
        </div>
        <h3 className="mx-auto mt-28 max-w-[1400px] text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(28px,2.78vw,40px)]">
          Built for who you are. Ready for <span style={{ color: COLORS.blue }}>who you become.</span>
        </h3>
      </div>
    </section>
  );
}

/* 08 · TRUST — the carousel the persona pages carry (same as /student and
   friends): the rotating word headline, the active title with arrows and
   counter beside the photo cards, each with its white contrast chip. */
const LXTrustCard = React.memo(function LXTrustCard({ card, image }) {
  return (
    <div className="elevation-1 relative w-full max-w-[780px] shrink-0 overflow-hidden rounded-[var(--radius-media)] border bg-white" style={{ borderColor: `${COLORS.ink}1A` }}>
      <img src={image} alt={card.alt} loading="lazy" decoding="async" className="aspect-[8/5] w-full object-cover" />
      {/* the white chip guarantees copy contrast on any image */}
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

function LandingTrustSection() {
  const { ref, visible } = useRevealContinuous();
  const { index, goTo } = useCycleIndex(LX_TRUST_CARDS.length, TRUST_WORD_MS);
  const active = LX_TRUST_CARDS[index];
  const next = LX_TRUST_CARDS[(index + 1) % LX_TRUST_CARDS.length];
  const stepCards = useCallback((d) => goTo(index + d), [goTo, index]);
  return (
    <section ref={ref} data-section="08-trust" className="relative z-10 isolate bg-white [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center uppercase" style={{ color: COLORS.slate }}>Trust and safety</p>
        <h2 className="px-6 text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Your{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{LX_TRUST_WORDS[index]}</span>
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Your learning, conversations, ideas, and progress are personal. Visionary keeps it that way.
        </p>
        <div className="mx-auto mt-14 grid w-full max-w-[1600px] grid-cols-1 items-start gap-16 px-6 lg:mt-20 lg:grid-cols-[4fr_8fr] lg:gap-24 lg:px-0">
          <div className="lg:pl-[var(--frame-x)]">
            <h3 key={active.title} className="hero-fade-up max-w-[460px] font-medium tracking-[-0.002em] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
              {active.title}
            </h3>
            <div className="mt-10 flex items-center gap-4 lg:ml-24">
              <button type="button" aria-label="Previous trust card" onClick={() => stepCards(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
                <ChevronIcon direction="left" />
              </button>
              <button type="button" aria-label="Next trust card" onClick={() => stepCards(1)} className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
                <ChevronIcon direction="right" />
              </button>
              <span className="ml-2 font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
                0{index + 1} / 0{LX_TRUST_CARDS.length}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-8 2xl:grid 2xl:grid-cols-2 2xl:gap-10">
            <div key={`a-${index}`} className="hero-fade-up w-full max-w-[780px]"><LXTrustCard card={active} image={LX_TRUST_IMG[index % LX_TRUST_IMG.length]} /></div>
            <div key={`b-${index}`} className="hero-fade-up hidden w-full max-w-[780px] 2xl:block [animation-delay:80ms] [animation-fill-mode:both]"><LXTrustCard card={next} image={LX_TRUST_IMG[(index + 1) % LX_TRUST_IMG.length]} /></div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* 09 · CTA — the closer sits on a soft blue field that deepens toward the
   top and breathes out at the bottom; one primary pill, one quiet path */
function LandingCTASection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section ref={ref} data-section="09-cta" className="relative z-10 px-6" style={{ fontFamily: FONT_FAMILY, backgroundImage: "linear-gradient(180deg, #d9e6fd 0%, #e8f0fe 48%, #f5f9ff 100%)" }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Start today</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Your next step starts here.</h2>
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

/* ═══════════════════════ PAGE ═══════════════════════
   The Vision Pro anatomy: the family stage pins to the viewport, the story
   glides over it on frosted glass (problem), the thesis fades up
   (promise), the product meets its five audiences (meet), the language
   chapter, the journey on the one dark scene, trust, and the blue closer.
   Sections stay direct children of main — the bridge's chapter contract
   (hairlines, transparent joins, the dark scene) keys on that shape — each
   carrying z-10 above the pinned hero. Routing lives in the nav and the
   hero's audience row; depth lives on the pages those links open. */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <LandingHeroSection />
        {/* the glass sheet — the hero's first cover, the nav's own frost */}
        <div aria-hidden="true" className="glass relative z-10 h-[clamp(140px,24svh,280px)] border-b border-[#121317]/10" />
        <LandingProblemSection />
        <LandingPromiseSection />
        <LandingMeetSection />
        <LandingLanguageSection />
        <LandingJourneySection />
        <LandingTrustSection />
        <LandingCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
