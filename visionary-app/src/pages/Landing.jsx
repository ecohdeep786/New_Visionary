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
import { ShieldCheck, HeartHandshake, Scale, Play, Pause } from "lucide-react";

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
/* Every landing reveal rides Apple's resolve-out curve
   cubic-bezier(0.16,1,0.3,1) — the deceleration you feel on apple.com's
   own scroll reveals (the --ease-out-apple token in premium.css). */
const EASE_APPLE = "ease-apple";

const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ${EASE_APPLE} ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* Opacity-only reveal — for wrappers that contain sticky children, where a
   transform would interfere with the pin. */
const FadeSoft = React.memo(function FadeSoft({ visible, children, className = "" }) {
  return (
    <div className={`transition-opacity duration-700 ${EASE_APPLE} ${visible ? "opacity-100" : "opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

const CarouselDots = React.memo(function CarouselDots({ total, active, onSelect, tone = "ink" }) {
  /* tone "pill" — the AirPods highlights dotnav: uniform warm-gray dots inside
     the light pill, the active one stretching into a 48×8 rounded bar */
  const pill = tone === "pill";
  return (
    <div className={`flex items-center ${pill ? "gap-4" : "gap-2"}`} role="group" aria-label="Carousel slides">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-pressed={i === active}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onSelect(i)}
          className={`relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-3 after:-inset-x-1.5 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${i === active ? (pill ? "w-12" : "w-10") : "w-2 hover:opacity-70"}`}
          style={{ backgroundColor: pill ? "rgba(29,29,31,0.6)" : i === active ? COLORS.ink : `${COLORS.ink}33` }}
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
const LG_RING_MS = 3600;

const JOURNEY_STEPS = [
  { title: "Adapt", copy: "When what you need changes, the way you learn can change with it.", image: cmAdapt, alt: "Child learning with a tablet outdoors", tone: "light" },
  { title: "Grow", copy: "When you know more, you should be able to go further.", image: cmGrow, alt: "Student growing their skills", tone: "light" },
  { title: "Create", copy: "When an idea becomes real, your intelligence should come with you.", image: cmCreate, alt: "Person building a real project", tone: "light" },
  { title: "Continue", copy: "Wherever you go next, you shouldn't have to begin again.", image: cmContinue, alt: "Learner continuing their journey", tone: "dark" },
];
const JOURNEY_CARD_MS = 5000;

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
      ctaLabel="Start free"
      /* the front door carries a single pill — the persona heroes keep their pair */
      secondaryLabel={null}
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
        {/* the section's own compact-band override (bridge: 02-problem) provides
            the chapter's opening/closing breath — no inner padding here */}
        <div className="px-6">
          <p className="text-center text-[15px] font-normal" style={{ color: COLORS.slate }}>Why Visionary exists</p>
          <h2 key={`h-${index}`} className="hero-fade-up mx-auto mt-[clamp(14px,1.8vw,24px)] max-w-[980px] text-balance text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(28px,4vw,56px)]" style={{ color: COLORS.ink }}>
            {slide.black} <span style={{ color: COLORS.blue }}>{slide.blue}</span>.
          </h2>
        </div>
        <figure className="m-0">
          {/* the chapter stage — one-glance comprehension: statement, subject,
              persona, quote all land inside ~1.2 viewports, the way Apple's
              compact chapters read. The statement→stage drop opens to 65px on
              desktop (Apple's product-shot drop), and the stage itself scales
              WITH the device: it tracks the smaller of 44vw / 58svh so the
              subject earns real presence on large screens while the phone
              stage stays a full-bleed crop. */}
          <div className="relative mt-[clamp(32px,4.5vw,72px)] h-[clamp(300px,42svh,380px)] sm:h-[clamp(300px,min(44vw,58svh),600px)]">
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
                className={`absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none transition-opacity duration-700 ${EASE_APPLE} motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
          <figcaption key={`q-${index}`} className="hero-fade-up mx-auto mt-[clamp(16px,2.4vw,32px)] w-full max-w-[640px] px-6 text-center [animation-delay:80ms] [animation-fill-mode:both]">
            <p className="font-medium tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.slate }}>{slide.persona}</p>
            {/* the reserved two-line slot keeps the dots from jumping when a
                shorter quote occupies one line */}
            <p className="mt-2.5 flex min-h-[2.9em] items-center justify-center font-normal tracking-[0] leading-[1.45] text-[clamp(17px,1.5vw,21px)]" style={{ color: COLORS.ink }}>{slide.quote}</p>
          </figcaption>
        </figure>
        <div className="mt-8 flex justify-center"><CarouselDots total={PROBLEM_SLIDES.length} active={index} onSelect={goTo} /></div>
      </FadeReveal>
    </section>
  );
}

/* 03 · PROMISE — not a section: a sentence. The turn of the story — the
   page speaks the what-if once, and the line behaves like Apple's intro
   beats: it fades up as the reader arrives, holds for the beat, then fades
   back down and lets go as the product chapter (meet) arrives. It rides
   the same reveal band every other chapter uses, so it genuinely appears
   and disappears with the scroll — no pinned 200vh cinema, no staying. */
function LandingPromiseSection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section ref={ref} data-section="03-promise" className="relative z-10 bg-white px-6 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <h2 className="mx-auto max-w-[980px] text-balance text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(34px,5vw,72px)]" style={{ color: COLORS.ink }}>
          What if your intelligence never forgot{" "}
          <span className="accent-gradient">where you were?</span>
        </h2>
      </FadeReveal>
    </section>
  );
}

