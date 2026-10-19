import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import LazyImage from "@/components/landing/LazyImage";
import SpotIllustration from "@/components/landing/SpotIllustration";
import {
  PremiumIntelligenceSection,
  PremiumTrustSection,
  PremiumCTASection,
  PremiumExploreSection,
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
import { ArrowRight, BookOpen, ChevronRight, Eye, Globe2, Layers3 } from "lucide-react";

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

/* The five journeys — the landing's category router. Rendered with the
   accepted line-up module (white cards on the grey ground): the studio
   portrait shows WHOLE on its square field, the same anatomy every persona
   page closes with — one card system across the entire product. */
const ROUTER_IMAGES = [studentmeet, teachermeet, parentmeet, promeet, orgmeet];

const ROUTER_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "See the idea, practise it, and use it in the next thing you build.", alt: "Student studying with books" },
  { slug: "teacher", chip: "Teacher", copy: "Plan, explain, and check understanding while the lesson is still in front of you.", alt: "Teacher presenting at a whiteboard" },
  { slug: "parent", chip: "Parent", copy: "See the progress behind the report and find a useful next step at home.", alt: "Parent helping child with homework" },
  { slug: "professional", chip: "Professional", copy: "Turn a question, project, or new skill into work you can use.", alt: "Professional writing notes beside a laptop" },
  { slug: "organization", chip: "Organization", copy: "Give teams a shared view of learning across people, projects, and time.", alt: "Leader reviewing team progress on a tablet" },
];

/* The suite — the four doors around the product (Apple's services row):
   every line is the destination page's own hero statement, the card
   anatomy is the About page's explore module (white cards on the grey
   ground, spot-illustration field, cutout arrow). */
const SUITE_TILES = [
  { to: "/download", label: "Download", copy: "Get Visionary on every device.", subject: "download" },
  { to: "/pricing", label: "Pricing", copy: "Plans for every journey.", subject: "tag" },
  { to: "/help", label: "Help", copy: "Find your answer.", subject: "help" },
  { to: "/updates", label: "Updates", copy: "What's new at Visionary.", subject: "updates" },
];

/* The mechanism chapter's four beats — the umbrella voice of the loop every
   category page is built around. Verbatim from the student page's
   INTELLIGENCE_STEPS: the front door shows the mark once, for everyone. */
const INTELLIGENCE_STEPS = [
  { title: "Understand what you're learning.", copy: "Visionary continues from where you are, and every lesson becomes understanding." },
  { title: "See it. Hear it.\nAsk it another way.", copy: "Open today's lesson. Visionary already understands where you are and where you're going next." },
  { title: "Practice what you're learning.", copy: "Every answer becomes a chance to practise, with feedback that listens and adapts at your pace." },
  { title: "Build from what you know.", copy: "Turn every lesson into real thinking, projects, and creative work that keeps growing with you." },
];

/* Apple's values anatomy (education-initiative: "Our values lead the way"):
   typographic columns, no icons — the type carries the trust. The front
   door's four values are the four trust pages themselves: Privacy, Safety,
   Security, Accessibility. */
