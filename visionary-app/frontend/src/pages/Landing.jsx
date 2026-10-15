import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import LazyImage from "@/components/landing/LazyImage";
import {
  PremiumLanguageSection,
  PremiumTrustSection,
  PremiumCTASection,
} from "@/components/landing/persona/PremiumPersonaSections";
// Hero images (above the fold) — loaded eagerly with high fetch priority
import studentmeet from "@/assets/student-hero-main-1600w.webp";
import teachermeet from "@/assets/teacher-hero-main-1600w.webp";
import parentmeet from "@/assets/parent-hero-main-1600w.webp";
import promeet from "@/assets/pro-face-main-1600w.webp";
import orgmeet from "@/assets/org-face-main-1600w.webp";
// Problem section images — loaded lazily (below the fold)
import problemunderstanding from "@/assets/problem-understanding.webp";
import teacherProblem from "@/assets/teacher-problem-1.webp";
import problemrevision from "@/assets/problem-revision.webp";
import proProblem from "@/assets/professional-problem-2.webp";
import { Play, Pause } from "lucide-react";

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
  }, [total, intervalMs]);
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
    /* the observer fires on SCROLL so the tabs follow the reader; clicking a
       tab calls setActive directly (see scrollToRow) so the new panel is
       revealed immediately instead of racing the scroll */
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
  const scrollToStep = useCallback((i) => {
    setActive(i);
    /* single-panel tab set: swapping the visible chapter is enough — the
       sticky tab strip stays anchored and the new panel renders below it.
       No page scroll (Apple's product tabs don't yank the reader down on
       a chapter switch). */
  }, []);
  return { active, setStepRef, scrollToStep };
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

/* ═══════════════════════ MODELS ═══════════════════════ */
const PROBLEM_SLIDES = [
  { black: "Teaching everyone is possible.", blue: "Reaching everyone isn't", persona: "A teacher", quote: "I taught the whole class. Half of them still left lost.", image: teacherProblem, alt: "Teacher looking overwhelmed after class" },
  { black: "Seeing progress is easy.", blue: "Knowing how to help isn't", persona: "A parent", quote: "The report card says fine. I still don't know how to help at home.", image: problemrevision, alt: "Parent reviewing a child's progress" },
  { black: "Accessing knowledge is easy.", blue: "Applying it isn't", persona: "A student", quote: "I watched eight hours of videos and still couldn't solve a single problem on my own.", image: problemunderstanding, alt: "Student studying alone with a tablet" },
  { black: "Knowledge is everywhere.", blue: "Turning it into capability isn't", persona: "A professional", quote: "I read every article. I still can't turn them into the work.", image: proProblem, alt: "Professional overwhelmed by learning resources" },
];
const PROBLEM_MS = 4200;

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

// Journey images — lazy-loaded via LazyImage component (below the fold)
const JOURNEY_IMAGE_BASE = "/src/assets/student-";
const JOURNEY_STEPS = [
  { title: "Adapt", copy: "When what you need changes, the way you learn can change with it.", image: "@/assets/student-primary.webp", alt: "Child learning with a tablet outdoors", tone: "light" },
  { title: "Grow", copy: "When you know more, you should be able to go further.", image: "@/assets/student-secondary.webp", alt: "Student growing their skills", tone: "light" },
  { title: "Create", copy: "When an idea becomes real, your intelligence should come with you.", image: "@/assets/student-vocational.webp", alt: "Person building a real project", tone: "light" },
  { title: "Continue", copy: "Wherever you go next, you shouldn't have to begin again.", image: "@/assets/student-higher.webp", alt: "Learner continuing their journey", tone: "dark" },
];
const JOURNEY_CARD_MS = 5000;

/* Apple's values anatomy (education-initiative: "Our values lead the way"):
   typographic columns, no icons — the type carries the trust. */