/* 04 · MEET — the product, for whom: one frosted tablist pinned under the
   nav (the glass motif carried through the page), one scroll-driven story
   column, and the rotating word/phrase tickers. */
const MeetHeading = React.memo(function MeetHeading({ section, index }) {
  const blue = section.blues[index % section.blues.length];
  return (
    /* Apple's 48px section-header tier: -0.002em tracking, 1.08 leading */
    <h3 className="font-medium tracking-[-0.002em] leading-[1.08] text-[clamp(28px,3.1vw,48px)]" style={{ color: COLORS.ink }}>
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
  const stripRef = useRef(null);
  /* Apple/Google segmented behavior on narrow screens: the chosen chip
     slides to the center of the strip. Deterministic scrollTo math instead
     of scrollIntoView — the page often smooth-scrolls at the same moment
     (tab click → chapter), and browsers cancel scrollIntoView's own smooth
     scroll mid-flight. Fired on click AND when the scroll-sync steps the
     active chip, so the chip always leads the eye. */
  const centerTab = useCallback((i) => {
    const strip = stripRef.current;
    const btn = tabRefs.current[i];
    if (!strip || !btn || strip.scrollWidth <= strip.clientWidth) return;
    /* Apple/Google segmented rule: the strip only moves when the chosen
       chip is off-screen — a chip already in view stays put (no wiggle). */
    const srect = strip.getBoundingClientRect();
    const brect = btn.getBoundingClientRect();
    if (brect.left >= srect.left && brect.right <= srect.right) return;
    const target = btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, Math.min(target, strip.scrollWidth - strip.clientWidth)), behavior: "smooth" });
  }, []);
  useEffect(() => { centerTab(active); }, [active, centerTab]);
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
        ref={stripRef}
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
            onClick={() => { onSelect(i); centerTab(i); }}
            className={`flex h-full min-w-[104px] flex-none items-center justify-center rounded-[90px] px-4 text-[13px] tracking-[0.24px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4285F4] sm:min-w-0 sm:flex-1 sm:text-[14px] ${active === i ? "font-medium" : "font-normal"}`}
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
      {/* the audience CTA — Apple's pill spec: 44px tall, 17px label, 24px
          side padding (measured "Buy"/"Learn more" buttons) */}
      <Link
        to={section.to}
        className="mt-8 inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#121317] px-6 text-[1.0625rem] font-medium tracking-[0.24px] text-white transition-all duration-200 hover:bg-[#2c2d31] hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
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
          {/* Apple's 64px chapter-statement tier ("Get to know AirPods."):
              64px from 1068px up, easing to 40px on phones — the product
              chapter outranks the 56px story statements around it. */}
          <h2 className="mt-3 flex min-h-[2.7em] items-center justify-center text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(40px,6vw,64px)] sm:min-h-0" style={{ color: COLORS.ink }}>
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
          The band earns room to read: after the strip, a full breath
          (48px mobile / 80px desktop — Apple's localnav→first-chapter gap
          measured on /iphone-15-pro-max) lets the first row land without
          pressing against the control, so the rectangle reads as the
          chapter's navigator, not a crowbar. */}
      <div className="glass sticky top-[56px] z-30 mt-9 px-4 py-4 sm:px-6"><MeetTabs active={active} onSelect={scrollToRow} /></div>
      <FadeSoft visible={visible}>
        {/* the audience chapters — Apple's chapter-row anatomy: one composed
            row per audience. The rows ride the SAME centered axis as the tab
            rectangle above them (980 container − 40px gutters = the strip's
            exact 900px), so the composition hangs centered under the pill
            like Apple's product chapters hang under their localnav. Desktop:
            copy left / portrait right, CENTERED on one axis, 80px apart (the
            measured Apple copy→media gap); rows breathe on the premium ladder
            (96px mobile / 144px desktop). Phones: the copy leads and the
            portrait follows beneath it, exactly how an Apple product chapter
            reads top-to-bottom. The pinned tab band drives the rows: whichever
            chapter the reader is inside lights its chip, and the rows carry
            the step markers the band watches. */}
        <div className="mx-auto grid w-full max-w-[980px] grid-cols-1 gap-y-20 px-4 pt-12 sm:px-10 sm:pt-14 lg:gap-y-0 lg:px-10 lg:pt-20">
          {MEET_SECTIONS.map((s, i) => (
            <div
              key={s.id}
              ref={setStepRef(i)}
              data-step={i}
              id={`meet-panel-${s.id}`}
              role="tabpanel"
              aria-labelledby={`meet-tab-${s.id}`}
              className={`lg:grid lg:grid-cols-[5fr_6fr] lg:items-center lg:gap-x-20 ${i > 0 ? "lg:pt-32" : ""}`}
            >
              <div>
                <MeetCopy section={s} />
              </div>
              <figure className="m-0 mt-12 flex justify-center lg:mt-0">
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
                  className="h-auto w-full max-w-[400px] select-none lg:max-w-[520px]"
                />
              </figure>
            </div>
          ))}
        </div>
      </FadeSoft>
    </section>
  );
}

