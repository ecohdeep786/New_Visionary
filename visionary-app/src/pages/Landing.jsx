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
import teacherProblem from "@/assets/teacher-problem-1.webp";
import problemrevision from "@/assets/problem-revision.webp";
import proProblem from "@/assets/professional-problem-2.webp";
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

/* ═══════════════════════ MODELS ═══════════════════════ */
const PROBLEM_SLIDES = [
  { black: "Teaching everyone is possible.", blue: "Reaching everyone isn't", persona: "A teacher", quote: "I taught the whole class. Half of them still left lost.", image: teacherProblem, alt: "Teacher looking overwhelmed after class" },
  { black: "Seeing progress is easy.", blue: "Knowing how to help isn't", persona: "A parent", quote: "The report card says fine. I still don't know how to help at home.", image: problemrevision, alt: "Parent reviewing a child's progress" },
  { black: "Accessing knowledge is easy.", blue: "Applying it isn't", persona: "A student", quote: "I watched eight hours of videos and still couldn't solve a single problem on my own.", image: problemunderstanding, alt: "Student studying alone with a tablet" },
  { black: "Knowledge is everywhere.", blue: "Turning it into capability isn't", persona: "A professional", quote: "I read every article. I still can't turn them into the work.", image: proProblem, alt: "Professional overwhelmed by learning resources" },
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
   one cinematic subject, one voice — nothing else on the stage. The
   photography is studio-white, so it renders unframed on the page's own
   white (the hero's language): the subject stands on the section floor,
   edge-to-edge breathing, no card, no crop. All four subjects stay mounted
   and crossfade — a keyed <img> remount refetched and flashed an empty
   frame on every slide advance, worst on slow phones. */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, PROBLEM_MS);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative z-10 overflow-hidden bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="sr-only">Stories from a teacher, a parent, a student, and a professional about the moment understanding breaks down.</p>
        {/* the section's own --public-section-py (bridge contract) provides the
            chapter's opening/closing breath — no inner padding here */}
        <div className="px-6">
          <p className="text-center uppercase" style={{ color: COLORS.slate }}>Why Visionary exists</p>
          <h2 key={`h-${index}`} className="hero-fade-up mx-auto mt-[clamp(14px,1.8vw,24px)] max-w-[980px] text-balance text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(28px,3.8vw,56px)]" style={{ color: COLORS.ink }}>
            {slide.black} <span style={{ color: COLORS.blue }}>{slide.blue}</span>.
          </h2>
        </div>
        <figure className="m-0">
          {/* the chapter stage — one-viewport comprehension: statement, subject,
              persona, quote all land inside the first screen, the way Apple's
              compact chapters read in a single glance */}
          <div className="relative mt-[clamp(24px,2.2vw,32px)] h-[clamp(280px,40svh,340px)] sm:h-[clamp(300px,36svh,340px)]">
            {PROBLEM_SLIDES.map((s, i) => (
              <img
                key={s.alt}
                src={s.image}
                alt={i === index ? s.alt : ""}
                aria-hidden={i !== index}
                loading="eager"
                decoding="async"
                draggable="false"
                style={{
                  /* the studio photos' subjects touch their canvas edges;
                     unframed, those cuts would read as hard lines — dissolve
                     them into the page's own white (the hero's floor recipe).
                     The img element is sized to the painted square (h-full
                     w-auto, centered) so the mask tracks the photo, not the
                     full-bleed band. */
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, black 78%, transparent 97%)",
                  WebkitMaskComposite: "source-in",
                  maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, black 78%, transparent 97%)",
                  maskComposite: "intersect",
                }}
                className={`absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none transition-opacity duration-700 ease-google motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
          <figcaption key={`q-${index}`} className="hero-fade-up mx-auto mt-[clamp(16px,2vw,24px)] w-full max-w-[640px] px-6 text-center [animation-delay:80ms] [animation-fill-mode:both]">
            <p className="font-medium tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.slate }}>{slide.persona}</p>
            {/* the reserved two-line slot keeps the dots from jumping when a
                shorter quote occupies one line */}
            <p className="mt-2.5 flex min-h-[2.9em] items-center justify-center font-normal tracking-[0] leading-[1.45] text-[clamp(17px,1.5vw,21px)]" style={{ color: COLORS.ink }}>{slide.quote}</p>
          </figcaption>
        </figure>
        <div className="mt-6 flex justify-center"><CarouselDots total={PROBLEM_SLIDES.length} active={index} onSelect={goTo} /></div>
      </FadeReveal>
    </section>
  );
}

/* 03 · PROMISE — not a staying section: the turn of the story. After the
   problem's empathy, the page speaks once — the what-if — and the line is
   scroll-linked cinema: it fades up and settles as the reader enters, holds
   center stage for a beat, then drifts up and dissolves as the product
   chapter arrives. Reduced motion reads it as a static statement. */
function LandingPromiseSection() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (reduced) return undefined;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  const copy = (
    <h2 className="mx-auto max-w-[1080px] text-balance text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(34px,5vw,72px)]" style={{ color: COLORS.ink }}>
      What if your intelligence never forgot{" "}
      <span className="accent-gradient">where you were?</span>
    </h2>
  );

  if (reduced) {
    return (
      <section data-section="03-promise" className="relative z-10 bg-white px-6 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
        <div className="py-[clamp(16px,3.4vw,48px)]">{copy}</div>
      </section>
    );
  }

  /* scroll phases — in: 0→0.3, hold: 0.3→0.7, out: 0.7→1 */
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const fadeIn = clamp01(progress / 0.3);
  const fadeOut = 1 - clamp01((progress - 0.7) / 0.3);
  const opacity = Math.min(fadeIn, fadeOut);
  const translateY = (1 - fadeIn) * 30 - (1 - fadeOut) * 24;
  const scale = 0.965 + 0.035 * Math.min(fadeIn, fadeOut);

  return (
    <section ref={ref} data-section="03-promise" className="relative z-10 bg-white [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY, height: "200vh" }}>
      <div className="sticky top-0 flex h-[100svh] items-center justify-center px-6">
        <div style={{ opacity, transform: `translateY(${translateY}px) scale(${scale})`, willChange: "opacity, transform" }}>
          {copy}
        </div>
      </div>
    </section>
  );
}

/* 04 · MEET — the product, for whom: one frosted tablist pinned under the
   nav (the glass motif carried through the page), one scroll-driven story
   column, and the rotating word/phrase tickers. */
const MeetHeading = React.memo(function MeetHeading({ section, index }) {
  const blue = section.blues[index % section.blues.length];
  return (
    <h3 className="font-medium tracking-[-0.009em] leading-[1.12] text-[clamp(28px,3.1vw,48px)]" style={{ color: COLORS.ink }}>
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
    <div className="max-w-[560px]">
      <MeetHeading section={section} index={index} />
      <p className="mt-5 font-normal tracking-[0] leading-[1.6] text-[17px]" style={{ color: COLORS.graphite }}>{section.copy}</p>
      {/* the audience CTA — the page's one black pill system, compact tier */}
      <Link
        to={section.to}
        className="mt-8 inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#121317] px-6 text-[15px] font-medium tracking-[0.24px] text-white transition-all duration-200 hover:bg-[#2c2d31] hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
      >
        {section.link}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
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
          {/* Apple's header rhythm: the kicker sits tight above the headline
             (~12px), the subhead tight below (~16px) — one thought, not three
             floating rows */}
          <p className="text-center text-[15px] font-normal" style={{ color: COLORS.slate }}>Meet Visionary</p>
          {/* the reserved slot: phrases only wrap below sm (desktop always
              fits one line) — 2.7em covers two lines at the browser's real
              1.32 line metrics, so the page never jumps when the word cycles */}
          <h2 className="mt-3 flex min-h-[2.7em] items-center justify-center text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)] sm:min-h-0" style={{ color: COLORS.ink }}>
            <span>
              It{" "}
              <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{MEET_WORDS[wordIndex]}</span>
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-[720px] text-center font-normal tracking-[0] leading-[1.55] text-[18px]" style={{ color: COLORS.slate }}>
            Visionary continues your journey instead of restarting it.
          </p>
        </FadeReveal>
      </div>
      {/* the local sub-nav — Apple's product-page pattern: a frosted band that
          pins under the nav and scrolls the reader to each audience chapter.
          One clear breath (36px) between the intro stack and the band, so the
          control reads as the chapter's navigator, not a fourth text row. */}
      <div className="glass sticky top-[56px] z-30 mt-9 px-4 py-4 sm:px-6"><MeetTabs active={active} onSelect={scrollToRow} /></div>
      <FadeSoft visible={visible}>
        {/* the audience chapters — one composed section per tab: copy on the
            left (heading, subheading, button), portrait on the right. The
            left column pins and swaps with the active tab while the portraits
            scroll — the story rides the reader's scroll. Portraits render
            unframed at their natural square with the page-wide floor
            dissolve, so five chapters read as one continuous studio story. */}
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-y-14 px-6 pb-28 pt-14 sm:px-10 lg:grid-cols-[5fr_6fr] lg:gap-x-36 lg:px-10">
          <div className="hidden lg:block">
            <div className="sticky top-40 flex h-[calc(100svh-200px)] items-center">
              <div key={active} className="hero-fade-up"><MeetCopy section={MEET_SECTIONS[active]} /></div>
            </div>
          </div>
          <div className="flex flex-col lg:py-8">
            {MEET_SECTIONS.map((s, i) => (
              <div key={s.id} className={i > 0 ? "mt-24 lg:mt-40" : ""}>
                <figure ref={setStepRef(i)} data-step={i} id={`meet-panel-${s.id}`} aria-labelledby={`meet-tab-${s.id}`} className="m-0 flex justify-center">
                  <img
                    src={MEET_IMG[i]}
                    alt={s.alt}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    style={{
                      /* the page-wide floor dissolve — same as hero and problem */
                      WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent 97%)",
                      maskImage: "linear-gradient(to bottom, black 78%, transparent 97%)",
                    }}
                    className="h-auto w-full max-w-[440px] select-none"
                  />
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
          className={`rounded-full px-5 py-2 font-normal tracking-[0] leading-[20px] text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${active === lang.code ? "" : "border hover:bg-[#121317]/5"}`}
          style={{ backgroundColor: active === lang.code ? COLORS.chipBg : "transparent", color: COLORS.ink, borderColor: active === lang.code ? "transparent" : `${COLORS.ink}40` }}>
          {lang.label}
        </button>
      ))}
      <span className="font-normal tracking-[0] leading-[20px] text-[14px]" style={{ color: COLORS.graphite }}>+20 languages</span>
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
        {/* the meet header rhythm — kicker 12px above the display line, the
            support 16px below; the kicker names the faculty, the statement
            names the promise, no word repeats */}
        <p className="text-center text-[15px] font-normal" style={{ color: COLORS.slate }}>In your voice</p>
        <h2 className="mt-3 text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Every language.<br /><span style={{ color: COLORS.blue }}>One understanding.</span></h2>
        <p className="mx-auto mt-4 max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Visionary understands what you mean, in the language you think in.
        </p>
        {/* the chapter's control row — the picker swaps the question's script
            live; 36px breath before controls (the confirmed rhythm law) */}
        <div className="mt-9">
          <LGLanguageChips active={lang} onSelect={setLang} />
        </div>
        {/* the stage — one composed demo: the four brand hues listening, the
            question in the chosen script, the quiet legend. The field stays
            clean — no haze behind text, no floating widget, the way an Apple
            feature chapter holds its stage. */}
        <div className="mx-auto mt-12 w-full max-w-[860px] sm:mt-16">
          <div className="flex items-end justify-center gap-2" aria-hidden="true">
            {["#4285F4", "#EA4335", "#FBBC04", "#34A853"].map((c, i) => (
              <span key={`${c}-${i}`} className="h-10 w-2 rounded-full" style={{ backgroundColor: c, transformOrigin: "center", animation: `voiceDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
          {/* the reserved slot (2.7em ≥ two lines at the browser's real
              1.32 line metrics) keeps the voice bars, chips, and caption
              from jumping when a longer question wraps */}
          <p aria-live="polite" lang={lang} className="mx-auto mt-7 flex min-h-[2.7em] max-w-[760px] items-center justify-center text-center font-normal tracking-[0] leading-[1.25] text-[clamp(26px,3.4vw,48px)]" style={{ color: COLORS.blue }}>
            <span key={`${lang}-${qIndex}`} className="hero-fade-up inline">{question}</span>
          </p>
          <p className="mt-5 text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
            Listening in {LG_CHIPS.find((c) => c.code === lang)?.label || lang} · understood in every language
          </p>
          <p className="mt-1 text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
            Use voice or text in the way you're comfortable.
          </p>
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
        {/* the glass sheet — the hero's first cover. The frost fades in from
            its leading edge (mask), so the sheet never slices the pinned
            headline mid-glyph: the family and copy dissolve into white the
            way the hero's own floor dissolves them. */}
        <div
          aria-hidden="true"
          className="glass relative z-10 h-[clamp(200px,30svh,340px)] border-b border-[#121317]/10"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 62%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 62%)",
          }}
        />
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