const LX_TRUST_VALUES = [
  { title: "Privacy", copy: "You choose what Visionary remembers and how you use it.", to: "/privacy" },
  { title: "Safety", copy: "Age-aware guidance and human review help keep learning on track.", to: "/security" },
  { title: "Responsibility", copy: "Visionary helps people learn, work, and create — it never works against them.", to: "/terms" },
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
import { fontStack } from "@/components/landing/system/tokens";

/* Apple's universal hero grammar: a single declarative statement that
   names the product's universal value and every category it serves — the
   same pattern as /education-initiative/ ("Education moves learners, leaders,
   innovators, communities and everyone forward.") and /education ("Designed
   for every kind of learner."). No cycling, no fragmentation — one line,
   one truth. */
/* Apple's universal hero grammar: the product statement stays put on its line
   ("One intelligence"), and the audience line cycles beneath it — for
   students., for teachers., for parents., for professionals., for organizations.
   — the Apple product-hero rhythm (static lead + moving sub-line). */
const LANDING_HERO_WORDS = ["One intelligence"];

/* The cycling audience line below the static statement — the hero names
   every category in turn. NewPersona appends the trailing period itself. */
const HERO_CATEGORY_WORDS = ["for students", "for teachers", "for parents", "for professionals", "for organizations"];

const cutSet = (w480, w800) => `${w480} 480w, ${w800} 800w`;
const LANDING_HERO_LINEUP = [
  { label: "Professional", src: proCut800, srcSet: cutSet(proCut480, proCut800) },
  { label: "Teacher", src: teacherCut800, srcSet: cutSet(teacherCut480, teacherCut800) },
  { label: "Student", src: studentCut800, srcSet: cutSet(studentCut480, studentCut800) },
  { label: "Parent", src: parentCut800, srcSet: cutSet(parentCut480, parentCut800) },
  { label: "Organization", src: orgCut800, srcSet: cutSet(orgCut480, orgCut800) },
];

/* ── HERO ──
   Apple's universal front door: "One intelligence" holds the stage, the
   audience line cycles beneath it, and the five alpha cutouts rise from
   the fold. The CTA pair are the only actions — the story lives below the
   line-up, exactly like an Apple education product hero. */
const LandingHeroSection = React.memo(function LandingHeroSection() {
  return (
    <PersonaHero
      words={LANDING_HERO_WORDS}
      animatedHeadlinePrefix="One intelligence"
      animatedHeadlineWords={HERO_CATEGORY_WORDS}
      srSentence="One intelligence, for students, teachers, parents, professionals, and organizations."
      cast={LANDING_HERO_LINEUP}
      ctaLabel="Start learning"
      secondaryLabel="See how it works"
      minDisplay={42}
      wordMs={2600}
    />
  );
});

/* 02 · PROBLEM — Apple's education-initiative anatomy: one centered
   declarative statement, one cinematic subject, one voice — nothing
   else on the stage. The photography is studio-white, so it renders
   unframed on the page's own white: the subject stands on the section
   floor, edge-to-edge breathing, no card, no crop. The four subjects stay
   mounted and crossfade — the dots let the reader pace it, exactly
   like Apple's "Stories about educators" gallery. */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, 0);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative z-10 overflow-hidden bg-white" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <p className="sr-only">Stories from a teacher, a parent, a student, and a professional about the moment understanding breaks down.</p>
        {/* the section's own compact-band override (bridge: 02-problem) provides
            the chapter's opening/closing breath — no inner padding here */}
        <div className="px-6">
          <p className="text-center text-[15px] font-normal" style={{ color: COLORS.slate }}>Why Visionary exists</p>
          <h2 key={`h-${index}`} className="hero-fade-up mx-auto mt-[clamp(14px,1.8vw,24px)] max-w-[980px] text-balance text-center font-semibold tracking-[-0.009em] leading-[1.05] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
            {slide.black} <span style={{ color: COLORS.blue }}>{slide.blue}</span>.
          </h2>
          <p className="mx-auto mt-[var(--gap-title-sub-display)] max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
            Effort isn't the gap. Knowing whether understanding landed is.
          </p>
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
              <LazyImage
                key={s.alt}
                src={s.image}
                alt={i === index ? s.alt : ""}
                aria-hidden={i !== index}
                eager={i === index}
                placeholderBg="transparent"
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
    <section ref={ref} data-section="03-promise" className="relative z-10 bg-white px-6 [overflow-x:clip]" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <h2 className="mx-auto text-balance text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink, maxWidth: "24ch" }}>
          What if your intelligence never forgot{" "}
          <span className="accent-gradient">where you were?</span>
        </h2>
      </FadeReveal>
    </section>
  );
}