/* 07 · LANGUAGE — the voice dial. A hairline ring carries six wordless
   language dots gliding one step per beat; the language landing at 12
   o'clock speaks its own question at the center — name as a quiet caption,
   the question at statement scale in ink, the brand hues listening beneath.
   No orbiting ornament: anything that can freeze mid-motion reads as a
   defect under reduced motion. Dots jump on click; reduced motion keeps
   the tour but steps it instantly. */
const LGOrbitDots = React.memo(function LGOrbitDots({ activeIndex, onSelect, reduced }) {
  const stepDeg = 360 / LG_CHIPS.length;
  /* dots are laid out counterclockwise so each advance spins the ring
     clockwise and still lands the active language at 12 o'clock */
  const rotation = activeIndex * stepDeg;
  return (
    <>
      {/* the orbit track */}
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="49.75" fill="none" stroke={COLORS.ink} strokeOpacity="0.1" strokeWidth="0.25" />
      </svg>
      {/* the rotating dot ring */}
      <div className={`absolute inset-0 transition-transform ${EASE_APPLE}`} style={{ transform: `rotate(${rotation}deg)`, transitionDuration: reduced ? "0ms" : "700ms" }}>
        {LG_CHIPS.map((c, i) => {
          const isActive = i === activeIndex;
          return (
            <div key={c.code} className="absolute inset-0" style={{ transform: `rotate(${-i * stepDeg}deg)` }}>
              <button type="button" aria-pressed={isActive} aria-label={`Show ${c.label}`}
                onClick={() => onSelect(i)}
                className="absolute left-1/2 top-0 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                style={{ boxShadow: isActive ? "0 0 0 6px rgba(18,19,23,0.06)" : "none" }}>
                <span className="block rounded-full transition-all duration-300"
                  style={{ width: isActive ? 11 : 7, height: isActive ? 11 : 7, backgroundColor: isActive ? COLORS.ink : `${COLORS.ink}38` }} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
});

function LandingLanguageSection() {
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useRevealContinuous();
  const { index, goTo } = useCycleIndex(LG_CHIPS.length, LG_RING_MS);
  const active = LG_CHIPS[index];
  /* each language tours with its own question — the dot at the reading
     position and the script at the center always belong to each other
     (LG_QUESTIONS holds 4 lines for 6 languages, so the tour wraps) */
  const question = LG_QUESTIONS[index % LG_QUESTIONS.length][active.code];
  return (
    <section ref={ref} data-section="07-language" className="relative z-10 overflow-hidden bg-white px-6" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <div className={`transition-all duration-700 ${EASE_APPLE} ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        {/* the meet header rhythm — the kicker names the faculty, the
            statement names the promise, no word repeats */}
        <p className="text-center text-[15px] font-normal" style={{ color: COLORS.slate }}>In your voice</p>
        <h2 className="mt-3 text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Every language.<br /><span style={{ color: COLORS.blue }}>One understanding.</span></h2>
        {/* the voice dial — dots ride the ring while the chosen language's
            question holds the center; 36px breath before the stage (the
            confirmed rhythm law) */}
        <div className="mx-auto mt-9 w-full max-w-[460px] sm:mt-14">
          <div className="relative aspect-square w-full" role="group" aria-label="Language selection">
            <LGOrbitDots activeIndex={index} onSelect={goTo} reduced={reduced} />
            {/* the center — the speaking language's name, its question at
                statement scale, the brand hues listening beneath. The fixed
                inscribed region is sized for the worst-wrapping script, so
                nothing inside can ever crowd the ring. */}
            <div className="absolute inset-x-[16%] inset-y-[18%] flex flex-col items-center justify-center text-center">
              <span key={`name-${index}`} className="hero-fade-up text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: COLORS.slate }}>{active.label}</span>
              <p aria-live="polite" lang={active.code} className="mt-3 flex items-center justify-center text-center font-medium tracking-[-0.014em] leading-[1.15] text-[clamp(22px,2.2vw,32px)]" style={{ color: COLORS.ink }}>
                <span key={index} className="hero-fade-up">{question}</span>
              </p>
              <div className="mt-4 flex items-end justify-center gap-1.5" aria-hidden="true">
                {["#4285F4", "#EA4335", "#FBBC04", "#34A853"].map((c, i) => (
                  <span key={`${c}-${i}`} className="h-5 w-1.5 rounded-full" style={{ backgroundColor: c, transformOrigin: "center", animation: `voiceDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-6 w-full max-w-[860px] sm:mt-7">
          <p className="text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.slate }}>
            Listening in {active.label} · understood in every language
          </p>
          <p className="mt-1 text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.slate }}>
            +20 more languages · use voice or text in the way you're comfortable.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 06 · THE JOURNEY — Apple's highlights gallery (the AirPods Pro page's
   "Get the highlights." card slide), flowing straight out of the language
   chapter's white field (no kicker, no sub — the statement alone sits
   left-aligned at the 56 statement tier, the way "Get the highlights."
   follows the hero film). One story card at a time with the next card
   peeking at the viewport edge, and the caption living ON the card: a
   semibold line over its support line, bare on the media, bottom-center
   where every photo stays clean (dark media flips to white type). Below
   the card, the controls are Apple's exact gallery cluster: the light-gray
   pill (#E8E8ED) around the dot nav — uniform rgba(29,29,31,.6) dots, the
   active one stretching into a 48×8 bar — beside a 56px gray play/pause
   circle. Reduced motion keeps the tour but steps it instantly — the
   play/pause control still stops and resumes it. */
function LandingJourneySection() {
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useRevealContinuous();
  const trackRef = useRef(null);
  const lockRef = useRef(0);
  const rafRef = useRef(0);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  const stepTo = useCallback((i) => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.children[0];
    const unit = track.children[1] ? track.children[1].offsetLeft - first.offsetLeft : first.offsetWidth;
    const clamped = Math.min(JOURNEY_STEPS.length - 1, Math.max(0, i));
    setActive(clamped);
    /* the lock keeps the scroll listener from re-deriving intermediate
       indices (and jittering the dot pill) while the smooth scroll runs */
    lockRef.current = Date.now() + 700;
    track.scrollTo({ left: clamped * unit, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => stepTo((active + 1) % JOURNEY_STEPS.length), JOURNEY_CARD_MS);
    return () => clearInterval(id);
  }, [playing, active, stepTo]);

  /* swiping the track by hand keeps the dots honest */
  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const track = trackRef.current;
      if (!track || !track.children[1] || Date.now() < lockRef.current) return;
      const unit = track.children[1].offsetLeft - track.children[0].offsetLeft || 1;
      setActive(Math.min(JOURNEY_STEPS.length - 1, Math.max(0, Math.round(track.scrollLeft / unit))));
    });
  }, []);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <section ref={ref} data-section="06-journey" className="relative z-10 bg-white [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <div className={`transition-all duration-700 ${EASE_APPLE} ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        {/* the header — Apple's "Get the highlights." treatment: the statement
            alone, LEFT-aligned, on the 40px highlights tier (32px on phones).
            From lg it sits on Apple's measured page gutter (left: 90px @1440,
            6.25vw — measured live on /education/k12/) instead of hugging the
            viewport edge, and the first card of the slide starts EXACTLY at
            the heading's left edge — the track carries the same gutter, so
            heading and cards share one spine. Apple's 40px tier carries zero
            tracking (measured Oct 2026). */}
        <div className="px-6 lg:px-[clamp(24px,6.25vw,90px)]">
          <h2 className="font-medium tracking-[0] leading-[1.1] text-[clamp(32px,2.78vw,40px)]" style={{ color: COLORS.ink }}>Life changes. Visionary keeps pace.</h2>
        </div>
        {/* the card slide — the track bleeds to the viewport edge so the next
            card peeks, inviting the reader on (the Apple gallery signature) */}
        <div ref={trackRef} onScroll={onScroll} role="group" aria-roledescription="carousel" aria-label="The journey, one step at a time"
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-pl-6 px-6 [scrollbar-width:none] sm:mt-16 lg:scroll-pl-[clamp(24px,6.25vw,90px)] lg:px-[clamp(24px,6.25vw,90px)] [&::-webkit-scrollbar]:hidden">
          {JOURNEY_STEPS.map((s, i) => (
              <figure key={s.title} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${JOURNEY_STEPS.length}: ${s.title}`}
                className="relative m-0 flex w-[78%] flex-none snap-start flex-col overflow-hidden rounded-[18px] bg-[#F5F5F7] sm:w-[46%] lg:w-[56%] lg:max-w-[840px]">
                <img src={s.image} alt={s.alt} loading="eager" decoding="async" draggable="false"
                  className="aspect-[4/3] w-full flex-none select-none object-cover sm:aspect-[16/10] lg:aspect-[16/8.5]" />
                {/* the on-card caption — a padded block UNDER the media on every
                    device (Apple's line-up tile anatomy: flush-top photo, text
                    below). The active card's block fades up as the story
                    advances. The support copy stays in the sr-only live region. */}
                <figcaption className={`flex flex-col px-6 pb-7 pt-6 text-left sm:px-8 lg:px-10 lg:pb-8 lg:pt-7 ${i === active ? "hero-fade-up" : ""}`}>
                  <p className="font-semibold tracking-[0.007em] leading-[1.14] text-[clamp(19px,1.4vw,24px)] text-[rgba(18,19,23,0.92)]">{s.title}</p>
                  <p className="mt-2 font-normal leading-[1.47] text-[clamp(14px,1vw,17px)] text-[rgba(18,19,23,0.68)]">{s.copy}</p>
                </figcaption>
              </figure>
          ))}
        </div>
        {/* the gallery controls — Apple's media-card gallery cluster: the
            #E8E8ED pill around the dot nav beside the 56px play/pause circle */}
        <div className="mt-12 flex items-center justify-center gap-4 px-6 sm:mt-16">
          <div className="flex h-12 items-center rounded-full bg-[#E8E8ED] px-4 sm:h-14">
            <CarouselDots total={JOURNEY_STEPS.length} active={active} onSelect={stepTo} tone="pill" />
          </div>
          <button
            type="button"
            aria-label={playing ? "Pause the journey" : "Play the journey"}
            aria-pressed={!playing}
            onClick={() => setPlaying((v) => !v)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8E8ED] transition-colors hover:bg-[#DDDDE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 sm:h-14 sm:w-14"
            style={{ color: COLORS.ink }}
          >
            {playing ? <Pause className="h-[18px] w-[18px]" strokeWidth={2.4} /> : <Play className="h-[18px] w-[18px] translate-x-[1px] fill-current" strokeWidth={2.4} />}
          </button>
        </div>
        <p aria-live="polite" className="sr-only">{`${JOURNEY_STEPS[active].title}. ${JOURNEY_STEPS[active].copy}`}</p>
        <h3 className="mx-auto mt-24 max-w-[1400px] px-6 text-balance text-center font-medium tracking-[0] leading-[1.1] text-[clamp(32px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
          Built for who you are. Ready for <span style={{ color: COLORS.blue }}>who you become.</span>
        </h3>
      </div>
    </section>
  );
}

/* 08 · TRUST — Apple's values-band anatomy: the rotating word headline over
   a quiet #F5F5F7 band, then three STATIC white tiles (the measured Apple
   tile: 18px radius, flush-top photo, padded text block below, 20–24px
   gaps). No carousel chrome — Apple's tiles sit still and let the reader
   move. */
const LXTrustCard = React.memo(function LXTrustCard({ card, image }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[18px] bg-white">
      <img src={image} alt={card.alt} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover" />
      {/* the caption lives in its own padded block below the media — Apple's
          line-up tile anatomy; the tile itself carries the surface, so no
          contrast chip or shadow is needed */}
      <div className="flex flex-1 flex-col px-7 pb-8 pt-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.chipBg, color: COLORS.blue }}>
          <card.Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <h3 className="mt-4 font-semibold tracking-[0.007em] leading-[1.14] text-[clamp(21px,1.7vw,24px)]" style={{ color: COLORS.ink }}>{card.title}</h3>
        <p className="mt-2 font-normal tracking-[0] leading-[1.47] text-[clamp(14px,1vw,16px)]" style={{ color: COLORS.graphite }}>{card.copy}</p>
        <Link to={card.to} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
          {card.link}
          <ChevronIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
});

function LandingTrustSection() {
  const { ref, visible } = useRevealContinuous();
  const { index } = useCycleIndex(LX_TRUST_CARDS.length, TRUST_WORD_MS);
  return (
    <section ref={ref} data-section="08-trust" className="relative z-10 isolate bg-[#F5F5F7] [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center text-[15px] font-normal" style={{ color: COLORS.slate }}>Trust and safety</p>
        <h2 className="mt-3 px-6 text-center font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your{" "}
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{LX_TRUST_WORDS[index]}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[620px] px-6 text-center font-normal tracking-[0] leading-[22px] text-[15px] text-balance" style={{ color: COLORS.slate }}>
          Your learning, conversations, ideas, and progress are personal. Visionary keeps it that way.
        </p>
        <div className="mx-auto mt-14 grid w-full max-w-[1240px] grid-cols-1 gap-5 px-6 lg:mt-16 lg:grid-cols-3 lg:gap-6 lg:px-10">
          {LX_TRUST_CARDS.map((card, i) => (
            <LXTrustCard key={card.title} card={card} image={LX_TRUST_IMG[i]} />
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* 09 · CTA — the closer bookends the hero: the statement on the page's own
   white field, one Apple-black primary pill with the arrow, one quiet path,
   and the reassurance line beneath. No colored field — the black pill is
   the finish, the way the page opened. */
function LandingCTASection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section ref={ref} data-section="09-cta" className="relative z-10 bg-[#f5f5f7] px-6" style={{ fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ${EASE_APPLE} ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-[15px] font-normal" style={{ color: COLORS.slate }}>Start today</p>
        <h2 className="mt-3 font-medium tracking-[-0.009em] leading-[1.06] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Your next step starts here.</h2>
        <p className="mx-auto mt-4 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Ask a question. Explore an idea. Start learning. Visionary is ready when you are.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#121317] px-7 font-medium tracking-[0.24px] text-[1.0625rem] text-white transition-all duration-200 hover:bg-[#2c2d31] hover:scale-[1.01] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">
            Get started
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <Link to="/contact" className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-[#dadce0] bg-white px-7 font-normal tracking-[0.24px] text-[1.0625rem] text-[#121317] transition-colors duration-200 hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">
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
    <div className="page-landing min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
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
      {/* quiet variant: Apple's footer ends the page in air — no giant
          wordmark — the story itself is the signature */}
      <LandingFooter variant="quiet" />
    </div>
  );
}