const LX_TRUST_VALUES = [
  { title: "Privacy", copy: "You choose what Visionary remembers and how you use it.", to: "/privacy" },
  { title: "Safety", copy: "Age-aware guidance and human review help keep learning on track.", to: "/safety" },
  { title: "Security", copy: "Secure by design, protected end to end.", to: "/security" },
  { title: "Accessibility", copy: "Help every learner learn how they learn best.", to: "/accessibility" },
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
   back down and lets go as the mechanism chapter answers it below. It rides
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

/* 04 · THE RETURN — the answer to the promise's "what if": what the reader
   gets back. The founder's conviction, verbatim from /research, then the four
   returns of a system that never forgets — hours that stack, a kept place,
   their own language, and progress the people around them can see (the
   Achievement return). Each return carries the site's own block anatomy (the
   journey cells of PersonaSections): the 24px mark, the line, and a quiet
   blue door — every glyph and door label is a mark the category pages already
   use. The chapter closes on the site's route-links line, so every journey
   relates itself where the returns are stated. Typographic columns on the
   Education editorial spine — the trust chapter's own anatomy around the
   marks. */
const LX_RETURNS = [
  { Icon: Layers3, title: "Your hours stack.", copy: "Every lesson builds on the last. This year's work becomes next year's strength.", l: "For students", to: "/student" },
  { Icon: BookOpen, title: "Your place is kept.", copy: "Visionary remembers where you stopped, so every session continues.", l: "Your continuity", to: "/how-it-works" },
  { Icon: Globe2, title: "Your language works.", copy: "Ask, reason, and learn in the language you think in — English, Hindi, and Bengali today.", l: "Language support", to: "/how-it-works" },
  { Icon: Eye, title: "Your progress shows.", copy: "Teachers and parents see progress while it still matters.", l: "For parents", to: "/parent" },
];

/* The return chapter's closing line — the five journeys, labelled exactly as
   the footer and the CTA chapter's route-links label them. */
const LX_RETURN_ROUTES = [
  { label: "Students", to: "/student" },
  { label: "Teachers", to: "/teacher" },
  { label: "Parents", to: "/parent" },
  { label: "Professionals", to: "/professional" },
  { label: "Organizations", to: "/organization" },
];

function LandingReturnSection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section ref={ref} data-section="04-return" className="relative isolate bg-white [overflow-x:clip]" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <div className="public-editorial-frame mx-auto">
          <p className="text-[17px] font-medium" style={{ color: COLORS.graphite }}>What you get</p>
          <figure className="m-0">
            <blockquote className="mt-[clamp(20px,2.6vw,32px)]">
              <p className="text-balance font-medium tracking-[-0.015em] leading-[1.28] text-[clamp(26px,2.8vw,40px)]" style={{ color: COLORS.ink, maxWidth: "32ch" }}>“A person should not have to start over every time life asks them to learn something new.”</p>
            </blockquote>
            <figcaption className="mt-5 text-[15px] font-normal" style={{ color: COLORS.slate }}>
              Md Shahid Ali · Founder and CEO
            </figcaption>
          </figure>
          {/* four columns turn on with the desktop editorial spine (1069px),
              the site's own tablet/desktop boundary — below it the returns
              stack on the tablet spine exactly as the sibling chapters do */}
          <div className="mt-14 grid grid-cols-1 min-[1069px]:mt-20 min-[1069px]:grid-cols-4">
            {LX_RETURNS.map((item, i) => (
              <article
                key={item.title}
                className={`py-10 first:pt-0 min-[1069px]:py-0 min-[1069px]:px-10 min-[1069px]:first:pl-0 min-[1069px]:last:pr-0 ${i > 0 ? "border-t min-[1069px]:border-t-0 min-[1069px]:border-l" : ""}`}
                style={{ borderColor: `${COLORS.ink}1A` }}
              >
                <item.Icon aria-hidden="true" className="mb-3 h-6 w-6" strokeWidth={1.75} style={{ color: COLORS.ink }} />
                <h3 data-type="value-title" className="mt-0" style={{ color: COLORS.ink }}>{item.title}</h3>
                <p data-type="value-body" className="max-w-[35ch]" style={{ color: COLORS.slate }}>{item.copy}</p>
                {/* the editorial link law owns the door's colour and hover
                    underline (#0066cc / underlined), exactly as it owns the
                    journey line below */}
                <Link
                  to={item.to}
                  className="mt-3 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                >
                  {item.l}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
          {/* the chapter's own baseline — the five journeys, in the site's
              route-links pattern: every category relates itself where the
              returns are stated */}
          <p className="mt-10 text-[15px] leading-[1.5] lg:mt-12" style={{ color: COLORS.slate }}>
            See how it works for{" "}
            {LX_RETURN_ROUTES.map((route, i) => (
              <React.Fragment key={route.to}>
                <Link
                  to={route.to}
                  className="rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                >
                  {route.label}
                </Link>
                {i < LX_RETURN_ROUTES.length - 1 ? <span aria-hidden="true">{"\u00A0· "}</span> : null}
              </React.Fragment>
            ))}
          </p>
        </div>
      </FadeReveal>
    </section>
  );
}

/* 05 · THE PRODUCT PROMO — the front door's dark pivot: the product's
   statement ("One intelligence.") over one slowly morphing stage, with one
   door out to the full mechanism. The four-beat loop lives where it is told
   in depth — /how-it-works and every category page. Rendered with the
   accepted premium module in promo mode — no new copy. */
function LandingIntelligenceSection() {
  return (
    <PremiumIntelligenceSection
      steps={INTELLIGENCE_STEPS}
      sub="From the first question to using what you know."
      promo
      ctaLabel="See how it works"
      ctaTo="/how-it-works"
    />
  );
}

/* 13 · THE ROUTER — the five journeys, as one line-up. The landing's
   category chapter renders with the accepted explore module verbatim (white
   cards on the #f5f5f7 ground, the studio portrait whole on its square
   field, the quiet blue link) — the same card system every persona page
   closes with, so the product reads as one family. On the landing the
   module is the front door's fork: after the product promo, opening the
   grey catalogue expanse that the suite below continues. The surface
   carries the join — Apple's no-seam law. (The heading lands on the
   64/68 card-chapter tier automatically: the bridge's card-chapter rule
   keys off the line-up's data-card attribute.) */
function LandingRouterSection() {
  return (
    <PremiumExploreSection
      eyebrow="Who it's for"
      heading={<>One intelligence, <span className="accent-gradient">five journeys.</span></>}
      sub="Whether you are learning, teaching, guiding, building, or leading — Visionary adapts to your stage and carries your progress forward."
      categories={ROUTER_CATEGORIES}
      images={ROUTER_IMAGES}
    />
  );
}

/* 14 · THE SUITE — the four doors around the product (Apple's services row):
   Download, Pricing, Help, Updates. Every line is the destination page's own
   hero statement, so the front door invents nothing; the card anatomy is the
   About page's explore module (white cards on the grey ground, cutout arrow)
   so the whole site speaks one card system. The line-up's grey ground
   continues straight through — one catalogue expanse carries the five
   journeys and then the four doors around the product. */
function LandingSuiteSection() {
  const { ref, visible } = useRevealContinuous();

  return (
    <section ref={ref} data-section="14-suite" className="relative isolate bg-[#f5f5f7] [overflow-x:clip]" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible} className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
        <p className="text-[17px] font-medium" style={{ color: COLORS.graphite }}>Explore further</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-12">
          {SUITE_TILES.map((item) => (
            <Link key={item.to} to={item.to} className="group relative grid min-h-[220px] grid-cols-[1fr_130px] overflow-hidden rounded-[20px] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] sm:grid-cols-[1fr_180px]">
              <div className="flex flex-col justify-between p-6 sm:p-8">
                <div>
                  <h3 className="text-[24px] font-normal" style={{ color: COLORS.ink }}>{item.label}</h3>
                  <p className="mt-3 max-w-[300px] text-[15px] leading-[1.6]" style={{ color: COLORS.graphite }}>{item.copy}</p>
                </div>
              </div>
              <div className="flex items-center justify-center bg-[#f5f5f7]">
                <SpotIllustration subject={item.subject} className="h-28 w-28 sm:h-36 sm:w-36" />
              </div>
              {/* google.com card curve — the card's cutout sweeps into the
                  bottom-right corner and the card's arrow floats in it with breath */}
              <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px] bg-white" />
              <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center">
                <ArrowRight className="h-5 w-5 text-[#0b57d0] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════
   The front-door anatomy (the company front door): the family stage
   pins to the viewport, the story glides over it on frosted glass (problem
   — why Visionary exists), the thesis fades up (promise), the return answers
   what the reader gets back (the founder's conviction and the four returns),
   the product promo
   answers it in the dark (intelligence — one door to /how-it-works), the
   five-journey line-up forks, the grey catalogue expanse continues through
   the suite (Download / Pricing / Help / Updates), the four trust values
   close the story (Privacy / Safety / Security / Accessibility), and the
   closer hands the reader their next step. Every module is a door — the
   feature depth lives on the category pages and /how-it-works. */
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
        <LandingReturnSection />
        <LandingIntelligenceSection />
        <LandingRouterSection />
        <LandingSuiteSection />
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