/* 04 · CATEGORY LINE-UP — Apple's product-page grid anatomy
   (measured on /education: "From grade school to grad school."): the
   chapter opener, then a clean row of category cards — each a full-bleed
   image, a title, a subtitle, and a quiet "Learn more" link. No frosted
   tab strip, no cycling words, no scroll-sync: the reader scans and clicks.
   Apple's card law: the image fills the frame, text sits beneath it, no
   overlay, no scrim. */
const CategoryGridCard = React.memo(function CategoryGridCard({ title, subtitle, image, to, alt }) {
  return (
    <Link
      to={to}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
    >
      <figure className="m-0">
        <div className="relative overflow-hidden" style={{ borderRadius: "var(--radius-media)" }}>
          <img
            src={image}
            alt={alt}
            loading="lazy"
            decoding="async"
            draggable="false"
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            style={{ aspectRatio: "16/9" }}
          />
        </div>
        <figcaption className="mt-6">
          <h3 className="font-semibold tracking-[-0.002em] leading-[1.14] text-[clamp(22px,1.5vw,28px)]" style={{ color: COLORS.ink }}>
            {title}
          </h3>
          <p className="mt-2 max-w-[24ch] font-normal tracking-[0] leading-[1.4] text-[17px]" style={{ color: COLORS.graphite }}>
            {subtitle}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-[17px] font-normal" style={{ color: COLORS.blue }}>
            Learn more
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </figcaption>
      </figure>
    </Link>
  );
});

/* The category cards mapped from MEET_SECTIONS with their persona images */
const CATEGORY_CARDS = MEET_SECTIONS.map((s, i) => ({
  title: s.tab,
  subtitle: s.copy,
  image: MEET_IMG[i],
  alt: s.alt,
  to: s.to,
}));

function LandingCategorySection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section ref={ref} data-section="04-meet" className="relative z-10 bg-white" style={{ fontFamily: fontStack }}>
      <div className="px-6">
        <FadeReveal visible={visible}>
          <p className="text-center text-[17px] font-medium" style={{ color: COLORS.slate }}>Who it's for</p>
          <h2 className="mx-auto mt-[var(--gap-eyebrow-title-display)] text-balance text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink, maxWidth: "24ch" }}>
            One intelligence, five journeys.
          </h2>
          <p className="mx-auto mt-[var(--gap-title-sub-display)] max-w-[720px] text-center font-normal tracking-[0] leading-[1.4] text-[18px]" style={{ color: COLORS.slate }}>
            Whether you are learning, teaching, guiding, building, or leading — Visionary adapts to your stage and carries your progress forward.
          </p>
        </FadeReveal>
      </div>

      {/* Apple's product grid: 3-up on desktop, 2-up on tablet, 1-on-phone.
           Each card: full-bleed image, title, subtitle, "Learn more" link.
           No border, no shadow, no chrome — the grid's own whitespace
           carries the rhythm (Apple's measured 48px gap between cards). */}
      <div className="mx-auto mt-20 grid w-full max-w-[1260px] grid-cols-1 gap-8 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12 lg:px-0">
        {CATEGORY_CARDS.map((card) => (
          <CategoryGridCard
            key={card.title}
            title={card.title}
            subtitle={card.subtitle}
            image={card.image}
            alt={card.alt}
            to={card.to}
          />
        ))}
      </div>
    </section>
  );
}
/* 06 · THE JOURNEY — Apple's education-initiative chapter anatomy: a left-aligned
   statement on the 40px highlights tier (32px on phones) that sits on Apple's
   measured content frame, then a VERTICAL stack of full-bleed story cards.
   Apple ed-initiative renders these as centered 980px media cards (border-
   radius 30px) with a one-line caption overlaid on the image — NOT a horizontal
   carousel, NOT text-below-photo. The reader scrolls down through the journey
   (no autoplay, no carousel chrome); each card lands full-bleed and the eye
   rests on the next. Caption lives ON the media (bottom-left), dark media
   flips to white type. This is how an Apple premium story steps: one beat,
   then a breath, then the next — the reader paces it, it does not pace itself. */
function LandingJourneySection() {
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useRevealContinuous();
  const trackRef = useRef(null);
  const lockRef = useRef(0);
  const rafRef = useRef(0);
  const [active, setActive] = useState(0);
  /* the journey starts paused — Apple galleries are reader-paced; the play
     control opts in to the tour, it does not ambush it. */
  const [playing, setPlaying] = useState(false);

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
    <section ref={ref} data-section="06-journey" className="relative z-10 bg-white [overflow-x:clip]" style={{ fontFamily: fontStack }}>
      <div className={`transition-all duration-700 ${EASE_APPLE} ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        {/* the header — Apple's "Get the highlights." treatment: the statement
            alone, LEFT-aligned, on the 40px highlights tier (32px on phones).
            From lg it sits on Apple's measured page gutter (left: 90px @1440,
            6.25vw — measured live on /education/k12/) instead of hugging the
            viewport edge, and the first card of the slide starts EXACTLY at
            the heading's left edge — the track carries the same gutter, so
            heading and cards share one spine. Apple's 40px tier carries zero
            tracking (measured Oct 2026). */}
        <div className="mx-auto w-full px-6 min-[735px]:max-w-[692px] min-[735px]:px-0 min-[1069px]:max-w-[980px]">
          <h2 className="text-balance font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink, maxWidth: "24ch" }}>
            Life changes. Visionary keeps pace.
          </h2>
          <p className="mt-[var(--gap-title-sub-display)] max-w-[40ch] text-balance font-normal tracking-[0] leading-[1.4] text-[18px]" style={{ color: COLORS.grey }}>
            When your world changes, the way you learn can change with it — and your progress comes along.
          </p>
        </div>
        {/* the card slide — the track bleeds to the viewport edge so the next
            card peeks, inviting the reader on (the Apple gallery signature) */}
        <div ref={trackRef} onScroll={onScroll} role="group" aria-roledescription="carousel" aria-label="The journey, one step at a time"
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 [scrollbar-width:none] sm:mt-16 [&::-webkit-scrollbar]:hidden [scroll-padding-left:24px] min-[735px]:[padding-left:calc((100vw_-_692px)/2)] min-[735px]:[scroll-padding-left:calc((100vw_-_692px)/2)] min-[1069px]:[padding-left:calc((100vw_-_980px)/2)] min-[1069px]:[scroll-padding-left:calc((100vw_-_980px)/2)]"
          style={{ paddingRight: 24 }}>
          {JOURNEY_STEPS.map((s, i) => (
              <figure key={s.title} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${JOURNEY_STEPS.length}: ${s.title}`}
                className="relative m-0 flex w-[78%] flex-none snap-start flex-col overflow-hidden rounded-[18px] bg-[#F5F5F7] sm:w-[46%] lg:w-[56%] lg:max-w-[840px]">
                <LazyImage src={s.image} alt={s.alt} eager={i === 0} decoding="async" draggable="false" placeholderBg="#f5f5f7"
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
        <h3 className="mx-auto mt-24 max-w-[24ch] px-6 text-balance text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
          Built for who you are. Ready for <span style={{ color: COLORS.blue }}>who you become.</span>
        </h3>
      </div>
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════
   The Vision Pro anatomy: the family stage pins to the viewport, the
   story glides over it on frosted glass (problem), the thesis fades up
   (promise), the category grid (line-up), the journey, the language
   chapter, trust, and the blue closer. */
export default function LandingPage() {
  return (
    <div className="page-landing min-h-screen bg-white" style={{ fontFamily: fontStack }}>
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
        <LandingCategorySection />
        <LandingJourneySection />
        <PremiumLanguageSection
          chips={LG_CHIPS}
          questions={LG_QUESTIONS}
          eyebrow="In your voice"
          line1="Every language."
          accent="One understanding"
          tail="."
          sub="Ask in the language you think in. The understanding that comes back is the same."
        />
        <PremiumTrustSection
          heading={<>Your learning stays <span className="accent-gradient">yours.</span></>}
          sub="Your questions, conversations, ideas, and progress are personal. Visionary keeps it that way."
          values={LX_TRUST_VALUES}
        />
        <PremiumCTASection
          heading="Your next step starts here."
          sub="Ask a question. Explore an idea. Start learning. Visionary is ready when you are."
        />
      </main>
      {/* quiet variant: Apple's footer ends the page in air — no giant
          wordmark — the story itself is the signature */}
      <LandingFooter variant="quiet" />
    </div>
  );
}
